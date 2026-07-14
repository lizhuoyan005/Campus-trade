import { NextRequest } from "next/server";
import { getDb, transaction } from "@/lib/db";
import { success, error, ErrorCode } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = requireAuth(req);
    if (!authUser) return error("请先登录", ErrorCode.UNAUTHORIZED, 401);
    const { id } = await params;
    const gid = Number(id);

    const order: any = getDb().prepare(`
      SELECT o.*, g.title as goods_title, g.price as goods_price,
             u_buyer.nickname as buyer_name, u_seller.nickname as seller_name
      FROM orders o
      JOIN goods g ON o.goods_id = g.id
      JOIN users u_buyer ON o.buyer_id = u_buyer.id
      JOIN users u_seller ON o.seller_id = u_seller.id
      WHERE o.id = ?
    `).get(gid);

    if (!order) return error("订单不存在", ErrorCode.NOT_FOUND, 404);
    if (order.buyer_id !== authUser.userId && order.seller_id !== authUser.userId) {
      return error("无权查看该订单", ErrorCode.FORBIDDEN, 403);
    }
    return success(order);
  } catch (e: any) {
    return error(e.message || "获取订单详情失败", ErrorCode.INTERNAL, 500);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authUser = requireAuth(req);
    if (!authUser) return error("请先登录", ErrorCode.UNAUTHORIZED, 401);
    const { id } = await params;
    const gid = Number(id);

    const body = await req.json();
    const action = body.action;
    if (!["pay", "cancel", "complete"].includes(action)) {
      return error("无效操作，支持 pay/cancel/complete", ErrorCode.BAD_REQUEST);
    }

    const result = transaction(() => {
      const db = getDb();
      const order: any = db.prepare("SELECT * FROM orders WHERE id = ?").get(gid);
      if (!order) return { error: "订单不存在", code: ErrorCode.NOT_FOUND, status: 404 };
      if (order.buyer_id !== authUser.userId) {
        return { error: "无权操作该订单", code: ErrorCode.FORBIDDEN, status: 403 };
      }

      const transitions = { pay: "paid", cancel: "cancelled", complete: "completed" };
      const allowedPrev = { pay: "pending_pay", cancel: "pending_pay", complete: "paid" };

      if (order.status !== allowedPrev[action]) {
        const labels = { pay: "付款", cancel: "取消", complete: "确认完成" };
        return { error: `当前状态为 ${order.status}，不允许${labels[action]}`, code: ErrorCode.BAD_REQUEST, status: 400 };
      }

      const newStatus = transitions[action];
      db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(newStatus, Number(id));

      if (action === "cancel") {
        db.prepare("UPDATE goods SET stock = stock + 1, updated_at = datetime('now') WHERE id = ?").run(order.goods_id);
      }
      return { success: true, status: newStatus };
    });

    if (result.error) return error(result.error, result.code, result.status);
    return success({ id: Number(id), status: result.status, message: "操作成功" });
  } catch (e: any) {
    return error(e.message || "操作失败", ErrorCode.INTERNAL, 500);
  }
}

