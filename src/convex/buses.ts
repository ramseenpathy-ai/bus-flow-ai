import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function isTimeOverlap(
  start1: string, end1: string,
  start2: string, end2: string,
): boolean {
  const s1 = timeToMinutes(start1);
  const e1 = timeToMinutes(end1);
  const s2 = timeToMinutes(start2);
  const e2 = timeToMinutes(end2);
  // Handle overnight shifts
  if (e1 < s1) {
    return !(e2 <= s1 || s2 >= e1);
  }
  return s1 < e2 && s2 < e1;
}

// Get all buses
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("buses").collect();
  },
});

// Get buses by status
export const listByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("buses")
      .withIndex("by_status", (q) => q.eq("currentStatus", args.status as any))
      .collect();
  },
});

// Get a single bus
export const get = query({
  args: { busId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("buses")
      .withIndex("by_busId", (q) => q.eq("busId", args.busId))
      .first();
  },
});

// Create a bus
export const create = mutation({
  args: {
    busId: v.string(),
    capacity: v.number(),
    currentStatus: v.string(),
    depot: v.string(),
    assignedRoute: v.optional(v.string()),
    assignedDuty: v.optional(v.string()),
    availabilityTime: v.optional(v.string()),
    maintenanceStatus: v.optional(v.string()),
    lastMaintenance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("buses", {
      ...args,
      currentStatus: args.currentStatus as any,
    });
  },
});

// Update a bus
export const update = mutation({
  args: {
    id: v.id("buses"),
    busId: v.optional(v.string()),
    capacity: v.optional(v.number()),
    currentStatus: v.optional(v.string()),
    depot: v.optional(v.string()),
    assignedRoute: v.optional(v.string()),
    assignedDuty: v.optional(v.string()),
    availabilityTime: v.optional(v.string()),
    maintenanceStatus: v.optional(v.string()),
    lastMaintenance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }
    if (filteredUpdates.currentStatus) {
      filteredUpdates.currentStatus = filteredUpdates.currentStatus as any;
    }
    await ctx.db.patch(id, filteredUpdates);
  },
});

// Delete a bus
export const remove = mutation({
  args: { id: v.id("buses") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Check if bus is available for a time slot
export const checkAvailability = query({
  args: {
    busId: v.string(),
    startTime: v.string(),
    endTime: v.string(),
  },
  handler: async (ctx, args) => {
    const bus = await ctx.db
      .query("buses")
      .withIndex("by_busId", (q) => q.eq("busId", args.busId))
      .first();

    if (!bus) {
      return { available: false, message: "Bus not found" };
    }

    if (bus.currentStatus === "maintenance") {
      return { available: false, message: `${bus.busId} is under maintenance` };
    }

    if (bus.currentStatus === "off_duty") {
      return { available: false, message: `${bus.busId} is off duty` };
    }

    // Check for double-booking
    const existingDuties = await ctx.db
      .query("duties")
      .withIndex("by_bus", (q) => q.eq("busId", args.busId))
      .collect();

    const conflictingDuty = existingDuties.find((duty) => {
      if (duty.status === "cancelled") return false;
      return isTimeOverlap(args.startTime, args.endTime, duty.startTime, duty.endTime);
    });

    if (conflictingDuty) {
      return {
        available: false,
        message: `${bus.busId} is already assigned to duty from ${conflictingDuty.startTime} to ${conflictingDuty.endTime}`,
      };
    }

    return { available: true, message: `${bus.busId} is available` };
  },
});
