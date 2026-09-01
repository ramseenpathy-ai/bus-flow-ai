import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  if (e1 < s1) {
    return !(e2 <= s1 || s2 >= e1);
  }
  return s1 < e2 && s2 < e1;
}

// Get all duties
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("duties").collect();
  },
});

// Get duties by date
export const listByDate = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("duties")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
  },
});

// Get duties by crew
export const listByCrew = query({
  args: { crewId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("duties")
      .withIndex("by_crew", (q) => q.eq("crewId", args.crewId))
      .collect();
  },
});

// Create a duty (linked or unlinked)
export const create = mutation({
  args: {
    routeId: v.string(),
    busId: v.optional(v.string()),
    crewId: v.optional(v.string()),
    startTime: v.string(),
    endTime: v.string(),
    mode: v.string(),
    date: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check for crew double-booking
    if (args.crewId) {
      const crewDuties = await ctx.db
        .query("duties")
        .withIndex("by_crew", (q) => q.eq("crewId", args.crewId))
        .collect();

      const conflictingCrew = crewDuties.find(
        (d) => d.status !== "cancelled" && d.date === args.date && isTimeOverlap(args.startTime, args.endTime, d.startTime, d.endTime)
      );
      if (conflictingCrew) {
        throw new Error(`Crew member is already assigned from ${conflictingCrew.startTime} to ${conflictingCrew.endTime} on ${args.date}`);
      }
    }

    // Check for bus double-booking
    if (args.busId) {
      const busDuties = await ctx.db
        .query("duties")
        .withIndex("by_bus", (q) => q.eq("busId", args.busId))
        .collect();

      const conflictingBus = busDuties.find(
        (d) => d.status !== "cancelled" && d.date === args.date && isTimeOverlap(args.startTime, args.endTime, d.startTime, d.endTime)
      );
      if (conflictingBus) {
        throw new Error(`Bus is already assigned from ${conflictingBus.startTime} to ${conflictingBus.endTime} on ${args.date}`);
      }
    }

    return await ctx.db.insert("duties", {
      ...args,
      mode: args.mode as any,
      status: "scheduled" as any,
    });
  },
});

// Update a duty
export const update = mutation({
  args: {
    id: v.id("duties"),
    busId: v.optional(v.string()),
    crewId: v.optional(v.string()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    status: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filtered: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) filtered[key] = value;
    }
    if (filtered.status) filtered.status = filtered.status as any;
    await ctx.db.patch(id, filtered);
  },
});

