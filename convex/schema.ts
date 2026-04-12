import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  videos: defineTable({
    userId: v.string(), // Keeping as string for now to match current usage if any
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

  youtube_accounts: defineTable({
    userId: v.string(),
    channelName: v.string(),
    channelId: v.string(),
    email: v.string(),                      
    watermark: v.string(),
    thumbnailUrl: v.optional(v.string()),
    tokens: v.object({
        access_token: v.string(),
        refresh_token: v.optional(v.string()),
        expiry_date: v.optional(v.number()),
    }),
    appCredentials: v.optional(v.object({
        clientId: v.string(),
        clientSecret: v.string(),
    })),
    createdAt: v.string(),
  }).index("by_user", ["userId"]),

  channel_groups: defineTable({
    userId: v.string(),
    name: v.string(),
    channelIds: v.array(v.string()),
    theme: v.object({
        bgColor: v.string(),
        bgColor2: v.string(),
        textColor: v.string(),
        fontSizeScale: v.number(),
        backgroundType: v.string(),
        textAlign: v.string(),
        topics: v.array(v.string()),
        style: v.string(),
        generationsPerChannel: v.number(),
        geminiKey: v.optional(v.string()),
    }),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_user", ["userId"]),
  
  settings: defineTable({
    userId: v.string(),
    geminiKey: v.optional(v.string()),
    activeAccountId: v.optional(v.string()),
  }).index("by_user", ["userId"]),
});
