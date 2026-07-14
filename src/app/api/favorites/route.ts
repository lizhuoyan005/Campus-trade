import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { success, error, ErrorCode } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const authUser = requireAuth(req);
    if (!authUser) return error("请先登录", ErrorCode.UNAUTHORIZED, 401);

    const rows = getDb().prepare(`
      SELECT g.*, c.name as category_name, u.nickname as seller_name
      FROM favorites f
      JOIN goods g ON f.goods_id = g.id
      JOIN categories c ON g.category_id = c.id
      JOIN users u ON g.seller_id = u.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(authUser.userId);

    return success(rows);
  } catch (e: any) {
    return error(e.message || "获取收藏列表失败", ErrorCode.INTERNAL, 500);
  }
}
