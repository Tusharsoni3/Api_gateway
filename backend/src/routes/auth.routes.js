import { Router } from "express";
import { signup,login,logout,} from "../controller/auth.controller.js";
import { registerSchema , loginSchema,validate,authMiddleware} from '../middleware/auth.middleware.js';

const route = Router();

route.post("/signup",validate(registerSchema),signup);
route.post("/login",validate(loginSchema),login);
route.post("/logout",authMiddleware,logout);


export default route;