import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { success, error, ErrorCode } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (!user) return error("未登录或Token已过期", ErrorCode.UNAUTHORIZED, 401);

    const row = getDb().prepare(
      "SELECT id, username, nickname, avatar, role, contact, created_at FROM users WHERE id = ?"
    ).get(user.userId) as any;

    if (!row) return error("用户不存在", ErrorCode.NOT_FOUND, 404);

    return success(row);
  } catch (e: any) {
    return error(e.message || "获取用户信息失败", ErrorCode.INTERNAL, 500);
  }
}
