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
    // Check if Chennai routes already exist
    const chennaiRoute21G = await ctx.db.query("routes").withIndex("by_routeId", (q) => q.eq("routeId", "21G")).first();
    if (chennaiRoute21G) return "Chennai data already seeded";

    // Migrate: delete old demo routes if they exist
    const allExistingRoutes = await ctx.db.query("routes").collect();
    for (const oldRoute of allExistingRoutes) {
      await ctx.db.delete(oldRoute._id);
    }

    // Chennai MTC Routes — 20 realistic default routes
    const chennaiRoutes = [
      { routeId: "21G", name: "Tambaram – Broadway", startPoint: "Tambaram", endPoint: "Broadway", stops: ["Tambaram", "Chromepet", "Pallavaram", "Guindy", "Saidapet", "T. Nagar", "Broadway"], estimatedTravelTime: 75, estimatedDistance: 30, routeType: "Ordinary", passengerLoad: "High", busCount: 12, coordinates: [{ lat: 12.9249, lng: 80.1000 }, { lat: 12.9500, lng: 80.1130 }, { lat: 12.9670, lng: 80.1350 }, { lat: 12.9825, lng: 80.1640 }, { lat: 13.0010, lng: 80.1900 }, { lat: 13.0390, lng: 80.2340 }, { lat: 13.0878, lng: 80.2785 }] },
      { routeId: "29C", name: "Perambur – Besant Nagar", startPoint: "Perambur", endPoint: "Besant Nagar", stops: ["Perambur", "Ayanavaram", "Egmore", "Central", "Saidapet", "Adyar", "Besant Nagar"], estimatedTravelTime: 65, estimatedDistance: 20, routeType: "Ordinary", passengerLoad: "High", busCount: 9, coordinates: [{ lat: 13.1136, lng: 80.2337 }, { lat: 13.1020, lng: 80.2350 }, { lat: 13.0790, lng: 80.2550 }, { lat: 13.0800, lng: 80.2700 }, { lat: 13.0010, lng: 80.1900 }, { lat: 13.0062, lng: 80.2570 }, { lat: 12.9988, lng: 80.2676 }] },
      { routeId: "51", name: "Tambaram – Velachery", startPoint: "Tambaram", endPoint: "Velachery", stops: ["Tambaram", "Camp Road", "Medavakkam", "Pallikaranai", "Velachery"], estimatedTravelTime: 55, estimatedDistance: 20, routeType: "Ordinary", passengerLoad: "Medium", busCount: 8, coordinates: [{ lat: 12.9249, lng: 80.1000 }, { lat: 12.9390, lng: 80.1200 }, { lat: 12.9600, lng: 80.1500 }, { lat: 12.9750, lng: 80.1800 }, { lat: 12.9815, lng: 80.2180 }] },
      { routeId: "60A", name: "Royapuram – Kundrathur", startPoint: "Royapuram", endPoint: "Kundrathur", stops: ["Royapuram", "Parrys", "Central", "Saidapet", "Guindy", "St Thomas Mount", "Pallavaram", "Pammal", "Kundrathur"], estimatedTravelTime: 85, estimatedDistance: 30, routeType: "Ordinary", passengerLoad: "High", busCount: 10, coordinates: [{ lat: 13.1067, lng: 80.2866 }, { lat: 13.0890, lng: 80.2870 }, { lat: 13.0800, lng: 80.2700 }, { lat: 13.0010, lng: 80.1900 }, { lat: 12.9825, lng: 80.1640 }, { lat: 12.9870, lng: 80.1500 }, { lat: 12.9670, lng: 80.1350 }, { lat: 12.9480, lng: 80.1100 }, { lat: 12.9550, lng: 80.0790 }] },
      { routeId: "102", name: "Island Ground – Kelambakkam", startPoint: "Island Ground", endPoint: "Kelambakkam", stops: ["Island Ground", "Secretariat", "Chepauk", "Adyar", "Indira Nagar", "SRP Tools", "Thoraipakkam", "Karapakkam", "Sholinganallur", "Semmancheri", "Navalur", "Kelambakkam"], estimatedTravelTime: 85, estimatedDistance: 35, routeType: "Express", passengerLoad: "High", busCount: 8, coordinates: [{ lat: 13.0820, lng: 80.2838 }, { lat: 13.0800, lng: 80.2800 }, { lat: 13.0680, lng: 80.2780 }, { lat: 13.0062, lng: 80.2570 }, { lat: 13.0030, lng: 80.2480 }, { lat: 12.9890, lng: 80.2460 }, { lat: 12.9700, lng: 80.2430 }, { lat: 12.9580, lng: 80.2420 }, { lat: 12.9100, lng: 80.2400 }, { lat: 12.8920, lng: 80.2430 }, { lat: 12.8780, lng: 80.2480 }, { lat: 12.8480, lng: 80.2550 }] },
      { routeId: "M70", name: "Thiruvanmiyur – Koyambedu", startPoint: "Thiruvanmiyur", endPoint: "Koyambedu", stops: ["Thiruvanmiyur", "Adyar", "Guindy", "Ashok Nagar", "Vadapalani", "Koyambedu"], estimatedTravelTime: 55, estimatedDistance: 18, routeType: "M-Series / Express", passengerLoad: "High", busCount: 7, coordinates: [{ lat: 12.9828, lng: 80.2641 }, { lat: 13.0062, lng: 80.2570 }, { lat: 12.9825, lng: 80.1640 }, { lat: 13.0350, lng: 80.2110 }, { lat: 13.0490, lng: 80.2130 }, { lat: 13.0690, lng: 80.2230 }] },
      { routeId: "E18", name: "Tambaram – Broadway (Express)", startPoint: "Tambaram", endPoint: "Broadway", stops: ["Tambaram", "Pallavaram", "Guindy", "Saidapet", "T. Nagar", "Broadway"], estimatedTravelTime: 70, estimatedDistance: 28, routeType: "Express", passengerLoad: "High", busCount: 9, coordinates: [{ lat: 12.9249, lng: 80.1000 }, { lat: 12.9670, lng: 80.1350 }, { lat: 12.9825, lng: 80.1640 }, { lat: 13.0010, lng: 80.1900 }, { lat: 13.0390, lng: 80.2340 }, { lat: 13.0878, lng: 80.2785 }] },
      { routeId: "147B", name: "Mogappair West – T. Nagar", startPoint: "Mogappair West", endPoint: "T. Nagar", stops: ["Mogappair West", "Anna Nagar", "Aminjikarai", "Vadapalani", "Ashok Nagar", "T. Nagar"], estimatedTravelTime: 50, estimatedDistance: 15, routeType: "Ordinary", passengerLoad: "Medium", busCount: 6, coordinates: [{ lat: 13.0830, lng: 80.2050 }, { lat: 13.0730, lng: 80.2110 }, { lat: 13.0620, lng: 80.2140 }, { lat: 13.0490, lng: 80.2130 }, { lat: 13.0350, lng: 80.2110 }, { lat: 13.0390, lng: 80.2340 }] },
      { routeId: "147C", name: "T. Nagar – Ambattur OT", startPoint: "T. Nagar", endPoint: "Ambattur OT", stops: ["T. Nagar", "Vadapalani", "Anna Nagar", "Mogappair", "Ambattur"], estimatedTravelTime: 55, estimatedDistance: 18, routeType: "Ordinary", passengerLoad: "Medium", busCount: 7, coordinates: [{ lat: 13.0390, lng: 80.2340 }, { lat: 13.0490, lng: 80.2130 }, { lat: 13.0730, lng: 80.2110 }, { lat: 13.0830, lng: 80.2050 }, { lat: 13.0970, lng: 80.1930 }] },
      { routeId: "57F", name: "Broadway – Karanodai", startPoint: "Broadway", endPoint: "Karanodai", stops: ["Broadway", "Central", "Perambur", "Madhavaram", "Red Hills", "Karanodai"], estimatedTravelTime: 80, estimatedDistance: 30, routeType: "Ordinary", passengerLoad: "Medium", busCount: 6, coordinates: [{ lat: 13.0878, lng: 80.2785 }, { lat: 13.0800, lng: 80.2700 }, { lat: 13.1136, lng: 80.2337 }, { lat: 13.1350, lng: 80.2150 }, { lat: 13.1580, lng: 80.2000 }, { lat: 13.1900, lng: 80.1850 }] },
      { routeId: "64C", name: "Manali – Broadway", startPoint: "Manali", endPoint: "Broadway", stops: ["Manali", "Madhavaram", "Tondiarpet", "Royapuram", "Broadway"], estimatedTravelTime: 60, estimatedDistance: 22, routeType: "Ordinary", passengerLoad: "High", busCount: 7, coordinates: [{ lat: 13.1550, lng: 80.2600 }, { lat: 13.1350, lng: 80.2150 }, { lat: 13.1130, lng: 80.2780 }, { lat: 13.1067, lng: 80.2866 }, { lat: 13.0878, lng: 80.2785 }] },
      { routeId: "95", name: "Tambaram – Thiruvanmiyur", startPoint: "Tambaram", endPoint: "Thiruvanmiyur", stops: ["Tambaram", "Pallikaranai", "Velachery", "Taramani", "Thiruvanmiyur"], estimatedTravelTime: 65, estimatedDistance: 24, routeType: "Ordinary", passengerLoad: "Medium", busCount: 6, coordinates: [{ lat: 12.9249, lng: 80.1000 }, { lat: 12.9750, lng: 80.1800 }, { lat: 12.9815, lng: 80.2180 }, { lat: 12.9880, lng: 80.2440 }, { lat: 12.9828, lng: 80.2641 }] },
      { routeId: "99", name: "Tambaram – Adyar", startPoint: "Tambaram", endPoint: "Adyar", stops: ["Tambaram", "Chromepet", "Pallavaram", "Guindy", "Saidapet", "Adyar"], estimatedTravelTime: 65, estimatedDistance: 25, routeType: "Ordinary", passengerLoad: "High", busCount: 8, coordinates: [{ lat: 12.9249, lng: 80.1000 }, { lat: 12.9500, lng: 80.1130 }, { lat: 12.9670, lng: 80.1350 }, { lat: 12.9825, lng: 80.1640 }, { lat: 13.0010, lng: 80.1900 }, { lat: 13.0062, lng: 80.2570 }] },
      { routeId: "101", name: "Poonamallee – Thiruvotriyur", startPoint: "Poonamallee", endPoint: "Thiruvotriyur", stops: ["Poonamallee", "Porur", "Vadapalani", "Koyambedu", "Central", "Broadway", "Tondiarpet", "Thiruvotriyur"], estimatedTravelTime: 90, estimatedDistance: 35, routeType: "Ordinary", passengerLoad: "High", busCount: 9, coordinates: [{ lat: 13.0470, lng: 80.0970 }, { lat: 13.0380, lng: 80.1520 }, { lat: 13.0490, lng: 80.2130 }, { lat: 13.0690, lng: 80.2230 }, { lat: 13.0800, lng: 80.2700 }, { lat: 13.0878, lng: 80.2785 }, { lat: 13.1130, lng: 80.2780 }, { lat: 13.1270, lng: 80.2860 }] },
      { routeId: "121F", name: "Tambaram – Kannagi Nagar", startPoint: "Tambaram", endPoint: "Kannagi Nagar", stops: ["Tambaram", "Pallikaranai", "Velachery", "Sholinganallur", "Semmancheri", "Kannagi Nagar"], estimatedTravelTime: 75, estimatedDistance: 30, routeType: "Ordinary", passengerLoad: "High", busCount: 7, coordinates: [{ lat: 12.9249, lng: 80.1000 }, { lat: 12.9750, lng: 80.1800 }, { lat: 12.9815, lng: 80.2180 }, { lat: 12.9100, lng: 80.2400 }, { lat: 12.8920, lng: 80.2430 }, { lat: 12.8750, lng: 80.2380 }] },
      { routeId: "25G", name: "Poonamallee – Kodambakkam", startPoint: "Poonamallee", endPoint: "Kodambakkam", stops: ["Poonamallee", "Porur", "Valasaravakkam", "Saligramam", "Kodambakkam"], estimatedTravelTime: 55, estimatedDistance: 18, routeType: "Ordinary", passengerLoad: "Medium", busCount: 6, coordinates: [{ lat: 13.0470, lng: 80.0970 }, { lat: 13.0380, lng: 80.1520 }, { lat: 13.0350, lng: 80.1800 }, { lat: 13.0430, lng: 80.1980 }, { lat: 13.0460, lng: 80.2080 }] },
      { routeId: "28", name: "Egmore – Thiruvotriyur", startPoint: "Egmore", endPoint: "Thiruvotriyur", stops: ["Egmore", "Central", "Washermenpet", "Tondiarpet", "Thiruvotriyur"], estimatedTravelTime: 50, estimatedDistance: 17, routeType: "Ordinary", passengerLoad: "High", busCount: 8, coordinates: [{ lat: 13.0790, lng: 80.2550 }, { lat: 13.0800, lng: 80.2700 }, { lat: 13.1000, lng: 80.2780 }, { lat: 13.1130, lng: 80.2780 }, { lat: 13.1270, lng: 80.2860 }] },
      { routeId: "D70", name: "Velachery – Ambattur Industrial Estate", startPoint: "Velachery", endPoint: "Ambattur Industrial Estate", stops: ["Velachery", "Guindy", "Ashok Nagar", "Vadapalani", "Anna Nagar", "Ambattur"], estimatedTravelTime: 70, estimatedDistance: 25, routeType: "Deluxe", passengerLoad: "Medium", busCount: 5, coordinates: [{ lat: 12.9815, lng: 80.2180 }, { lat: 12.9825, lng: 80.1640 }, { lat: 13.0350, lng: 80.2110 }, { lat: 13.0490, lng: 80.2130 }, { lat: 13.0730, lng: 80.2110 }, { lat: 13.0970, lng: 80.1930 }] },
      { routeId: "M1", name: "Keelkattalai – Thiruvanmiyur", startPoint: "Keelkattalai", endPoint: "Thiruvanmiyur", stops: ["Keelkattalai", "Madipakkam", "Velachery", "Taramani", "Thiruvanmiyur"], estimatedTravelTime: 45, estimatedDistance: 15, routeType: "M-Series", passengerLoad: "Medium", busCount: 5, coordinates: [{ lat: 12.9680, lng: 80.1900 }, { lat: 12.9730, lng: 80.2030 }, { lat: 12.9815, lng: 80.2180 }, { lat: 12.9880, lng: 80.2440 }, { lat: 12.9828, lng: 80.2641 }] },
      { routeId: "588", name: "Adyar – Mamallapuram", startPoint: "Adyar", endPoint: "Mamallapuram", stops: ["Adyar", "Thiruvanmiyur", "Sholinganallur", "Kelambakkam", "Kovalam", "Mamallapuram"], estimatedTravelTime: 90, estimatedDistance: 43, routeType: "Express", passengerLoad: "Medium", busCount: 4, coordinates: [{ lat: 13.0062, lng: 80.2570 }, { lat: 12.9828, lng: 80.2641 }, { lat: 12.9100, lng: 80.2400 }, { lat: 12.8480, lng: 80.2550 }, { lat: 12.8000, lng: 80.2400 }, { lat: 12.6167, lng: 80.1990 }] },
    ];

    for (const route of chennaiRoutes) {
      await ctx.db.insert("routes", {
        routeId: route.routeId,
        name: route.name,
        startPoint: route.startPoint,
        endPoint: route.endPoint,
        stops: route.stops,
        estimatedTravelTime: route.estimatedTravelTime,
        estimatedDistance: route.estimatedDistance,
        routeType: route.routeType,
        passengerLoad: route.passengerLoad,
        busCount: route.busCount,
        status: "active" as const,
        coordinates: route.coordinates,
        operatingHours: { start: "06:00", end: "22:00" },
        createdBy: "system",
      });
    }

    // Seed crew — Chennai MTC depot staff
    const crewMembers = [
      { crewId: "C-101", name: "Ravi Kumar", role: "Driver", assignedDepot: "Tambaram Depot", availability: "available" as const, requiredRestPeriod: 8, phone: "98401-00101" },
      { crewId: "C-102", name: "Priya Sharma", role: "Driver", assignedDepot: "Tambaram Depot", availability: "on_duty" as const, dutyStartTime: "06:00", dutyEndTime: "14:00", requiredRestPeriod: 8, phone: "98401-00102" },
      { crewId: "C-103", name: "Suresh Rajan", role: "Conductor", assignedDepot: "Koyambedu Depot", availability: "available" as const, requiredRestPeriod: 8, phone: "98401-00103" },
      { crewId: "C-104", name: "Lakshmi Narayanan", role: "Driver", assignedDepot: "Central Depot", availability: "resting" as const, lastCompletedDuty: Date.now() - 6 * 60 * 60 * 1000, dutyStartTime: "22:00", dutyEndTime: "06:00", requiredRestPeriod: 8, phone: "98401-00104" },
      { crewId: "C-105", name: "Vikram Mohan", role: "Driver", assignedDepot: "Tondiarpet Depot", availability: "available" as const, requiredRestPeriod: 8, phone: "98401-00105" },
      { crewId: "C-106", name: "Anitha Devi", role: "Conductor", assignedDepot: "Central Depot", availability: "available" as const, requiredRestPeriod: 8, phone: "98401-00106" },
      { crewId: "C-107", name: "Karthik Srinivasan", role: "Driver", assignedDepot: "Tondiarpet Depot", availability: "on_duty" as const, dutyStartTime: "08:00", dutyEndTime: "16:00", requiredRestPeriod: 8, phone: "98401-00107" },
      { crewId: "C-108", name: "Meena Kumari", role: "Driver", assignedDepot: "Adyar Depot", availability: "off_duty" as const, requiredRestPeriod: 8, phone: "98401-00108" },
    ];

    for (const crew of crewMembers) {
      await ctx.db.insert("crew", { ...crew, currentAssignment: undefined });
    }

    // Seed buses — Chennai MTC fleet
    const buses = [
      { busId: "TN-01-A-0001", capacity: 50, currentStatus: "available" as const, depot: "Tambaram Depot" },
      { busId: "TN-01-A-0002", capacity: 50, currentStatus: "on_route" as const, depot: "Tambaram Depot", assignedRoute: "21G", assignedDuty: undefined },
      { busId: "TN-01-A-0003", capacity: 45, currentStatus: "available" as const, depot: "Koyambedu Depot" },
      { busId: "TN-01-A-0004", capacity: 55, currentStatus: "maintenance" as const, depot: "Central Depot", maintenanceStatus: "Scheduled brake service" },
      { busId: "TN-01-A-0005", capacity: 45, currentStatus: "available" as const, depot: "Tondiarpet Depot" },
      { busId: "TN-01-A-0006", capacity: 50, currentStatus: "available" as const, depot: "Adyar Depot" },
      { busId: "TN-01-A-0007", capacity: 40, currentStatus: "on_route" as const, depot: "Koyambedu Depot", assignedRoute: "M70" },
      { busId: "TN-01-A-0008", capacity: 50, currentStatus: "available" as const, depot: "Central Depot" },
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
      { routeId: "21G", busId: "TN-01-A-0002", crewId: "C-102", startTime: "06:00", endTime: "14:00", mode: "linked" as const, date: today },
      { routeId: "21G", busId: "TN-01-A-0001", crewId: "C-101", startTime: "14:00", endTime: "22:00", mode: "linked" as const, date: today },
      { routeId: "29C", busId: "TN-01-A-0003", crewId: "C-103", startTime: "06:00", endTime: "14:00", mode: "linked" as const, date: today },
      { routeId: "M70", busId: "TN-01-A-0007", crewId: "C-105", startTime: "08:00", endTime: "16:00", mode: "linked" as const, date: today },
      { routeId: "102", busId: "TN-01-A-0006", crewId: "C-107", startTime: "06:00", endTime: "14:00", mode: "unlinked" as const, date: today },
      { routeId: "D70", busId: undefined, crewId: undefined, startTime: "10:00", endTime: "16:00", mode: "unlinked" as const, date: today },
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
