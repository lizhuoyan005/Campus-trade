import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "campus-trade-dev-secret-key-2024";
const JWT_EXPIRES_IN = "7d";

/** 用户 payload（JWT 中存储的信息） */
export interface JwtPayload {
  userId: number;
  username: string;
  role: "user" | "admin";
}

/** 签发 JWT Token */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/** 验证 JWT Token，返回 payload 或 null */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

/** 从 NextRequest 的 Authorization Header 中提取用户信息 */
export function getAuthUser(req: NextRequest): JwtPayload | null {
  const auth = req.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  return verifyToken(token);
}

/** 必须登录——获取用户，否则返回 null（由调用方决定是否返回 401） */
export function requireAuth(req: NextRequest): JwtPayload | null {
  return getAuthUser(req);
}

/** 必须管理员身份 */
export function requireAdmin(req: NextRequest): JwtPayload | null {
  const user = getAuthUser(req);
  if (!user || user.role !== "admin") return null;
  return user;
}

/** bcrypt 加密密码 */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

/** bcrypt 对比密码 */
export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}
