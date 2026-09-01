import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// List all schedules
export const list = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("schedules").collect(),
});

// List all duties (legacy compatibility)
export const listByDate = query({
  args: { date: v.string() },
  handler: async () => [] as any[],
});

// Conflict detection stubs
export const detectConflicts = query({
  args: { date: v.string() },
  handler: async () => [] as any[],
});

export const getFallbackSuggestions = query({
  args: { routeId: v.string(), startTime: v.string(), endTime: v.string(), date: v.string() },
  handler: async () => [] as any[],
});

// Legacy stubs
export const create = mutation({
  args: { routeId: v.string(), startTime: v.string(), endTime: v.string(), mode: v.string(), date: v.string() },
  handler: async () => ({} as any),
});

export const remove = mutation({
  args: { id: v.id("schedules") },
  handler: async () => ({} as any),
});

export const update = mutation({
  args: { id: v.id("schedules"), notes: v.optional(v.string()) },
  handler: async () => ({} as any),
});

// Legacy seed stub
export const seed = mutation({
  args: {},
  handler: async () => "Use migrateChennai:migrate instead",
});
