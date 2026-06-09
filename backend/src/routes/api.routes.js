import { Router } from "express";
import { apiKeyGenerate, changeActiveStatus, deleteKey, getAllApi } from '../controller/api.controller.js'
import { authMiddleware, apiKeySchema, validate } from '../middleware/auth.middleware.js';
import { proxyMiddleware } from "../middleware/proxy.middleware.js";
import { forwardMiddleware } from "../middleware/forward.middleware.js";


const apiRoute = Router();

apiRoute.post("/apikey-gen", authMiddleware, validate(apiKeySchema), apiKeyGenerate);
apiRoute.get("/getAllKeys", authMiddleware, getAllApi);
apiRoute.delete("/deleteKey/:apikey", authMiddleware, deleteKey);
apiRoute.post("/changeActiveStatus/:apikey", authMiddleware, changeActiveStatus);

export default apiRoute;