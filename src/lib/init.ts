import { initDb, seedDb, getDb } from "./db";

let initialized = false;

/** 确保数据库已初始化（建表 + 种子数据），允许多次安全调用 */
export function ensureDb(): void {
  if (initialized) return;
  getDb();
  initDb();
  seedDb();
  initialized = true;
}
