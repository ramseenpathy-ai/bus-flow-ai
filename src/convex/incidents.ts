import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ── List all incidents ──
export const list = query({
  args: {},
  handler: async (ctx) => {
    const incidents = await ctx.db.query("incidents").collect();
    const buses = await ctx.db.query("buses").collect();
    const routes = await ctx.db.query("routes").collect();
    const crew = await ctx.db.query("crew").collect();
    const schedules = await ctx.db.query("schedules").collect();
    const busMap = new Map(buses.map((b) => [b.busId, b]));
    const routeMap = new Map(routes.map((r) => [r.routeId, r]));
    const crewMap = new Map(crew.map((c) => [c.crewId, c]));

    return incidents.map((inc) => {
      const bus = busMap.get(inc.busId);
      const route = routeMap.get(inc.routeId);
      const driver = inc.driverId ? crewMap.get(inc.driverId) : undefined;
      const schedule = schedules.find((s) => s.busId === inc.busId && s.routeId === inc.routeId);

      return {
        ...inc,
        busRegistration: bus?.registrationNumber,
        routeName: route?.name,
        driverName: driver?.name,
        scheduleId: schedule?.scheduleId,
      };
    });
  },
});

// ── Summary stats ──
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const incidents = await ctx.db.query("incidents").collect();
    const total = incidents.length;
    const newIncidents = incidents.filter((i) => i.status === "NEW").length;
    const critical = incidents.filter((i) => i.severity === "CRITICAL" && i.status !== "CLOSED" && i.status !== "RESOLVED").length;
    const high = incidents.filter((i) => i.severity === "HIGH" && i.status !== "CLOSED" && i.status !== "RESOLVED").length;
    const underResponse = incidents.filter((i) => i.status === "UNDER RESPONSE").length;
    const resolved = incidents.filter((i) => i.status === "RESOLVED" || i.status === "CLOSED").length;
    const busesInDistress = new Set(incidents.filter((i) => i.status === "NEW" || i.status === "ACKNOWLEDGED" || i.status === "UNDER RESPONSE").map((i) => i.busId)).size;
    return { total, newIncidents, critical, high, underResponse, resolved, busesInDistress };
  },
});

// ── Create incident ──
export const create = mutation({
  args: {
    incidentId: v.string(),
    incidentType: v.string(),
    severity: v.string(),
    reporterType: v.string(),
    reporterId: v.optional(v.string()),
    busId: v.string(),
    routeId: v.string(),
    driverId: v.optional(v.string()),
    location: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("incidents", {
      ...args,
      reportedTime: now,
      status: "NEW",
      assignedOperator: undefined,
      resolution: undefined,
      resolutionTime: undefined,
      acknowledgedTime: undefined,
      responseInitiatedTime: undefined,
      closedTime: undefined,
    });
  },
});

// ── Update incident status ──
export const updateStatus = mutation({
  args: {
    incidentId: v.id("incidents"),
    status: v.string(),
    assignedOperator: v.optional(v.string()),
    resolution: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const patch: Record<string, any> = { status: args.status };
    if (args.assignedOperator) patch.assignedOperator = args.assignedOperator;
    if (args.resolution) { patch.resolution = args.resolution; patch.resolutionTime = now; }
    if (args.status === "ACKNOWLEDGED") patch.acknowledgedTime = now;
    if (args.status === "UNDER RESPONSE") patch.responseInitiatedTime = now;
    if (args.status === "CLOSED") patch.closedTime = now;
    await ctx.db.patch(args.incidentId, patch);
  },
});

// ── Seed demo incidents ──
export const seedDemos = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("incidents").first();
    if (existing) return "Incidents already seeded";

    const now = new Date();

    // Driver medical emergency
    await ctx.db.insert("incidents", {
      incidentId: "INC-001",
      incidentType: "DRIVER MEDICAL EMERGENCY",
      severity: "CRITICAL",
      reporterType: "PASSENGER",
      reporterId: undefined,
      busId: "Bus 006",
      routeId: "M70",
      driverId: "DRV-006",
      location: "Near Adyar junction",
      description: "Driver appears to have collapsed. Passenger pressed emergency button. Driver is unresponsive. Bus has been stopped safely at roadside.",
      reportedTime: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      status: "UNDER RESPONSE",
      assignedOperator: "Ops Manager Rajan",
      resolution: undefined,
      resolutionTime: undefined,
      acknowledgedTime: new Date(now.getTime() - 8 * 60 * 1000).toISOString(),
      responseInitiatedTime: new Date(now.getTime() - 7 * 60 * 1000).toISOString(),
      closedTime: undefined,
    });

    // Bus breakdown
    await ctx.db.insert("incidents", {
      incidentId: "INC-002",
      incidentType: "BUS BREAKDOWN",
      severity: "HIGH",
      reporterType: "DRIVER",
      reporterId: "DRV-013",
      busId: "Bus 013",
      routeId: "99",
      driverId: "DRV-013",
      location: "Tambaram depot exit",
      description: "Engine overheating. Coolant leak detected. Bus cannot continue. Requesting tow and replacement bus.",
      reportedTime: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
      status: "ACKNOWLEDGED",
      assignedOperator: "Control Room",
      resolution: undefined,
      resolutionTime: undefined,
      acknowledgedTime: new Date(now.getTime() - 18 * 60 * 1000).toISOString(),
      responseInitiatedTime: undefined,
      closedTime: undefined,
    });

    // Tire puncture
    await ctx.db.insert("incidents", {
      incidentId: "INC-003",
      incidentType: "TIRE PUNCTURE",
      severity: "MEDIUM",
      reporterType: "DRIVER",
      reporterId: "DRV-005",
      busId: "Bus 005",
      routeId: "102",
      driverId: "DRV-005",
      location: "Sholinganallur junction",
      description: "Rear right tire punctured. Bus pulled over safely. Needs roadside tire change or replacement.",
      reportedTime: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
      status: "RESOLVED",
      assignedOperator: "Control Room",
      resolution: "Replacement tire dispatched and fitted. Bus resumed service.",
      resolutionTime: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
      acknowledgedTime: new Date(now.getTime() - 33 * 60 * 1000).toISOString(),
      responseInitiatedTime: new Date(now.getTime() - 32 * 60 * 1000).toISOString(),
      closedTime: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
    });

    // Passenger disturbance
    await ctx.db.insert("incidents", {
      incidentId: "INC-004",
      incidentType: "PASSENGER DISTURBANCE",
      severity: "LOW",
      reporterType: "DRIVER",
      reporterId: "DRV-010",
      busId: "Bus 010",
      routeId: "57F",
      driverId: "DRV-010",
      location: "Perambur bus stop",
      description: "Passenger verbally abusive after being denied boarding due to capacity. Situation de-escalated. No physical altercation.",
      reportedTime: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
      status: "CLOSED",
      assignedOperator: "Control Room",
      resolution: "Passenger de-escalated. No further action required.",
      resolutionTime: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      acknowledgedTime: new Date(now.getTime() - 43 * 60 * 1000).toISOString(),
      responseInitiatedTime: new Date(now.getTime() - 42 * 60 * 1000).toISOString(),
      closedTime: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    });

    return "4 incidents seeded: Medical Emergency (CRITICAL), Breakdown (HIGH), Tire Puncture (MEDIUM), Passenger Disturbance (LOW)";
  },
});
