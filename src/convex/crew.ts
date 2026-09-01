import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("crew").collect(),
});

export const getByRole = query({
  args: { role: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("crew")
      .withIndex("by_role", (q) => q.eq("role", args.role))
      .collect();
  },
});

export const getByBus = query({
  args: { busId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("crew")
      .withIndex("by_bus", (q) => q.eq("assignedBus", args.busId))
      .collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("crew"),
    dutyStatus: v.optional(v.string()),
    attendanceStatus: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const patch: Record<string, any> = {};
    for (const [k, val] of Object.entries(updates)) {
      if (val !== undefined) patch[k] = val;
    }
    await ctx.db.patch(id, patch);
  },
});
