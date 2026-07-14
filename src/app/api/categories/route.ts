import { getDb } from "@/lib/db";
import { success, error } from "@/lib/api-utils";
export async function GET() {
  try {
    const rows = getDb().prepare("SELECT * FROM categories ORDER BY id").all() as any[];
    return success(rows);
  } catch (e: any) { return error(e.message || "获取分类失败", 500); }
}