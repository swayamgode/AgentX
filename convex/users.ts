import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get the currently authenticated user's identity
 */
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    return {
      name: identity.name ?? identity.email ?? "User",
      email: identity.email ?? "",
      tokenIdentifier: identity.tokenIdentifier,
    };
  },
});

export const getVideos = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("videos")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .take(100);
  },
});
