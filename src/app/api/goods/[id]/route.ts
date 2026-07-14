import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { success, error, ErrorCode } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";

function getGoodsDetail(id: number) {
  return getDb().prepare(`
    SELECT g.*, u.nickname as seller_name, u.contact as seller_contact, c.name as category_name
    FROM goods g
    JOIN users u ON g.seller_id = u.id
    JOIN categories c ON g.category_id = c.id
    WHERE g.id = ?
  `).get(id);
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const goods = getGoodsDetail(Number(id));
    if (!goods) return error("商品不存在", ErrorCode.NOT_FOUND, 404);
    getDb().prepare("UPDATE goods SET view_count = view_count + 1 WHERE id = ?").run(Number(id));
    return success(goods);
  } catch (e: any) {
    return error(e.message || "获取商品详情失败", ErrorCode.INTERNAL, 500);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = requireAuth(req);
    if (!authUser) return error("请先登录", ErrorCode.UNAUTHORIZED, 401);
    const { id } = await params;
    const goodsId = Number(id);

    const db = getDb();
    const goods = db.prepare("SELECT * FROM goods WHERE id = ?").get(goodsId) as any;
    if (!goods) return error("商品不存在", ErrorCode.NOT_FOUND, 404);
    if (goods.seller_id !== authUser.userId && authUser.role !== "admin") {
      return error("无权编辑该商品", ErrorCode.FORBIDDEN, 403);
    }

    const body = await req.json();
    const fields = ["title", "description", "price", "original_price", "category_id", "contact"];
    const updates: string[] = [];
    const vals: any[] = [];
    for (const f of fields) {
      if (body[f] !== undefined) { updates.push(`${f} = ?`); vals.push(body[f]); }
    }
    if (updates.length === 0) return error("没有需要更新的字段", ErrorCode.BAD_REQUEST);
    updates.push("updated_at = datetime('now')");
    vals.push(goodsId);
    db.prepare("UPDATE goods SET " + updates.join(", ") + " WHERE id = ?").run(...vals);
    return success({ id: goodsId, message: "更新成功" });
  } catch (e: any) {
    return error(e.message || "编辑失败", ErrorCode.INTERNAL, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = requireAuth(req);
    if (!authUser) return error("请先登录", ErrorCode.UNAUTHORIZED, 401);
    const { id } = await params;
    const goodsId = Number(id);

    const db = getDb();
    const goods = db.prepare("SELECT * FROM goods WHERE id = ?").get(goodsId) as any;
    if (!goods) return error("商品不存在", ErrorCode.NOT_FOUND, 404);
    if (goods.seller_id !== authUser.userId && authUser.role !== "admin") {
      return error("无权下架该商品", ErrorCode.FORBIDDEN, 403);
    }
    db.prepare("UPDATE goods SET status = 'offline', updated_at = datetime('now') WHERE id = ?").run(goodsId);
    return success({ message: "已下架" });
  } catch (e: any) {
    return error(e.message || "下架失败", ErrorCode.INTERNAL, 500);
  }
}

