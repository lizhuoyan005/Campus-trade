import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";

const DB_PATH =
  process.env.DATABASE_URL?.replace("file:", "") ||
  path.join(process.cwd(), "dev.db");
let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    // 首次连接时自动建表
    const sp = path.join(process.cwd(), "src", "lib", "schema.sql");
    db.exec(fs.readFileSync(sp, "utf-8"));
    // 自动插入种子数据（幂等）
    seedDb();
  }
  return db;
}

/** 在事务中执行回调（用于并发控制） */
export function transaction<T>(fn: () => T): T {
  const d = getDb();
  return d.transaction(fn)();
}

/** 建表（已由 getDb 自动处理，保留为向后兼容） */
export function initDb(): void {
  const d = getDb();
  // 已自动初始化
}

export function seedDb(): void {
  const d = getDb();

  // ---- 分类 ----
  const catCount = d.prepare("SELECT COUNT(*) as cnt FROM categories").get() as any;
  if (catCount.cnt === 0) {
    const ci = d.prepare("INSERT INTO categories (name, icon) VALUES (?, ?)");
    ci.run("教材教辅", "\uD83D\uDCDA");
    ci.run("电子产品", "\uD83D\uDCBB");
    ci.run("生活用品", "\uD83C\uDFE0");
    ci.run("运动户外", "\u26BD");
    ci.run("服饰箱包", "\uD83D\uDC54");
    ci.run("其他", "\uD83D\uDCE6");
  }

  // ---- 用户 ----
    const ui = d.prepare(
      "INSERT OR IGNORE INTO users (username, password_hash, nickname, role, contact) VALUES (?, ?, ?, ?, ?)"
    );
    ui.run("zhangsan", bcrypt.hashSync("123456", 10), "张三", "user", "13800138001");
    ui.run("lisi", bcrypt.hashSync("123456", 10), "李四", "user", "13800138002");
    ui.run("admin", bcrypt.hashSync("admin123", 10), "管理员", "admin", "13800138000");

  // ---- 商品 ----
    const gi = d.prepare(
      "INSERT OR IGNORE INTO goods (title, description, price, original_price, category_id, images, seller_id, status, stock, version, view_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)"
    );
    gi.run("高等数学（第七版）上册", "九成新，内有少量笔记，不影响阅读", 25.00, 58.00, 1, "[]", 1, "approved", 1, 128);
    gi.run("全新机械键盘", "Cherry MX 青轴，买回来只用过一次", 150.00, 299.00, 2, "[]", 2, "approved", 1, 56);
    gi.run("宿舍用小台灯", "LED护眼，三档调光，续航持久", 35.00, 69.00, 3, "[]", 1, "approved", 2, 230);
    gi.run("考研英语历年真题（2024版）", "几乎全新，仅做了前两套", 30.00, 89.00, 1, "[]", 2, "pending", 1, 12);
    gi.run("二手电风扇", "遥控定时，静音款，用了一个夏天", 80.00, 199.00, 3, "[]", 1, "approved", 1, 89);
    gi.run("C程序设计（第五版）", "谭浩强，教材，有划线笔记", 15.00, 39.00, 1, "[]", 2, "approved", 1, 345);
}
