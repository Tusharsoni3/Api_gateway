import { Router } from "express";
import { authMiddleware } from '../middleware/auth.middleware.js';
import { getApiKeyOverview, getUserAnalytics } from "../controller/analytics.controller.js";

const analyticsRoute = Router();

analyticsRoute.get("/user", authMiddleware, getUserAnalytics);
analyticsRoute.get("/overview/:apikey", authMiddleware, getApiKeyOverview);

export default analyticsRoute;