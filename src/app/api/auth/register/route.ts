import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { success, error, ErrorCode } from "@/lib/api-utils";
import { hashPassword, signToken } from "@/lib/auth";
import { validate, registerSchema } from "@/lib/validate";

export async function POST(req) {
  try {
    const parsed = await validate(registerSchema, await req.json());
    if (!parsed.success) return parsed.response;

    const { username, password, nickname, contact } = parsed.data;
    const db = getDb();

    // 检查用户名是否已存在
    const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
    if (existing) return error("用户名已存在", ErrorCode.BAD_REQUEST);

    // 创建用户（bcrypt 加密密码）
    const password_hash = hashPassword(password);
    const info = db.prepare(
      "INSERT INTO users (username, password_hash, nickname, contact) VALUES (?, ?, ?, ?)"
    ).run(username, password_hash, nickname, contact || null);

    // 签发 JWT
    const token = signToken({
      userId: Number(info.lastInsertRowid),
      username,
      role: "user",
    });

    return success({
      token,
      user: {
        id: Number(info.lastInsertRowid),
        username,
        nickname,
        role: "user",
      },
    }, 201);
  } catch (e: any) {
    return error(e.message || "注册失败", ErrorCode.INTERNAL, 500);
  }
}
