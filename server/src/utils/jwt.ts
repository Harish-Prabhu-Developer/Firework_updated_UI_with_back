import jwt from "jsonwebtoken";
import "dotenv/config";

const SECRET = process.env.JWT_SECRET || "default_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_default_secret";

export const signToken = (payload: object) =>
  jwt.sign(payload, SECRET, { 
    expiresIn: (process.env.JWT_EXPIRES as any) || "15m" 
  });

export const signRefreshToken = (payload: object) =>
  jwt.sign(payload, REFRESH_SECRET, { 
    expiresIn: (process.env.JWT_REFRESH_EXPIRES as any) || "7d" 
  });

export const verifyToken = (token: string): any =>
  jwt.verify(token, SECRET);

export const verifyRefreshToken = (token: string): any =>
  jwt.verify(token, REFRESH_SECRET);
