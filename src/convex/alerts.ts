import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ── List all alerts ──
export const list = query({
  args: {},
  handler: async (ctx) => {
    const alerts = await ctx.db.query("alerts").collect();
    const buses = await ctx.db.query("buses").collect();
    const routes = await ctx.db.query("routes").collect();
    const crew = await ctx.db.query("crew").collect();
    const busMap = new Map(buses.map((b) => [b.busId, b]));
    const routeMap = new Map(routes.map((r) => [r.routeId, r]));
    const crewMap = new Map(crew.map((c) => [c.crewId, c]));

    return alerts.map((a) => ({
      ...a,
      busName: a.busId ? busMap.get(a.busId)?.registrationNumber : undefined,
      routeName: routeMap.get(a.routeId)?.name ?? "Unknown",
      driverName: a.driverId ? crewMap.get(a.driverId)?.name : undefined,
    }));
  },
});

// ── Summary stats ──
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const alerts = await ctx.db.query("alerts").collect();
    const active = alerts.filter((a) => a.status === "ACTIVE");
    const critical = alerts.filter((a) => a.severity === "CRITICAL" && a.status === "ACTIVE");
    const high = alerts.filter((a) => a.severity === "HIGH" && a.status === "ACTIVE");
    const busesAffected = new Set(active.filter((a) => a.busId).map((a) => a.busId)).size;
    const acknowledged = alerts.filter((a) => a.driverAcknowledged === true).length;
    const unacknowledged = alerts.filter((a) => a.status === "ACTIVE" && a.driverAcknowledged !== true).length;
    const passengersNotified = alerts.filter((a) => a.passengerDelivered === true).length;
    const totalAlerts = alerts.length;
    return { totalAlerts, activeEmergencies: active.length, criticalAlerts: critical.length, highAlerts: high.length, busesAffected, driverAcknowledgments: acknowledged, unacknowledgedAlerts: unacknowledged, passengersNotified };
  },
});

// ── Send emergency alert ──
export const send = mutation({
  args: {
    alertId: v.string(),
    alertType: v.string(),
    severity: v.string(),
    routeId: v.string(),
    busId: v.optional(v.string()),
    driverId: v.optional(v.string()),
    affectedLocation: v.string(),
    affectedStops: v.array(v.string()),
    message: v.string(),
    createdBy: v.string(),
    expiresAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("alerts", {
      ...args,
      createdTime: now,
      status: "ACTIVE",
      driverDelivered: !!args.busId,
      driverAcknowledged: false,
      passengerDelivered: !!args.busId,
      escalationRequired: false,
    });
  },
});

// ── Driver acknowledges alert ──
export const acknowledge = mutation({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    await ctx.db.patch(args.alertId, {
      driverAcknowledged: true,
      driverAckTime: now,
    });
  },
});

// ── Resend / escalate alert ──
export const escalate = mutation({
  args: { alertId: v.id("alerts") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, { escalationRequired: true });
  },
});

// ── Cancel / resolve alert ──
export const resolve = mutation({
  args: { alertId: v.id("alerts"), status: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.alertId, { status: args.status });
  },
});

// ── Get alerts for a specific bus ──
export const forBus = query({
  args: { busId: v.string() },
  handler: async (ctx, args) => {
    const alerts = await ctx.db.query("alerts").collect();
    return alerts.filter((a) => a.busId === args.busId && (a.status === "ACTIVE" || a.status === "ACKNOWLEDGED"));
  },
});

// ── Demo: seed flood scenario ──
export const seedFloodScenario = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db.query("alerts").first();
    if (existing) return "Scenario already seeded";

    const now = new Date();
    const expires = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    // Flood alert
    await ctx.db.insert("alerts", {
      alertId: "ALERT-001",
      alertType: "FLOOD",
      severity: "CRITICAL",
      routeId: "21G",
      busId: "Bus 001",
      driverId: "DRV-001",
      affectedLocation: "Road section near Chromepet–Pallavaram stretch",
      affectedStops: ["Chromepet", "Pallavaram"],
      message: "FLOOD WARNING: Severe waterlogging detected on Route 21G between Chromepet and Pallavaram. Do NOT proceed through this section. Follow alternate route via GST Road. Contact Control Room for further instructions.",
      createdBy: "Control Room",
      createdTime: now.toISOString(),
      expiresAt: expires.toISOString(),
      status: "ACTIVE",
      driverDelivered: true,
      driverAcknowledged: true,
      driverAckTime: new Date(now.getTime() + 2 * 60 * 1000).toISOString(),
      passengerDelivered: true,
      escalationRequired: false,
    });

    // Driver medical emergency alert
    await ctx.db.insert("alerts", {
      alertId: "ALERT-002",
      alertType: "MEDICAL EMERGENCY",
      severity: "CRITICAL",
      routeId: "M70",
      busId: "Bus 006",
      driverId: "DRV-006",
      affectedLocation: "Near Adyar junction",
      affectedStops: ["Adyar"],
      message: "MEDICAL EMERGENCY: Driver has reported a medical emergency. Passengers stay calm. Control room has been notified. Replacement driver dispatched.",
      createdBy: "Driver DRV-006",
      createdTime: new Date(now.getTime() - 5 * 60 * 1000).toISOString(),
      status: "ACKNOWLEDGED",
      driverDelivered: true,
      driverAcknowledged: true,
      driverAckTime: new Date(now.getTime() - 4 * 60 * 1000).toISOString(),
      passengerDelivered: true,
      escalationRequired: false,
    });

    // Road closure alert
    await ctx.db.insert("alerts", {
      alertId: "ALERT-003",
      alertType: "ROAD CLOSURE",
      severity: "HIGH",
      routeId: "51",
      busId: "Bus 003",
      driverId: "DRV-003",
      affectedLocation: "Pallikaranai flyover section",
      affectedStops: ["Pallikaranai", "Velachery"],
      message: "ROAD CLOSURE: Pallikaranai flyover closed for emergency repairs. Reroute via Medavakkam High Road.",
      createdBy: "Control Room",
      createdTime: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      status: "ACTIVE",
      driverDelivered: true,
      driverAcknowledged: false,
      passengerDelivered: true,
      escalationRequired: false,
    });

    // Weather alert
    await ctx.db.insert("alerts", {
      alertId: "ALERT-004",
      alertType: "SEVERE WEATHER",
      severity: "MEDIUM",
      routeId: "588",
      busId: "Bus 020",
      driverId: "DRV-020",
      affectedLocation: "Coastal stretch to Mamallapuram",
      affectedStops: ["Sholinganallur", "Kelambakkam", "Kovalam", "Mamallapuram"],
      message: "WEATHER ADVISORY: Heavy rains expected on coastal route 588. Reduce speed. Use headlights. Pull over if visibility drops below safe levels.",
      createdBy: "Control Room",
      createdTime: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
      status: "ACTIVE",
      driverDelivered: true,
      driverAcknowledged: true,
      driverAckTime: new Date(now.getTime() - 28 * 60 * 1000).toISOString(),
      passengerDelivered: true,
      escalationRequired: false,
    });

    return "4 alerts seeded: Flood (CRITICAL), Medical (CRITICAL), Road Closure (HIGH), Weather (MEDIUM)";
  },
});
