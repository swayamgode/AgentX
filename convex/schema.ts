import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.optional(v.string()),
    token: v.optional(v.string()), // For YouTube/Twitter auth
  }).index("by_email", ["email"]),
  
  videos: defineTable({
    userId: v.string(), // Link to user
    youtubeId: v.string(),
    title: v.string(),
    topic: v.string(),
    stats: v.optional(v.object({
      viewCount: v.string(),
      likeCount: v.string(),
      commentCount: v.string(),
    })),
    uploadedAt: v.string(),
  }).index("by_user", ["userId"]),
});
