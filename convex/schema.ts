import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  videos: defineTable({
    userId: v.string(),
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
