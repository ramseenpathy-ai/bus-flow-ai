import { v } from "convex/values";
import { query } from "./_generated/server";

// Get dashboard statistics
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const routes = await ctx.db.query("routes").collect();
    const crew = await ctx.db.query("crew").collect();
    const buses = await ctx.db.query("buses").collect();
    const duties = await ctx.db.query("duties").collect();
    const conflicts = await ctx.db.query("conflicts").collect();

    const activeRoutes = routes.filter((r) => r.status === "active");
    const proposedRoutes = routes.filter((r) => r.status === "proposed");
    const totalCapacity = buses.reduce((sum, b) => sum + b.capacity, 0);
    const activeBuses = buses.filter((b) => b.currentStatus === "on_route" || b.currentStatus === "available");
    const availableBuses = buses.filter((b) => b.currentStatus === "available");
    const maintenanceBuses = buses.filter((b) => b.currentStatus === "maintenance");

    const availableCrew = crew.filter((c) => c.availability === "available");
    const onDutyCrew = crew.filter((c) => c.availability === "on_duty");
    const restingCrew = crew.filter((c) => c.availability === "resting");

    const crewUtilization = crew.length > 0 ? Math.round((onDutyCrew.length / crew.length) * 100) : 0;
    const routeCoverage = activeRoutes.length > 0
      ? Math.round(
          (duties.filter((d) => d.status !== "cancelled" && activeRoutes.some((r) => r.routeId === d.routeId)).length /
            activeRoutes.length) *
            100
        )
      : 0;

    const openConflicts = conflicts.filter((c) => c.status === "open");

    return {
      totalRoutes: routes.length,
      activeRoutes: activeRoutes.length,
      proposedRoutes: proposedRoutes.length,
      totalCrew: crew.length,
      availableCrew: availableCrew.length,
      onDutyCrew: onDutyCrew.length,
      restingCrew: restingCrew.length,
      totalBuses: buses.length,
      activeBuses: activeBuses.length,
      availableBuses: availableBuses.length,
      maintenanceBuses: maintenanceBuses.length,
      totalCapacity,
      totalDuties: duties.length,
      scheduledDuties: duties.filter((d) => d.status === "scheduled").length,
      completedDuties: duties.filter((d) => d.status === "completed").length,
      cancelledDuties: duties.filter((d) => d.status === "cancelled").length,
      totalConflicts: conflicts.length,
      openConflicts: openConflicts.length,
      resolvedConflicts: conflicts.filter((c) => c.status === "resolved").length,
      crewUtilization,
      routeCoverage,
    };
  },
});

// Get crew utilization details
export const crewUtilization = query({
  args: {},
  handler: async (ctx) => {
    const crew = await ctx.db.query("crew").collect();
    const total = crew.length;
    const onDuty = crew.filter((c) => c.availability === "on_duty").length;
    const available = crew.filter((c) => c.availability === "available").length;
    const resting = crew.filter((c) => c.availability === "resting").length;
    const offDuty = crew.filter((c) => c.availability === "off_duty").length;

    return {
      total,
      onDuty,
      available,
      resting,
      offDuty,
      utilizationPercent: total > 0 ? Math.round((onDuty / total) * 100) : 0,
    };
  },
});

// Get route coverage details
export const routeCoverage = query({
  args: {},
  handler: async (ctx) => {
    const routes = await ctx.db.query("routes").collect();
    const duties = await ctx.db.query("duties").collect();
    const today = new Date().toISOString().split("T")[0];

    const todayDuties = duties.filter((d) => d.date === today && d.status !== "cancelled");
    const coveredRouteIds = new Set(todayDuties.map((d) => d.routeId));

    const activeRoutes = routes.filter((r) => r.status === "active");
    const coveredRoutes = activeRoutes.filter((r) => coveredRouteIds.has(r.routeId));
    const uncoveredRoutes = activeRoutes.filter((r) => !coveredRouteIds.has(r.routeId));

    return {
      totalActive: activeRoutes.length,
      covered: coveredRoutes.length,
      uncovered: uncoveredRoutes.length,
      coveragePercent: activeRoutes.length > 0 ? Math.round((coveredRoutes.length / activeRoutes.length) * 100) : 0,
      uncoveredRoutes: uncoveredRoutes.map((r) => ({ routeId: r.routeId, name: r.name })),
    };
  },
});
