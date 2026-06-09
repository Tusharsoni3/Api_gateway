import { db } from "../db/index.js";
import { apiKeys, requestLogs } from "../db/schema.js";
import { eq, and, count, avg, desc } from "drizzle-orm";
import { redis } from "../config/redis.js";

export const getUserAnalytics = async (req, res) => {
    try {
        const { id: userId } = req.user;

        const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, userId));

        if (!keys || keys.length === 0) {
            return res.status(200).json({
                message: "User analytics fetched successfully",
                analytics: []
            });
        }

        const analytics = await Promise.all(keys.map(async (key) => {
            const [total] = await db.select({ count: count() })
                .from(requestLogs)
                .where(eq(requestLogs.apiKey, key.key));

            const [blocked] = await db.select({ count: count() })
                .from(requestLogs)
                .where(and(eq(requestLogs.apiKey, key.key), eq(requestLogs.isBlocked, true)));

            const [avgTime] = await db.select({ avg: avg(requestLogs.responseTime) })
                .from(requestLogs)
                .where(eq(requestLogs.apiKey, key.key));

         

            return {
                key             : key.key,
                name            : key.name,
                url             : key.url,
                isActive        : key.isActive,
                rateLimit       : key.rateLimit,
                totalRequests   : total.count,
                blockedRequests : blocked.count,
                avgResponseTime : avgTime.avg,
            };
        }));

        return res.status(200).json({
            message  : "User analytics fetched successfully",
            analytics
        });

    } catch (error) {
        console.error("Internal server error at getUserAnalytics:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getApiKeyOverview = async (req, res) => {
    try {
        const { apikey } = req.params;
        const { id: userId } = req.user;

        const [key] = await db.select().from(apiKeys)
            .where(and(eq(apiKeys.key, apikey), eq(apiKeys.userId, userId))).limit(1);

        if (!key) {
            return res.status(404).json({ message: "Key not found" });
        }


        // total requests
        const [total] = await db.select({ count: count() })
            .from(requestLogs)
            .where(eq(requestLogs.apiKey, apikey));

        // blocked requests
        const [blocked] = await db.select({ count: count() })
            .from(requestLogs)
            .where(and(eq(requestLogs.apiKey, apikey), eq(requestLogs.isBlocked, true)));

        // average response time
        const [avgTime] = await db.select({ avg: avg(requestLogs.responseTime) })
            .from(requestLogs)
            .where(eq(requestLogs.apiKey, apikey));

        // recent logs
        const recentLogs = await db.select()
            .from(requestLogs)
            .where(eq(requestLogs.apiKey, apikey))
            .orderBy(desc(requestLogs.createdAt))
            .limit(10);

        const slidingKey = `sliding:${apikey}`;
        const used = await redis.zcard(slidingKey);
        const ttl = await redis.ttl(slidingKey);
        const rateLimit = key.rateLimit;
        const remaining = Math.max(0, rateLimit - used);

        return res.status(200).json({
            message : "API key overview fetched successfully",
            overview: {
                name           : key.name,
                url            : key.url,
                isActive       : key.isActive,
                createdAt      : key.createdAT,
                rateLimit,
                rateLimitUsage : {
                    used,
                    remaining,
                    resetsIn     : ttl > 0 ? `${ttl}s` : '60s',
                },
                requests       : {
                    total          : total.count,
                    blocked        : blocked.count,
                    avgResponseTime: avgTime.avg,
                    recentLogs     : recentLogs
                }
            }
        });

    } catch (error) {
        console.error("Internal server error at getApiKeyOverview:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}