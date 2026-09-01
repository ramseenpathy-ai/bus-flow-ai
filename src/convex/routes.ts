import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all routes
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("routes").collect();
  },
});

// Get routes by status
export const listByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("routes")
      .withIndex("by_status", (q) => q.eq("status", args.status as any))
      .collect();
  },
});

// Get a single route
export const get = query({
  args: { routeId: v.string() },
  handler: async (ctx, args) => {
    const routes = await ctx.db
      .query("routes")
      .withIndex("by_routeId", (q) => q.eq("routeId", args.routeId))
      .first();
    return routes;
  },
});

// Create a new route
export const create = mutation({
  args: {
    routeId: v.string(),
    name: v.string(),
    startPoint: v.string(),
    endPoint: v.string(),
    stops: v.array(v.string()),
    estimatedTravelTime: v.number(),
    estimatedDistance: v.optional(v.number()),
    routeType: v.optional(v.string()),
    passengerLoad: v.optional(v.string()),
    busCount: v.optional(v.number()),
    operatingHours: v.object({
      start: v.string(),
      end: v.string(),
    }),
    status: v.string(),
    coordinates: v.array(v.object({
      lat: v.number(),
      lng: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("routes", {
      ...args,
      status: args.status as any,
      createdBy: "system",
      overlapPercentage: undefined,
      assignedBus: undefined,
      assignedCrew: undefined,
    });
  },
});

// Update a route
export const update = mutation({
  args: {
    id: v.id("routes"),
    routeId: v.optional(v.string()),
    name: v.optional(v.string()),
    startPoint: v.optional(v.string()),
    endPoint: v.optional(v.string()),
    stops: v.optional(v.array(v.string())),
    estimatedTravelTime: v.optional(v.number()),
    estimatedDistance: v.optional(v.number()),
    routeType: v.optional(v.string()),
    passengerLoad: v.optional(v.string()),
    busCount: v.optional(v.number()),
    operatingHours: v.optional(v.object({
      start: v.string(),
      end: v.string(),
    })),
    status: v.optional(v.string()),
    assignedBus: v.optional(v.string()),
    assignedCrew: v.optional(v.string()),
    coordinates: v.optional(v.array(v.object({
      lat: v.number(),
      lng: v.number(),
    }))),
    overlapPercentage: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }
    if (filteredUpdates.status) {
      filteredUpdates.status = filteredUpdates.status as any;
    }
    await ctx.db.patch(id, filteredUpdates);
  },
});

// Delete a route
export const remove = mutation({
  args: { id: v.id("routes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Detect route overlaps (simplified geometric overlap detection)
export const detectOverlaps = query({
  args: {
    coordinates: v.array(v.object({ lat: v.number(), lng: v.number() })),
  },
  handler: async (ctx, args) => {
    const allRoutes = await ctx.db.query("routes").collect();
    const overlaps: Array<{
      routeId: string;
      name: string;
      overlapPercentage: number;
    }> = [];

    for (const route of allRoutes) {
      if (route.coordinates.length === 0 || args.coordinates.length === 0) continue;

      // Simple bounding box overlap check
      const newBounds = getBounds(args.coordinates);
      const existingBounds = getBounds(route.coordinates);

      if (
        newBounds.minLat <= existingBounds.maxLat &&
        newBounds.maxLat >= existingBounds.minLat &&
        newBounds.minLng <= existingBounds.maxLng &&
        newBounds.maxLng >= existingBounds.minLng
      ) {
        // Calculate approximate overlap percentage
        const overlapArea = getOverlapArea(newBounds, existingBounds);
        const newArea = getArea(newBounds);
        const percentage = newArea > 0 ? Math.round((overlapArea / newArea) * 100) : 0;

        if (percentage > 5) {
          overlaps.push({
            routeId: route.routeId,
            name: route.name,
            overlapPercentage: percentage,
          });
        }
      }
    }

    return overlaps;
  },
});

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

function getOverlapArea(
  a: { minLat: number; maxLat: number; minLng: number; maxLng: number },
  b: { minLat: number; maxLat: number; minLng: number; maxLng: number },
) {
  const overlapLat = Math.max(0, Math.min(a.maxLat, b.maxLat) - Math.max(a.minLat, b.minLat));
  const overlapLng = Math.max(0, Math.min(a.maxLng, b.maxLng) - Math.max(a.minLng, b.minLng));
  return overlapLat * overlapLng;
}

function getArea(bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number }) {
  return (bounds.maxLat - bounds.minLat) * (bounds.maxLng - bounds.minLng);
}
