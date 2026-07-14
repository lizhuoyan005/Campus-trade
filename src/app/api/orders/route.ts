import { NextRequest } from "next/server";
import { getDb, transaction } from "@/lib/db";
import { success, error, ErrorCode } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import { validate, createOrderSchema } from "@/lib/validate";

export async function GET(req: NextRequest) {
  try {
    const authUser = requireAuth(req);
    if (!authUser) return error("请先登录", ErrorCode.UNAUTHORIZED, 401);

    const sp = req.nextUrl.searchParams;
    const role = sp.get("role") || "buyer";
    const statusFilter = sp.get("status");
    const db = getDb();

    let sql, params;
    if (role === "seller") {
      sql = "SELECT o.*, g.title as goods_title, u.nickname as buyer_name FROM orders o JOIN goods g ON o.goods_id = g.id JOIN users u ON o.buyer_id = u.id WHERE o.seller_id = ?";
      params = [authUser.userId];
    } else {
      sql = "SELECT o.*, g.title as goods_title, g.price as goods_price, u.nickname as seller_name FROM orders o JOIN goods g ON o.goods_id = g.id JOIN users u ON g.seller_id = u.id WHERE o.buyer_id = ?";
      params = [authUser.userId];
    }
    if (statusFilter) { sql += " AND o.status = ?"; params.push(statusFilter); }
    sql += " ORDER BY o.created_at DESC";

    const rows = db.prepare(sql).all(...params);
    return success(rows);
  } catch (e: any) {
    return error(e.message || "获取订单列表失败", ErrorCode.INTERNAL, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = requireAuth(req);
    if (!authUser) return error("请先登录", ErrorCode.UNAUTHORIZED, 401);

    const parsed = await validate(createOrderSchema, await req.json());
    if (!parsed.success) return parsed.response;

    const { goodsId, remark } = parsed.data;
    const db = getDb();

    // 在事务中执行并发安全的订单创建
    const result = transaction(() => {
      // 1. 读取商品（含当前版本号）
      const goods = db.prepare("SELECT * FROM goods WHERE id = ? AND status = 'approved'").get(goodsId) as any;
      if (!goods) return { error: "商品不存在或已下架", code: ErrorCode.NOT_FOUND, status: 404 };
      if (goods.stock <= 0) return { error: "商品库存不足", code: ErrorCode.CONFLICT, status: 409 };

      // 2. 乐观锁更新库存
      const updateResult = db.prepare(
        "UPDATE goods SET stock = stock - 1, version = version + 1, updated_at = datetime('now') WHERE id = ? AND version = ? AND stock > 0"
      ).run(goodsId, goods.version);

      if (updateResult.changes === 0) return { error: "商品已被其他用户抢先购买", code: ErrorCode.CONFLICT, status: 409 };

      // 3. 生成订单号
      const orderNo = `${Date.now()}${Math.random().toString(36).substring(2, 10)}`;

      // 4. 创建订单（唯一约束捕获重复下单）
      try {
        const orderInfo = db.prepare(
          "INSERT INTO orders (order_no, goods_id, buyer_id, seller_id, price, remark, status) VALUES (?, ?, ?, ?, ?, ?, 'pending_pay')"
        ).run(orderNo, goodsId, authUser.userId, goods.seller_id, goods.price, remark);
        return { success: true, orderId: Number(orderInfo.lastInsertRowid), orderNo, price: goods.price };
      } catch (e: any) {
        if (e.message && e.message.includes("UNIQUE")) {
          return { error: "您已对该商品下单，请勿重复操作", code: ErrorCode.DUPLICATE, status: 409 };
        }
        throw e;
      }
    });

    if (result.error) return error(result.error, result.code, result.status);
    return success({
      id: result.orderId,
      order_no: result.orderNo,
      price: result.price,
      status: "pending_pay",
    }, 201);
  } catch (e: any) {
    return error(e.message || "创建订单失败", ErrorCode.INTERNAL, 500);
  }
}
