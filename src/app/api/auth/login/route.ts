import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { success, error, ErrorCode } from "@/lib/api-utils";
import { comparePassword, signToken } from "@/lib/auth";
import { validate, loginSchema } from "@/lib/validate";

export async function POST(req) {
  try {
    const parsed = await validate(loginSchema, await req.json());
    if (!parsed.success) return parsed.response;

    const { username, password } = parsed.data;
    const db = getDb();

    // 查找用户
    const user = db.prepare(
      "SELECT * FROM users WHERE username = ?"
    ).get(username) as any;

    if (!user || !comparePassword(password, user.password_hash)) {
      return error("用户名或密码错误", ErrorCode.UNAUTHORIZED, 401);
    }

    // 签发 JWT
    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
    });

    return success({
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
        contact: user.contact,
      },
    });
  } catch (e: any) {
    return error(e.message || "登录失败", ErrorCode.INTERNAL, 500);
  }
}