// Delete a duty
export const remove = mutation({
  args: { id: v.id("duties") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Smart conflict detection for all scheduling
export const detectConflicts = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    const duties = await ctx.db
      .query("duties")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();

    const conflicts: Array<{
      type: string;
      description: string;
      severity: "high" | "medium" | "low";
      relatedDuties: string[];
      fallbackSuggestions: string[];
    }> = [];

    // Check crew double-booking
    const crewDutiesMap = new Map<string, typeof duties>();
    for (const duty of duties) {
      if (!duty.crewId) continue;
      const existing = crewDutiesMap.get(duty.crewId) || [];
      existing.push(duty);
      crewDutiesMap.set(duty.crewId, existing);
    }

    for (const [crewId, crewDuties] of crewDutiesMap) {
      for (let i = 0; i < crewDuties.length; i++) {
        for (let j = i + 1; j < crewDuties.length; j++) {
          if (crewDuties[i].status === "cancelled" || crewDuties[j].status === "cancelled") continue;
          if (isTimeOverlap(crewDuties[i].startTime, crewDuties[i].endTime, crewDuties[j].startTime, crewDuties[j].endTime)) {
            conflicts.push({
              type: "crew_double_booking",
              description: `Crew member ${crewId} is double-booked from ${crewDuties[i].startTime}-${crewDuties[i].endTime} and ${crewDuties[j].startTime}-${crewDuties[j].endTime}`,
              severity: "high",
              relatedDuties: [crewDuties[i]._id, crewDuties[j]._id],
              fallbackSuggestions: [
                "Assign another available crew member",
                "Delay one of the duties",
                "Cancel the lower-priority duty",
              ],
            });
          }
        }
      }
    }

    // Check bus double-booking
    const busDutiesMap = new Map<string, typeof duties>();
    for (const duty of duties) {
      if (!duty.busId) continue;
      const existing = busDutiesMap.get(duty.busId) || [];
      existing.push(duty);
      busDutiesMap.set(duty.busId, existing);
    }

    for (const [busId, busDuties] of busDutiesMap) {
      for (let i = 0; i < busDuties.length; i++) {
        for (let j = i + 1; j < busDuties.length; j++) {
          if (busDuties[i].status === "cancelled" || busDuties[j].status === "cancelled") continue;
          if (isTimeOverlap(busDuties[i].startTime, busDuties[i].endTime, busDuties[j].startTime, busDuties[j].endTime)) {
            conflicts.push({
              type: "bus_double_booking",
              description: `Bus ${busId} is double-booked from ${busDuties[i].startTime}-${busDuties[i].endTime} and ${busDuties[j].startTime}-${busDuties[j].endTime}`,
              severity: "high",
              relatedDuties: [busDuties[i]._id, busDuties[j]._id],
              fallbackSuggestions: [
                "Assign another available bus",
                "Reschedule one of the duties",
                "Move duty to a different bus",
              ],
            });
          }
        }
      }
    }

    // Check missing assignments
    for (const duty of duties) {
      if (duty.status === "cancelled") continue;
      if (!duty.crewId) {
        conflicts.push({
          type: "missing_crew_assignment",
          description: `Duty on route ${duty.routeId} from ${duty.startTime}-${duty.endTime} has no crew assigned`,
          severity: "medium",
          relatedDuties: [duty._id],
          fallbackSuggestions: [
            "Assign an available crew member",
            "Flag for manual intervention",
          ],
        });
      }
      if (!duty.busId) {
        conflicts.push({
          type: "missing_bus_assignment",
          description: `Duty on route ${duty.routeId} from ${duty.startTime}-${duty.endTime} has no bus assigned`,
          severity: "medium",
          relatedDuties: [duty._id],
          fallbackSuggestions: [
            "Assign an available bus",
            "Flag for manual intervention",
          ],
        });
      }
    }

    // Check insufficient rest for crew
    for (const duty of duties) {
      if (!duty.crewId || duty.status === "cancelled") continue;
      const crew = await ctx.db
        .query("crew")
        .withIndex("by_crewId", (q) => q.eq("crewId", duty.crewId!))
        .first();

      if (crew && crew.lastCompletedDuty) {
        const dutyStartMinutes = timeToMinutes(duty.startTime);
        const lastDutyDate = new Date(crew.lastCompletedDuty);
        const lastDutyEndMinutes = lastDutyDate.getHours() * 60 + lastDutyDate.getMinutes();
        const hoursSinceLastDuty = (dutyStartMinutes - lastDutyEndMinutes + 24 * 60) % (24 * 60) / 60;

        if (hoursSinceLastDuty < crew.requiredRestPeriod) {
          conflicts.push({
            type: "insufficient_rest",
            description: `${crew.name} has insufficient rest. ${Math.round(hoursSinceLastDuty * 10) / 10}h since last duty, ${crew.requiredRestPeriod}h required`,
            severity: "high",
            relatedDuties: [duty._id],
            fallbackSuggestions: [
              "Assign another rested crew member",
              `Delay duty until ${new Date(Date.now() + (crew.requiredRestPeriod - hoursSinceLastDuty) * 60 * 60 * 1000).toLocaleTimeString()}`,
              "Flag route for manual intervention",
            ],
          });
        }
      }
    }

    return conflicts;
  },
});

