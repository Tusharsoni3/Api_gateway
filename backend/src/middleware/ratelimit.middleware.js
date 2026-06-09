import { redis } from "../config/redis.js"

export const rateLimitMiddleware = async (req, res, next) => {
    try {
        const apikey = req.apikey;
        const RATE_LIMIT = req.rateLimit;

        const now = Date.now()
        const windowStart = now - 60000
        const key = `sliding:${apikey}`

        await redis.zremrangebyscore(key, '-inf', windowStart)

        const count = await redis.zcard(key)


        if (count >= RATE_LIMIT) {
            await redis.rpush('log_queue', JSON.stringify({
                apiKey: apikey,
                route: req.path,
                method: req.method,
                status: 429,
                responseTime: 0,
                isBlocked: true,
                createdAt: new Date()
            }))
            return res.status(429).json({
                message: "Rate limit exceeded. Try again after a minute.",
                success: false
            })
        }

        await redis.zadd(key, now, now.toString())

        await redis.expire(key, 60)

        next()

    } catch (error) {
        console.error("Rate limit error:", error)
        return res.status(500).json({ message: "Internal server error" })
    }
}