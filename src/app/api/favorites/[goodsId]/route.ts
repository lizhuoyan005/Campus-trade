import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { success, error, ErrorCode } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ goodsId: string }> }) {
  try {
    const authUser = requireAuth(req);
    if (!authUser) return error("请先登录", ErrorCode.UNAUTHORIZED, 401);
    const { goodsId } = await params;
    const gid = Number(goodsId);

    const db = getDb();
    const goods = db.prepare("SELECT id FROM goods WHERE id = ?").get(gid);
    if (!goods) return error("商品不存在", ErrorCode.NOT_FOUND, 404);

    const existing = db.prepare("SELECT id FROM favorites WHERE user_id = ? AND goods_id = ?").get(authUser.userId, gid);
    if (existing) return success({ message: "已收藏" });

    db.prepare("INSERT INTO favorites (user_id, goods_id) VALUES (?, ?)").run(authUser.userId, gid);
    return success({ message: "收藏成功" }, 201);
  } catch (e: any) {
    return error(e.message || "收藏失败", ErrorCode.INTERNAL, 500);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ goodsId: string }> }) {
  try {
    const authUser = requireAuth(req);
    if (!authUser) return error("请先登录", ErrorCode.UNAUTHORIZED, 401);
    const { goodsId } = await params;

    getDb().prepare("DELETE FROM favorites WHERE user_id = ? AND goods_id = ?").run(authUser.userId, Number(goodsId));
    return success({ message: "已取消收藏" });
  } catch (e: any) {
    return error(e.message || "取消收藏失败", ErrorCode.INTERNAL, 500);
  }
}
