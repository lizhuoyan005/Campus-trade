import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { success, error, paginated, getPagination, ErrorCode } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import { validate, publishGoodsSchema } from "@/lib/validate";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const { page, pageSize, offset } = getPagination(sp);
    const keyword = sp.get("keyword") || "";
    const categoryId = sp.get("categoryId");
    const minPrice = sp.get("minPrice");
    const maxPrice = sp.get("maxPrice");
    const sortBy = sp.get("sortBy") || "newest";
    const status = sp.get("status") || "approved";
    const db = getDb();

    let where = "WHERE 1=1";
    const params: any[] = [];

    where += " AND g.status = ?";
    params.push(status);
    if (keyword) { where += " AND (g.title LIKE ? OR g.description LIKE ?)"; params.push(`%${keyword}%`, `%${keyword}%`); }
    if (categoryId) { where += " AND g.category_id = ?"; params.push(Number(categoryId)); }
    if (minPrice) { where += " AND g.price >= ?"; params.push(Number(minPrice)); }
    if (maxPrice) { where += " AND g.price <= ?"; params.push(Number(maxPrice)); }

    let orderBy = "ORDER BY g.created_at DESC";
    if (sortBy === "price_asc") orderBy = "ORDER BY g.price ASC";
    else if (sortBy === "price_desc") orderBy = "ORDER BY g.price DESC";

    const totalRow: any = db.prepare("SELECT COUNT(*) as total FROM goods g " + where).get(...params);
    const rows: any[] = db.prepare("SELECT g.*, u.nickname as seller_name, u.contact as seller_contact, c.name as category_name FROM goods g JOIN users u ON g.seller_id = u.id JOIN categories c ON g.category_id = c.id " + where + " " + orderBy + " LIMIT ? OFFSET ?").all(...params, pageSize, offset);

    return paginated(rows, totalRow.total, page, pageSize);
  } catch (e: any) {
    return error(e.message || "获取商品列表失败", ErrorCode.INTERNAL, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = requireAuth(req);
    if (!authUser) return error("请先登录", ErrorCode.UNAUTHORIZED, 401);

    const parsed = await validate(publishGoodsSchema, await req.json());
    if (!parsed.success) return parsed.response;

    const { title, description, price, original_price, category_id, images, contact } = parsed.data;
    const db = getDb();

    const info = db.prepare(
      "INSERT INTO goods (title, description, price, original_price, category_id, images, seller_id, contact, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')"
    ).run(title, description, price, original_price || null, category_id, JSON.stringify(images), authUser.userId, contact);

    return success({
      id: Number(info.lastInsertRowid),
      title,
      price,
      status: "pending",
    }, 201);
  } catch (e: any) {
    return error(e.message || "发布失败", ErrorCode.INTERNAL, 500);
  }
}



