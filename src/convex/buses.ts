import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("buses").collect(),
});

export const getByStatus = query({
  args: { status: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("buses")
      .withIndex("by_status", (q) => q.eq("currentStatus", args.status as any))
      .collect();
  },
});

export const update = mutation({
  args: {
    id: v.id("buses"),
    currentStatus: v.optional(v.string()),
    fuelLevel: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const patch: Record<string, any> = {};
    for (const [k, val] of Object.entries(updates)) {
      if (val !== undefined) patch[k] = val;
    }
    if (patch.currentStatus) patch.currentStatus = patch.currentStatus as any;
    await ctx.db.patch(id, patch);
  },
});