// Fallback handler: suggests alternatives when ideal solution fails
export const getFallbackSuggestions = query({
  args: {
    routeId: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const suggestions: Array<{
      type: string;
      message: string;
      actionable: boolean;
    }> = [];

    // Find available crew
    const allCrew = await ctx.db.query("crew").collect();
    const duties = await ctx.db
      .query("duties")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();

    const busyCrewIds = new Set(
      duties
        .filter((d) => d.status !== "cancelled" && d.crewId && isTimeOverlap(args.startTime, args.endTime, d.startTime, args.endTime))
        .map((d) => d.crewId)
    );

    const availableCrew = allCrew.filter((c) => {
      if (!c.crewId) return false;
      if (busyCrewIds.has(c.crewId)) return false;
      if (c.availability === "resting" || c.availability === "off_duty") return false;
      return true;
    });

    if (availableCrew.length > 0) {
      suggestions.push({
        type: "assign_crew",
        message: `Assign ${availableCrew[0].name} (${availableCrew[0].crewId}) who is available`,
        actionable: true,
      });
    }

    // Find available buses
    const allBuses = await ctx.db.query("buses").collect();
    const busyBusIds = new Set(
      duties
        .filter((d) => d.status !== "cancelled" && d.busId && isTimeOverlap(args.startTime, args.endTime, d.startTime, d.endTime))
        .map((d) => d.busId)
    );

    const availableBuses = allBuses.filter((b) => {
      if (busyBusIds.has(b.busId)) return false;
      if (b.currentStatus === "maintenance" || b.currentStatus === "off_duty") return false;
      return true;
    });

    if (availableBuses.length > 0) {
      suggestions.push({
        type: "assign_bus",
        message: `Use bus ${availableBuses[0].busId} (${availableBuses[0].capacity} seats)`,
        actionable: true,
      });
    }

    // Always suggest delay and manual intervention
    suggestions.push({
      type: "delay",
      message: "Delay the duty to a later time slot",
      actionable: false,
    });
    suggestions.push({
      type: "manual",
      message: "Flag this route for manual intervention",
      actionable: false,
    });

    return suggestions;
  },
});

