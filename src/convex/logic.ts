import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

const REQUIRED_REST_HOURS = 10;

// ── Helper: compute time difference in hours between two HH:MM strings ──
function hoursBetween(endTime: string, startTime: string): number {
  const [eh, em] = endTime.split(":").map(Number);
  const [sh, sm] = startTime.split(":").map(Number);
  const endMinutes = eh * 60 + em;
  const startMinutes = sh * 60 + sm;
  let diff = startMinutes - endMinutes;
  if (diff < 0) diff += 24 * 60; // crosses midnight
  return diff / 60;
}

// ── Helper: classify link status for a schedule ──
function classifyLinkStatus(busId: string, routeId: string, driverId: string, conductorId: string): string {
  const hasBus = !!busId;
  const hasRoute = !!routeId;
  const hasDriver = !!driverId;
  const hasConductor = !!conductorId;
  const count = [hasBus, hasRoute, hasDriver, hasConductor].filter(Boolean).length;
  if (count === 4) return "linked";
  if (count === 0) return "unlinked";
  return "partially_linked";
}

// ── Query: get link status and rest info for all schedules ──
export const schedulesWithDetails = query({
  args: {},
  handler: async (ctx) => {
    const schedules = await ctx.db.query("schedules").collect();
    const buses = await ctx.db.query("buses").collect();
    const crew = await ctx.db.query("crew").collect();
    const routes = await ctx.db.query("routes").collect();

    const busMap = new Map(buses.map((b) => [b.busId, b]));
    const crewMap = new Map(crew.map((c) => [c.crewId, c]));
    const routeMap = new Map(routes.map((r) => [r.routeId, r]));

    return schedules.map((s) => {
      const bus = busMap.get(s.busId);
      const driver = crewMap.get(s.driverId);
      const conductor = crewMap.get(s.conductorId);
      const route = routeMap.get(s.routeId);

      const linkStatus = classifyLinkStatus(s.busId, s.routeId, s.driverId, s.conductorId);

      // Compute rest periods
      let driverRestHours: number | null = null;
      let driverRestCompliant: boolean | null = null;
      if (driver?.lastDutyEndTime) {
        driverRestHours = Math.round(hoursBetween(driver.lastDutyEndTime, s.startTime) * 10) / 10;
        driverRestCompliant = driverRestHours >= REQUIRED_REST_HOURS;
      }

      let conductorRestHours: number | null = null;
      let conductorRestCompliant: boolean | null = null;
      if (conductor?.lastDutyEndTime) {
        conductorRestHours = Math.round(hoursBetween(conductor.lastDutyEndTime, s.startTime) * 10) / 10;
        conductorRestCompliant = conductorRestHours >= REQUIRED_REST_HOURS;
      }

      // Determine conflicts for this schedule
      const conflictFlags: string[] = [];
      if (bus && bus.currentStatus === "maintenance") conflictFlags.push("Maintenance bus on active schedule");
      if (bus && bus.currentStatus === "off_duty") conflictFlags.push("Off-duty bus on active schedule");
      if (bus && bus.fuelLevel < 30) conflictFlags.push("Low fuel");
      if (!driver) conflictFlags.push("No driver assigned");
      if (!conductor) conflictFlags.push("No conductor assigned");
      if (driverRestCompliant === false) conflictFlags.push(`Driver rest violation: ${driverRestHours}h < ${REQUIRED_REST_HOURS}h`);
      if (conductorRestCompliant === false) conflictFlags.push(`Conductor rest violation: ${conductorRestHours}h < ${REQUIRED_REST_HOURS}h`);
      if (s.delayMinutes > 10) conflictFlags.push(`${s.delayMinutes}min delay`);

      return {
        ...s,
        busStatus: bus?.currentStatus ?? "unknown",
        routeName: route?.name ?? "Unknown Route",
        routeType: route?.routeType ?? "",
        driverName: driver?.name ?? "Unassigned",
        conductorName: conductor?.name ?? "Unassigned",
        linkStatus,
        driverRestHours,
        driverRestCompliant,
        conductorRestHours,
        conductorRestCompliant,
        requiredRestHours: REQUIRED_REST_HOURS,
        conflictFlags,
      };
    });
  },
});

// ── Mutation: update schedule linkage ──
export const updateScheduleLink = mutation({
  args: {
    scheduleId: v.id("schedules"),
    busId: v.optional(v.string()),
    driverId: v.optional(v.string()),
    conductorId: v.optional(v.string()),
    routeId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) throw new Error("Schedule not found");

    const patch: Record<string, any> = {};
    if (args.busId !== undefined) patch.busId = args.busId;
    if (args.driverId !== undefined) patch.driverId = args.driverId;
    if (args.conductorId !== undefined) patch.conductorId = args.conductorId;
    if (args.routeId !== undefined) patch.routeId = args.routeId;

    // Recompute link status
    const busId = args.busId ?? schedule.busId;
    const routeId = args.routeId ?? schedule.routeId;
    const driverId = args.driverId ?? schedule.driverId;
    const conductorId = args.conductorId ?? schedule.conductorId;
    patch.linkStatus = classifyLinkStatus(busId, routeId, driverId, conductorId);

    await ctx.db.patch(args.scheduleId, patch);
    return patch.linkStatus;
  },
});

