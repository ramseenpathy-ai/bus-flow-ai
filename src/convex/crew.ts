import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get all crew members
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("crew").collect();
  },
});

// Get crew by availability
export const listByAvailability = query({
  args: { availability: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("crew")
      .withIndex("by_availability", (q) => q.eq("availability", args.availability as any))
      .collect();
  },
});

// Get a single crew member
export const get = query({
  args: { crewId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("crew")
      .withIndex("by_crewId", (q) => q.eq("crewId", args.crewId))
      .first();
  },
});

// Create a crew member
export const create = mutation({
  args: {
    crewId: v.string(),
    name: v.string(),
    role: v.string(),
    assignedDepot: v.string(),
    availability: v.string(),
    dutyStartTime: v.optional(v.string()),
    dutyEndTime: v.optional(v.string()),
    lastCompletedDuty: v.optional(v.number()),
    requiredRestPeriod: v.number(),
    currentAssignment: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("crew", {
      ...args,
      availability: args.availability as any,
    });
  },
});

// Update a crew member
export const update = mutation({
  args: {
    id: v.id("crew"),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    assignedDepot: v.optional(v.string()),
    availability: v.optional(v.string()),
    dutyStartTime: v.optional(v.string()),
    dutyEndTime: v.optional(v.string()),
    lastCompletedDuty: v.optional(v.number()),
    requiredRestPeriod: v.optional(v.number()),
    currentAssignment: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const filteredUpdates: Record<string, any> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }
    if (filteredUpdates.availability) {
      filteredUpdates.availability = filteredUpdates.availability as any;
    }
    await ctx.db.patch(id, filteredUpdates);
  },
});

// Delete a crew member
export const remove = mutation({
  args: { id: v.id("crew") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Validate rest period: checks if crew member has received required rest
export const validateRestPeriod = query({
  args: {
    crewId: v.string(),
    proposedStartTime: v.string(), // "06:00"
  },
  handler: async (ctx, args) => {
    const crew = await ctx.db
      .query("crew")
      .withIndex("by_crewId", (q) => q.eq("crewId", args.crewId))
      .first();

    if (!crew) {
      return { valid: false, message: "Crew member not found" };
    }

    if (!crew.lastCompletedDuty) {
      return { valid: true, message: "No previous duty recorded — assignment allowed" };
    }

    const now = new Date();
    const lastDutyEnd = new Date(crew.lastCompletedDuty);
    const hoursSinceLastDuty = (now.getTime() - lastDutyEnd.getTime()) / (1000 * 60 * 60);

    if (hoursSinceLastDuty < crew.requiredRestPeriod) {
      const earliestNext = new Date(lastDutyEnd.getTime() + crew.requiredRestPeriod * 60 * 60 * 1000);
      const hoursRemaining = crew.requiredRestPeriod - hoursSinceLastDuty;
      return {
        valid: false,
        message: `Insufficient rest. ${crew.name} completed duty at ${lastDutyEnd.toLocaleTimeString()}. Required rest: ${crew.requiredRestPeriod}h. Earliest next assignment: ${earliestNext.toLocaleTimeString()}. Hours remaining: ${Math.round(hoursRemaining * 10) / 10}h.`,
        hoursRemaining: Math.round(hoursRemaining * 10) / 10,
        earliestNext: earliestNext.toISOString(),
      };
    }

    return {
      valid: true,
      message: `${crew.name} has received sufficient rest (${Math.round(hoursSinceLastDuty * 10) / 10}h of ${crew.requiredRestPeriod}h required)`,
    };
  },
});
