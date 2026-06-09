import crypto from 'crypto';
import { db } from "../db/index.js";
import { and, eq, sql } from 'drizzle-orm';
import { apiKeys, requestLogs } from "../db/schema.js"
import jwt from "jsonwebtoken"
import { redis } from "../config/redis.js"

const generateApiKey = (prefix = 'ak') => {
    const randomBytes = crypto.randomBytes(32).toString('hex');
    return `${prefix}_${randomBytes}`;
}
export const apiKeyGenerate = async (req, res) => {
    try {
        const { name, URL, rateLimit } = req.body;
        const parsedRateLimit = rateLimit ? parseInt(rateLimit) : 100;

        if (!name || !URL) {
            return res.status(400).json({
                message: "Name and URL both are required"
            });
        }

        if (rateLimit && (isNaN(rateLimit) || rateLimit < 1)) {
            return res.status(400).json({
                message: "Rate limit must be a valid positive number"
            });
        }

        const { id } = req.user;
        if (!id) {
            return res.status(400).json({
                message: "Id not found"
            });
        }

        const apikey = generateApiKey('ak');

        const [result] = await db.insert(apiKeys).values({
            userId: id,
            name,
            key: apikey,
            url: URL,
            rateLimit: parsedRateLimit
        }).returning();

        return res.status(201).json({
            message: 'API key generated successfully',
            name: result.name,
            key: result.key,
            url: result.url,
            rateLimit: parsedRateLimit
        });

    } catch (error) {
        console.error("Something went wrong at api key generation", error);
        return res.status(500).json({ message: "Something went wrong while api key generation" });
    }
}
export const getAllApi = async (req, res) => {
    try {
        const { id } = req.user;

        const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, id));

        return res.status(200).json({
            message: "API key fetched successfully",
            keys: keys || []
        })
    } catch (error) {
        console.error("Internal server error at getAllApi:", error);
        return res.status(500).json({ message: "Internal server error" })
    }
}
export const deleteKey = async (req, res) => {
    try {
        const { apikey } = req.params;
        if (!apikey) {
            return res.status(400).json({ message: "API key is required" });
        }

        const { id: userId } = req.user;

        const [key] = await db.delete(apiKeys)
            .where(and(eq(apiKeys.key, apikey), eq(apiKeys.userId, userId)))
            .returning();

        if (!key) {
            return res.status(404).json({ message: "Key not found" });
        }

        await redis.del(`apikey:${apikey}`);

        return res.status(200).json({ message: "API key deleted successfully" });

    } catch (error) {
        console.error("Internal server error at deleteKey:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export const changeActiveStatus = async (req, res) => {
    try {
        const { apikey } = req.params;
        if (!apikey) {
            return res.status(400).json({ message: "API key is required" });
        }

        const { id: userId } = req.user;

        const [updated] = await db.update(apiKeys)
            .set({ isActive: sql`NOT ${apiKeys.isActive}` })
            .where(and(eq(apiKeys.key, apikey), eq(apiKeys.userId, userId)))
            .returning();

        if (!updated) {
            return res.status(404).json({ message: "Key not found" });
        }

        await redis.del(`apikey:${apikey}`);

        return res.status(200).json({
            message: `API key ${updated.isActive ? 'activated' : 'deactivated'} successfully`,
            isActive: updated.isActive
        });

    } catch (error) {
        console.error("Internal server error at changeActiveStatus:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}