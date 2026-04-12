import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * YouTube Accounts
 */

export const listAccounts = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("youtube_accounts")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    },
});

export const getAccount = query({
    args: { userId: v.string(), channelId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("youtube_accounts")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("channelId"), args.channelId))
            .first();
    },
});

export const addAccount = mutation({
    args: {
        userId: v.string(),
        account: v.object({
            channelName: v.string(),
            channelId: v.string(),
            email: v.string(),
            watermark: v.string(),
            thumbnailUrl: v.optional(v.string()),
            tokens: v.object({
                access_token: v.string(),
                refresh_token: v.optional(v.string()),
                expiry_date: v.optional(v.number())
            }),
            appCredentials: v.optional(v.object({
                clientId: v.string(),
                clientSecret: v.string()
            }))
        })
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("youtube_accounts")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .filter((q) => q.eq(q.field("channelId"), args.account.channelId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...args.account,
                tokens: {
                    ...existing.tokens,
                    ...args.account.tokens,
                    refresh_token: args.account.tokens.refresh_token || existing.tokens.refresh_token
                }
            });
            return existing._id;
        }

        return await ctx.db.insert("youtube_accounts", {
            ...args.account,
            userId: args.userId,
            createdAt: new Date().toISOString()
        });
    },
});

export const removeAccount = mutation({
    args: { userId: v.string(), accountId: v.string() }, // accountId is the Convex ID
    handler: async (ctx, args) => {
        const account = await ctx.db.get(args.accountId as any);
        if (account && account.userId === args.userId) {
            await ctx.db.delete(account._id);
            return true;
        }
        return false;
    },
});

/**
 * Channel Groups
 */

export const listGroups = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("channel_groups")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .collect();
    },
});

export const saveGroup = mutation({
    args: {
        userId: v.string(),
        group: v.object({
            id: v.optional(v.string()), // Convex ID or legacy ID
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
                geminiKey: v.optional(v.string())
            })
        })
    },
    handler: async (ctx, args) => {
        const { id, ...data } = args.group;
        
        if (id && id.startsWith('grp_')) {
            // This is a legacy ID, we should probably migration it or search by it
            const existing = await ctx.db
                .query("channel_groups")
                .withIndex("by_user", (q) => q.eq("userId", args.userId))
                .filter(q => q.eq(q.field("name"), data.name)) // fallback matching
                .first();
            
            if (existing) {
                await ctx.db.patch(existing._id, {
                    ...data,
                    updatedAt: new Date().toISOString()
                });
                return existing._id;
            }
        } else if (id) {
            // Assume Convex ID
            await ctx.db.patch(id as any, {
                ...data,
                updatedAt: new Date().toISOString()
            });
            return id;
        }

        return await ctx.db.insert("channel_groups", {
            ...data,
            userId: args.userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    },
});

export const deleteGroup = mutation({
    args: { userId: v.string(), groupId: v.string() },
    handler: async (ctx, args) => {
        const group = await ctx.db.get(args.groupId as any);
        if (group && group.userId === args.userId) {
            await ctx.db.delete(group._id);
            return true;
        }
        return false;
    },
});

/**
 * Settings
 */

export const getSettings = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("settings")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();
    },
});

export const updateSettings = mutation({
    args: {
        userId: v.string(),
        settings: v.object({
            geminiKey: v.optional(v.string())
        })
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("settings")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, args.settings);
            return existing._id;
        }

        return await ctx.db.insert("settings", {
            ...args.settings,
            userId: args.userId
        });
    },
});