// Seed demo data
export const seed = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if data already exists
    const existingRoutes = await ctx.db.query("routes").first();
    if (existingRoutes) return "Data already seeded";

    // Seed routes
    const routes = [
      { routeId: "R-01", name: "Downtown Express", startPoint: "Central Station", endPoint: "City Hall", stops: ["Market St", "Library", "Plaza"], estimatedTravelTime: 35, status: "active" as const, coordinates: [{ lat: 40.7128, lng: -74.006 }, { lat: 40.7138, lng: -74.003 }, { lat: 40.7148, lng: -74.0 }] },
      { routeId: "R-02", name: "Harbor Line", startPoint: "Ferry Terminal", endPoint: "Industrial Zone", stops: ["Pier 5", "Warehouse Dist", "Factory Row"], estimatedTravelTime: 45, status: "active" as const, coordinates: [{ lat: 40.6892, lng: -74.0445 }, { lat: 40.692, lng: -74.04 }, { lat: 40.695, lng: -74.035 }] },
      { routeId: "R-03", name: "University Loop", startPoint: "University Gate", endPoint: "Student Union", stops: ["Science Block", "Arts Center", "Sports Complex"], estimatedTravelTime: 25, status: "active" as const, coordinates: [{ lat: 40.7291, lng: -73.9965 }, { lat: 40.7301, lng: -73.9945 }, { lat: 40.7311, lng: -73.9925 }] },
      { routeId: "R-04", name: "Airport Shuttle", startPoint: "Main Station", endPoint: "Airport T2", stops: ["Highway Junction", "Terminal 1"], estimatedTravelTime: 60, status: "active" as const, coordinates: [{ lat: 40.7128, lng: -74.006 }, { lat: 40.6501, lng: -73.7781 }, { lat: 40.6413, lng: -73.7781 }] },
      { routeId: "R-05", name: "Riverside Route", startPoint: "North Bridge", endPoint: "South Park", stops: ["River Walk", "Museum", "Botanic Garden"], estimatedTravelTime: 40, status: "proposed" as const, coordinates: [{ lat: 40.7359, lng: -73.9911 }, { lat: 40.7349, lng: -73.9891 }, { lat: 40.7339, lng: -73.9871 }] },
    ];

    for (const route of routes) {
      await ctx.db.insert("routes", {
        routeId: route.routeId,
        name: route.name,
        startPoint: route.startPoint,
        endPoint: route.endPoint,
        stops: route.stops,
        estimatedTravelTime: route.estimatedTravelTime,
        status: route.status,
        coordinates: route.coordinates,
        operatingHours: { start: "06:00", end: "22:00" },
        createdBy: "system",
      });
    }

    // Seed crew
    const crewMembers = [
      { crewId: "C-101", name: "Alex Johnson", role: "Driver", assignedDepot: "Central Depot", availability: "available" as const, requiredRestPeriod: 8, phone: "555-0101" },
      { crewId: "C-102", name: "Maria Garcia", role: "Driver", assignedDepot: "Central Depot", availability: "on_duty" as const, dutyStartTime: "06:00", dutyEndTime: "14:00", requiredRestPeriod: 8, phone: "555-0102" },
      { crewId: "C-103", name: "James Wilson", role: "Conductor", assignedDepot: "Harbor Depot", availability: "available" as const, requiredRestPeriod: 8, phone: "555-0103" },
      { crewId: "C-104", name: "Sarah Lee", role: "Driver", assignedDepot: "Central Depot", availability: "resting" as const, lastCompletedDuty: Date.now() - 6 * 60 * 60 * 1000, dutyStartTime: "22:00", dutyEndTime: "06:00", requiredRestPeriod: 8, phone: "555-0104" },
      { crewId: "C-105", name: "David Brown", role: "Driver", assignedDepot: "University Depot", availability: "available" as const, requiredRestPeriod: 8, phone: "555-0105" },
      { crewId: "C-106", name: "Emma Davis", role: "Conductor", assignedDepot: "Central Depot", availability: "available" as const, requiredRestPeriod: 8, phone: "555-0106" },
      { crewId: "C-107", name: "Robert Martinez", role: "Driver", assignedDepot: "Airport Depot", availability: "on_duty" as const, dutyStartTime: "08:00", dutyEndTime: "16:00", requiredRestPeriod: 8, phone: "555-0107" },
      { crewId: "C-108", name: "Jennifer Taylor", role: "Driver", assignedDepot: "Central Depot", availability: "off_duty" as const, requiredRestPeriod: 8, phone: "555-0108" },
    ];

    for (const crew of crewMembers) {
      await ctx.db.insert("crew", { ...crew, currentAssignment: undefined });
    }

    // Seed buses
    const buses = [
      { busId: "B-001", capacity: 45, currentStatus: "available" as const, depot: "Central Depot" },
      { busId: "B-002", capacity: 45, currentStatus: "on_route" as const, depot: "Central Depot", assignedRoute: "R-01", assignedDuty: undefined },
      { busId: "B-003", capacity: 40, currentStatus: "available" as const, depot: "Harbor Depot" },
      { busId: "B-004", capacity: 50, currentStatus: "maintenance" as const, depot: "Central Depot", maintenanceStatus: "Scheduled brake service" },
      { busId: "B-005", capacity: 40, currentStatus: "available" as const, depot: "University Depot" },
      { busId: "B-006", capacity: 50, currentStatus: "available" as const, depot: "Airport Depot" },
      { busId: "B-007", capacity: 35, currentStatus: "on_route" as const, depot: "Central Depot", assignedRoute: "R-03" },
      { busId: "B-008", capacity: 45, currentStatus: "available" as const, depot: "Central Depot" },
    ];

    for (const bus of buses) {
      await ctx.db.insert("buses", {
        ...bus,
        availabilityTime: undefined,
        lastMaintenance: undefined,
      });
    }

    // Seed duties
    const today = new Date().toISOString().split("T")[0];
    const duties = [
      { routeId: "R-01", busId: "B-002", crewId: "C-102", startTime: "06:00", endTime: "14:00", mode: "linked" as const, date: today },
      { routeId: "R-01", busId: "B-001", crewId: "C-101", startTime: "14:00", endTime: "22:00", mode: "linked" as const, date: today },
      { routeId: "R-02", busId: "B-003", crewId: "C-103", startTime: "06:00", endTime: "14:00", mode: "linked" as const, date: today },
      { routeId: "R-03", busId: "B-007", crewId: "C-105", startTime: "08:00", endTime: "16:00", mode: "linked" as const, date: today },
      { routeId: "R-04", busId: "B-006", crewId: "C-107", startTime: "06:00", endTime: "14:00", mode: "unlinked" as const, date: today },
      { routeId: "R-05", busId: undefined, crewId: undefined, startTime: "10:00", endTime: "16:00", mode: "unlinked" as const, date: today },
    ];

    for (const duty of duties) {
      await ctx.db.insert("duties", {
        ...duty,
        status: "scheduled" as const,
        notes: undefined,
      });
    }

    return "Seeded successfully";
  },
});
