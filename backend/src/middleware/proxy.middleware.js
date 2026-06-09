import { apiKeys } from "../db/schema.js";
import { db } from "../db/index.js";
import { eq } from "drizzle-orm";
import { redis } from "../config/redis.js"

const checkValidApiKey = async (apikey) => {
    try {
        if (!apikey) {
            return { valid: false, status: 400, message: "API key is missing" };
        }

        const cached = await redis.get(`apikey:${apikey}`);
        if (cached) {
            const parsed = JSON.parse(cached);
            return { valid: true, key: parsed, targetURL: parsed.url ,rateLimit : parsed.rateLimit };
        }

        const [validkey] = await db.select().from(apiKeys).where(eq(apiKeys.key, apikey)).limit(1);
        
        if (!validkey) {
            return { valid: false, status: 401, message: "Invalid API key" };
        }
        if (!validkey.isActive) {
            return { valid: false, status: 403, message: "API key is inactive" };
        }
        if (!validkey.url) {
            return { valid: false, status: 400, message: "Target URL is missing" };
        }

        const keyData = {
            userId: validkey.userId,
            url: validkey.url,  
            rateLimit : validkey.rateLimit
        }

        await redis.set(`apikey:${apikey}`, JSON.stringify(keyData), 'EX', 3600);
        return { valid: true, key: keyData, targetURL: validkey.url ,rateLimit : validkey.rateLimit };

    } catch (error) {
        console.error("Internal server error at checkValidApiKey:", error);
        return { valid: false, status: 500, message: "Internal Server Error" };
    }
}

const proxyMiddleware = async (req, res, next) => {
    try {
        const apikey = req.headers['api-key'];
        const result = await checkValidApiKey(apikey);

        if (!result.valid) {
            return res.status(result.status).json({
                message: result.message,
                success: false
            });
        }

        req.targetURL = result.targetURL;
        req.apikey = apikey;
        req.rateLimit = result.rateLimit
        req.startTime = Date.now();

        next();

    } catch (error) {
        console.error("Something went wrong at proxyMiddleware:", error);
        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
}

export { checkValidApiKey, proxyMiddleware };