// ── Route overlap detection ──
export const detectRouteOverlap = query({
  args: {
    coordinates: v.array(v.object({ lat: v.number(), lng: v.number() })),
    excludeRouteId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.coordinates.length < 2) return [];
    const routes = await ctx.db.query("routes").collect();
    const newBounds = getBounds(args.coordinates);
    const results: Array<{
      routeId: string;
      name: string;
      overlapPercentage: number;
      sharedStops: string[];
      severity: string;
    }> = [];

    for (const route of routes) {
      if (route.routeId === args.excludeRouteId) continue;
      if (route.coordinates.length < 2) continue;
      const existingBounds = getBounds(route.coordinates);

      if (
        newBounds.minLat <= existingBounds.maxLat &&
        newBounds.maxLat >= existingBounds.minLat &&
        newBounds.minLng <= existingBounds.maxLng &&
        newBounds.maxLng >= existingBounds.minLng
      ) {
        const overlapArea = getOverlapArea(newBounds, existingBounds);
        const newArea = getArea(newBounds);
        const pct = newArea > 0 ? Math.round((overlapArea / newArea) * 100) : 0;

        if (pct > 5) {
          const severity = pct >= 60 ? "Critical" : pct >= 40 ? "High" : pct >= 20 ? "Medium" : "Low";
          results.push({
            routeId: route.routeId,
            name: route.name,
            overlapPercentage: pct,
            sharedStops: [],
            severity,
          });
        }
      }
    }

    return results;
  },
});

// ── Save new route ──
export const saveNewRoute = mutation({
  args: {
    routeId: v.string(),
    name: v.string(),
    startPoint: v.string(),
    endPoint: v.string(),
    stops: v.array(v.string()),
    estimatedTravelTime: v.number(),
    estimatedDistance: v.optional(v.number()),
    routeType: v.optional(v.string()),
    coordinates: v.array(v.object({ lat: v.number(), lng: v.number() })),
  },
  handler: async (ctx, args) => {
    // Check for duplicate route ID
    const existing = await ctx.db.query("routes").withIndex("by_routeId", (q) => q.eq("routeId", args.routeId)).first();
    if (existing) throw new Error(`Route ${args.routeId} already exists`);

    return await ctx.db.insert("routes", {
      ...args,
      passengerLoad: "Medium",
      busCount: 0,
      status: "proposed" as any,
      operatingHours: { start: "06:00", end: "22:00" },
      createdBy: "operator",
    });
  },
});

// ── Fallback: find available rested crew ──
export const findAvailableCrew = query({
  args: {
    role: v.string(),
    scheduledStartTime: v.string(),
  },
  handler: async (ctx, args) => {
    const crew = await ctx.db
      .query("crew")
      .withIndex("by_role", (q) => q.eq("role", args.role))
      .collect();

    const available: typeof crew = [];
    for (const member of crew) {
      if (member.dutyStatus === "off_duty") continue;
      if (member.lastDutyEndTime) {
        const restHours = hoursBetween(member.lastDutyEndTime, args.scheduledStartTime);
        if (restHours < REQUIRED_REST_HOURS) continue;
      }
      available.push(member);
    }

    return available.map((c) => ({
      crewId: c.crewId,
      name: c.name,
      role: c.role,
      dutyStatus: c.dutyStatus,
      lastDutyEndTime: c.lastDutyEndTime,
      restHours: c.lastDutyEndTime ? Math.round(hoursBetween(c.lastDutyEndTime, args.scheduledStartTime) * 10) / 10 : null,
    }));
  },
});

// ── Fallback: find available replacement bus ──
export const findAvailableBus = query({
  args: { excludeBusId: v.string() },
  handler: async (ctx, args) => {
    const buses = await ctx.db.query("buses").collect();
    return buses
      .filter((b) => b.busId !== args.excludeBusId && b.currentStatus === "available")
      .map((b) => ({
        busId: b.busId,
        registrationNumber: b.registrationNumber,
        routeId: b.routeId,
        capacity: b.capacity,
        fuelLevel: b.fuelLevel,
      }));
  },
});

