import { query } from "./_generated/server";

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const routes = await ctx.db.query("routes").collect();
    const crew = await ctx.db.query("crew").collect();
    const buses = await ctx.db.query("buses").collect();
    const schedules = await ctx.db.query("schedules").collect();
    const conflicts = await ctx.db.query("conflicts").collect();

    const activeRoutes = routes.filter((r) => r.status === "active");
    const proposedRoutes = routes.filter((r) => r.status === "proposed");
    const totalCapacity = buses.reduce((s, b) => s + b.capacity, 0);

    const onRouteBuses = buses.filter((b) => b.currentStatus === "on_route");
    const availableBuses = buses.filter((b) => b.currentStatus === "available");
    const maintenanceBuses = buses.filter((b) => b.currentStatus === "maintenance");
    const offDutyBuses = buses.filter((b) => b.currentStatus === "off_duty");

    const onDutyCrew = crew.filter((c) => c.dutyStatus === "on_duty");
    const availableCrew = crew.filter((c) => c.dutyStatus === "available");
    const offDutyCrew = crew.filter((c) => c.dutyStatus === "off_duty");

    const drivers = crew.filter((c) => c.role === "Driver");
    const conductors = crew.filter((c) => c.role === "Conductor");

    const openConflicts = conflicts.filter((c) => c.status === "Open");
    const criticalConflicts = conflicts.filter((c) => c.severity === "Critical");

    return {
      totalRoutes: routes.length,
      activeRoutes: activeRoutes.length,
      proposedRoutes: proposedRoutes.length,
      totalCrew: crew.length,
      drivers: drivers.length,
      conductors: conductors.length,
      onDutyCrew: onDutyCrew.length,
      availableCrew: availableCrew.length,
      offDutyCrew: offDutyCrew.length,
      totalBuses: buses.length,
      onRouteBuses: onRouteBuses.length,
      availableBuses: availableBuses.length,
      maintenanceBuses: maintenanceBuses.length,
      offDutyBuses: offDutyBuses.length,
      totalCapacity,
      totalSchedules: schedules.length,
      totalConflicts: conflicts.length,
      openConflicts: openConflicts.length,
      criticalConflicts: criticalConflicts.length,
      fleetUtilization: buses.length > 0 ? Math.round((onRouteBuses.length / buses.length) * 100) : 0,
    };
  },
});

export const crewUtilization = query({
  args: {},
  handler: async (ctx) => {
    const crew = await ctx.db.query("crew").collect();
    const total = crew.length;
    const onDuty = crew.filter((c) => c.dutyStatus === "on_duty").length;
    return { total, onDuty, utilizationPercent: total > 0 ? Math.round((onDuty / total) * 100) : 0 };
  },
});

export const routeCoverage = query({
  args: {},
  handler: async (ctx) => {
    const routes = await ctx.db.query("routes").collect();
    const active = routes.filter((r) => r.status === "active");
    return { totalActive: active.length, covered: active.length, coveragePercent: 100 };
  },
});
