import "./config/env.js"
import express from 'express'
import cookieParser from 'cookie-parser';
import authRoute from "./routes/auth.routes.js"
import './db/index.js';
import cors from 'cors';
import apiRoute from './routes/api.routes.js';
import { proxyMiddleware } from "./middleware/proxy.middleware.js";
import { forwardMiddleware } from "./middleware/forward.middleware.js";
import { rateLimitMiddleware } from './middleware/ratelimit.middleware.js';
import { processLogs } from './workers/logWorkers.js';
import  analyticsRoute from './routes/analytics.route.js'

const app = express();
app.use(express.json())
app.use(cookieParser())

app.use(cors({
    origin: '',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
}));

app.get('/', (req, res) => {
    res.send("Server is running");
})
app.use("/api/auth/", authRoute)
app.use("/api/", apiRoute)
app.use("/api/proxy", proxyMiddleware, rateLimitMiddleware, forwardMiddleware)
app.use("/api/analytics",analyticsRoute)
processLogs();
setInterval(processLogs, 10000)

app.listen(process.env.PORT, () => {
    console.log("server is running at port 3000")
})

export default app;