import { db } from "../db/index.js";
import { requestLogs } from "../db/schema.js";
import { redis } from "../config/redis.js";

export const processLogs = async () => {
    try {
        const logs = await redis.lrange('log_queue', 0, -1);
        if (logs.length === 0) return;

        const parsed = logs.map(log => {
            const parsed = JSON.parse(log)
            return {
                ...parsed,
                createdAt: new Date(parsed.createdAt)
            }
        })
        await db.insert(requestLogs).values(parsed)
        await redis.ltrim('log_queue', logs.length, -1)
    } catch (error) {
        console.error("Something went wrong at process logs:", error);
    }
}