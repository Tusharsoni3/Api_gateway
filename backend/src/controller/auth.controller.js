import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { configDotenv } from "dotenv";
import { eq } from 'drizzle-orm';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

configDotenv();

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 15 * 24 * 60 * 60 * 1000
}

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '20d'
    });
}

export const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const [existingUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await db.insert(users).values({
            name,
            email,
            password: hashedPassword,
            provider: 'email'
        });

        return res.status(201).json({ message: "User registered successfully" });

    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({ message: "Something went wrong while signing up" });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const [userExist] = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (!userExist) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const validUser = await bcrypt.compare(password, userExist.password);
        if (!validUser) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = generateToken(userExist.id);
        res.cookie('token', token, cookieOptions);
        return res.status(200).json({ message: "Login successful" });

    } catch (error) {
        console.error("Login Error:", error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
}

export const logout = (req, res) => {
    try {
        res.cookie('token', "", { ...cookieOptions, maxAge: 1 });
        return res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        return res.status(500).json({ message: "Something went wrong while logging out" });
    }
}