-- ============================================================
-- 校园二手交易平台 - 数据库 Schema
-- 数据库引擎: SQLite (via better-sqlite3)
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT    NOT NULL UNIQUE,
  password_hash TEXT    NOT NULL,
  nickname      TEXT    NOT NULL,
  avatar        TEXT    DEFAULT NULL,
  role          TEXT    NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  contact       TEXT    DEFAULT NULL,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id   INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  icon TEXT
);

CREATE TABLE IF NOT EXISTS goods (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  title          TEXT    NOT NULL,
  description    TEXT    NOT NULL DEFAULT '',
  price          REAL    NOT NULL CHECK(price >= 0),
  original_price REAL    DEFAULT NULL,
  category_id    INTEGER NOT NULL DEFAULT 6,
  images         TEXT    NOT NULL DEFAULT '[]',
  seller_id      INTEGER NOT NULL,
  status         TEXT    NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','sold','offline')),
  reject_reason  TEXT    DEFAULT NULL,
  stock          INTEGER NOT NULL DEFAULT 1 CHECK(stock >= 0),
  version        INTEGER NOT NULL DEFAULT 0,
  view_count     INTEGER NOT NULL DEFAULT 0,
  contact        TEXT    DEFAULT NULL,
  created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (seller_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS goods_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  url        TEXT    NOT NULL,
  goods_id   INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (goods_id) REFERENCES goods(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS orders (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no   TEXT    NOT NULL UNIQUE,
  goods_id   INTEGER NOT NULL,
  buyer_id   INTEGER NOT NULL,
  seller_id  INTEGER NOT NULL,
  price      REAL    NOT NULL CHECK(price >= 0),
  status     TEXT    NOT NULL DEFAULT 'pending_pay' CHECK(status IN ('pending_pay','paid','completed','cancelled')),
  remark     TEXT    DEFAULT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (goods_id)  REFERENCES goods(id),
  FOREIGN KEY (buyer_id)  REFERENCES users(id),
  FOREIGN KEY (seller_id) REFERENCES users(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_order_unique_active
  ON orders(goods_id, buyer_id) WHERE status = 'pending_pay';

CREATE TABLE IF NOT EXISTS favorites (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL,
  goods_id   INTEGER NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, goods_id),
  FOREIGN KEY (user_id)  REFERENCES users(id),
  FOREIGN KEY (goods_id) REFERENCES goods(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_goods_status   ON goods(status);
CREATE INDEX IF NOT EXISTS idx_goods_category ON goods(category_id);
CREATE INDEX IF NOT EXISTS idx_goods_seller   ON goods(seller_id);
CREATE INDEX IF NOT EXISTS idx_goods_created  ON goods(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_buyer   ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller  ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