// ── Operations summary (dashboard) ──
export const opsSummary = query({
  args: {},
  handler: async (ctx) => {
    const routes = await ctx.db.query("routes").collect();
    const buses = await ctx.db.query("buses").collect();
    const crew = await ctx.db.query("crew").collect();
    const schedules = await ctx.db.query("schedules").collect();

    const linked = schedules.filter((s) => {
      return !!s.busId && !!s.routeId && !!s.driverId && !!s.conductorId;
    }).length;
    const unlinked = schedules.filter((s) => {
      return !s.busId || !s.routeId || !s.driverId || !s.conductorId;
    }).length;
    const partiallyLinked = schedules.length - linked - unlinked;

    const onRouteBuses = buses.filter((b) => b.currentStatus === "on_route").length;
    const availableBuses = buses.filter((b) => b.currentStatus === "available").length;
    const maintenanceBuses = buses.filter((b) => b.currentStatus === "maintenance").length;
    const offDutyBuses = buses.filter((b) => b.currentStatus === "off_duty").length;

    const onDutyCrew = crew.filter((c) => c.dutyStatus === "on_duty").length;
    const availableCrew = crew.filter((c) => c.dutyStatus === "available").length;

    // Route coverage: routes with at least one bus assigned
    const routesWithBuses = new Set(buses.filter((b) => b.currentStatus !== "maintenance" && b.currentStatus !== "off_duty").map((b) => b.routeId)).size;
    const routeCoverage = routes.length > 0 ? Math.round((routesWithBuses / routes.length) * 100) : 0;

    // Rest compliance
    const drivers = crew.filter((c) => c.role === "Driver");
    const restViolations = drivers.filter((c) => {
      if (!c.lastDutyEndTime) return false;
      // Check if any schedule starts before rest period is met
      const scheds = schedules.filter((s) => s.driverId === c.crewId);
      for (const s of scheds) {
        const rest = hoursBetween(c.lastDutyEndTime, s.startTime);
        if (rest < REQUIRED_REST_HOURS) return true;
      }
      return false;
    }).length;

    return {
      routes: routes.length,
      activeRoutes: routes.filter((r) => r.status === "active").length,
      proposedRoutes: routes.filter((r) => r.status === "proposed").length,
      routesWithBuses,
      routesWithoutBuses: routes.length - routesWithBuses,
      totalBuses: buses.length,
      onRouteBuses,
      availableBuses,
      maintenanceBuses,
      offDutyBuses,
      fleetUtilization: buses.length > 0 ? Math.round((onRouteBuses / buses.length) * 100) : 0,
      totalCrew: crew.length,
      drivers: drivers.length,
      conductors: crew.filter((c) => c.role === "Conductor").length,
      onDutyCrew,
      availableCrew,
      offDutyCrew: crew.filter((c) => c.dutyStatus === "off_duty").length,
      totalSchedules: schedules.length,
      linkedDuties: linked,
      partiallyLinkedDuties: partiallyLinked,
      unlinkedDuties: unlinked,
      routeCoverage,
      restViolations,
      restCompliant: drivers.length - restViolations,
      totalConflicts: 0,
    };
  },
});

// ── Combined route + schedule view ──
export const routeScheduleView = query({
  args: {},
  handler: async (ctx) => {
    const schedules = await ctx.db.query("schedules").collect();
    const buses = await ctx.db.query("buses").collect();
    const crew = await ctx.db.query("crew").collect();
    const routes = await ctx.db.query("routes").collect();

    const busMap = new Map(buses.map((b) => [b.busId, b]));
    const crewMap = new Map(crew.map((c) => [c.crewId, c]));

    return schedules.map((s) => {
      const bus = busMap.get(s.busId);
      const driver = crewMap.get(s.driverId);
      const conductor = crewMap.get(s.conductorId);
      const route = routes.find((r) => r.routeId === s.routeId);

      const linkStatus = classifyLinkStatus(s.busId, s.routeId, s.driverId, s.conductorId);

      const conflictFlags: string[] = [];
      if (bus && bus.currentStatus === "maintenance") conflictFlags.push("Maintenance");
      if (bus && bus.currentStatus === "off_duty") conflictFlags.push("Off Duty Bus");
      if (!driver) conflictFlags.push("No Driver");
      if (!conductor) conflictFlags.push("No Conductor");
      if (bus && bus.fuelLevel < 30) conflictFlags.push("Low Fuel");
      if (s.delayMinutes > 10) conflictFlags.push(`${s.delayMinutes}min Delay`);

      return {
        routeId: s.routeId,
        routeName: route?.name ?? "Unknown",
        busId: s.busId || "—",
        driverName: driver?.name ?? "—",
        conductorName: conductor?.name ?? "—",
        linkStatus,
        startTime: s.startTime,
        endTime: s.endTime,
        shift: s.shift,
        status: s.status,
        tripCount: s.scheduledTrips,
        conflicts: conflictFlags,
      };
    });
  },
});

// ── Helper functions ──
function getBounds(coords: Array<{ lat: number; lng: number }>) {
  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;
  for (const c of coords) {
    if (c.lat < minLat) minLat = c.lat;
    if (c.lat > maxLat) maxLat = c.lat;
    if (c.lng < minLng) minLng = c.lng;
    if (c.lng > maxLng) maxLng = c.lng;
  }
  return { minLat, maxLat, minLng, maxLng };
}

function getOverlapArea(a: { minLat: number; maxLat: number; minLng: number; maxLng: number }, b: { minLat: number; maxLat: number; minLng: number; maxLng: number }) {
  const lat = Math.max(0, Math.min(a.maxLat, b.maxLat) - Math.max(a.minLat, b.minLat));
  const lng = Math.max(0, Math.min(a.maxLng, b.maxLng) - Math.max(a.minLng, b.minLng));
  return lat * lng;
}

function getArea(b: { minLat: number; maxLat: number; minLng: number; maxLng: number }) {
  return (b.maxLat - b.minLat) * (b.maxLng - b.minLng);
}
