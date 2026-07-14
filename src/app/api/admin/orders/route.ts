import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { success, error, ErrorCode } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return error("需要管理员权限", ErrorCode.FORBIDDEN, 403);

    const status = req.nextUrl.searchParams.get("status");
    const db = getDb();

    let sql = `
      SELECT o.*, g.title as goods_title, b.nickname as buyer_name, s.nickname as seller_name
      FROM orders o
      JOIN goods g ON o.goods_id = g.id
      JOIN users b ON o.buyer_id = b.id
      JOIN users s ON o.seller_id = s.id
    `;
    const params: any[] = [];
    if (status) { sql += " WHERE o.status = ?"; params.push(status); }
    sql += " ORDER BY o.created_at DESC";

    const rows = db.prepare(sql).all(...params);
    return success(rows);
  } catch (e: any) {
    return error(e.message || "获取订单列表失败", ErrorCode.INTERNAL, 500);
  }
}
