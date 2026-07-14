import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { success, error, ErrorCode } from "@/lib/api-utils";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = requireAdmin(req);
    if (!admin) return error("需要管理员权限", ErrorCode.FORBIDDEN, 403);
    const { id } = await params;
    const gid = Number(id);
    const body = await req.json();
    const action = body.status;

    if (!["approved", "rejected"].includes(action)) {
      return error("无效操作，仅支持 approved 或 rejected", ErrorCode.BAD_REQUEST);
    }

    const db = getDb();
    const goods = db.prepare("SELECT * FROM goods WHERE id = ?").get(gid) as any;
    if (!goods) return error("商品不存在", ErrorCode.NOT_FOUND, 404);
    if (goods.status !== "pending") return error("该商品已被审核", ErrorCode.BAD_REQUEST);

    if (action === "rejected") {
      const reason = body.reason || "未通过审核";
      db.prepare("UPDATE goods SET status = 'rejected', reject_reason = ?, updated_at = datetime('now') WHERE id = ?").run(reason, gid);
    } else {
      db.prepare("UPDATE goods SET status = 'approved', updated_at = datetime('now') WHERE id = ?").run(gid);
    }

    return success({ id: gid, status: action, message: action === "approved" ? "审核通过" : "已驳回" });
  } catch (e: any) {
    return error(e.message || "审核操作失败", ErrorCode.INTERNAL, 500);
  }
}
