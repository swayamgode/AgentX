import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get or create a basic user (mock for direct dashboard entry)
 */
export const getOrCreateUser = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    
    if (existing) return existing;
    
    const id = await ctx.db.insert("users", {
       email: args.email,
       name: args.email.split("@")[0],
    });
    
    return await ctx.db.get(id);
  },
});

export const getCurrentUser = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
  },
});

export const getVideos = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("videos")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});
