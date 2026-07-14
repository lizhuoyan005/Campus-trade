import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { success, error, ErrorCode } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return error("需要管理员权限", ErrorCode.FORBIDDEN, 403);

    const status = req.nextUrl.searchParams.get("status") || "pending";

    const rows = getDb().prepare(`
      SELECT g.*, u.nickname as user_name, c.name as category_name
      FROM goods g
      JOIN users u ON g.seller_id = u.id
      JOIN categories c ON g.category_id = c.id
      WHERE g.status = ?
      ORDER BY g.created_at DESC
    `).all(status);

    return success(rows);
  } catch (e: any) {
    return error(e.message || "获取审核列表失败", ErrorCode.INTERNAL, 500);
  }
}
