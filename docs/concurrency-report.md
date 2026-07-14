# 并发问题分析报告

> 项目：CampusTrade 校园二手交易平台
> 场景：商品抢购（多用户同时下单同一商品）
> 风险等级：高（库存数据一致性）

---

## 1. 问题描述

校园二手交易平台的核心交易场景中，存在**多个用户同时抢购同一件商品**的竞态条件（Race Condition）。典型场景：

- 一件热门二手商品（例如教材、电子产品）发布后，多个学生同时点击"立即购买"
- 商品库存为 1，但多个用户的购买请求可能同时到达服务端
- 如果没有并发控制，可能导致**超卖**— 多个用户同时"成功"购买同一件商品，库存变为负数

### 1.1 未经控制的竞态场景

假设库存 stock=1，两个用户同时发起购买请求：

```
时间线:
用户A: SELECT stock FROM goods WHERE id=1  → stock=1
用户B: SELECT stock FROM goods WHERE id=1  → stock=1
用户A: INSERT INTO orders (goods_id=1, buyer=A)  → 成功
用户B: INSERT INTO orders (goods_id=1, buyer=B)  → 成功（超卖！）
```

结果：两个用户都下单成功，但库存只减了 1，实际应该是负数。这是典型的**读-改-写**竞态条件。

---

## 2. 解决方案：三层防护架构

### 第一层：乐观锁（应用层）

**原理**：通过在 goods 表中增加 `version` 字段，使用 CAS（Compare-And-Swap）机制确保更新操作的原子性。

**表结构**：
```sql
CREATE TABLE goods (
  id      INTEGER PRIMARY KEY,
  stock   INTEGER NOT NULL DEFAULT 1 CHECK(stock >= 0),
  version INTEGER NOT NULL DEFAULT 0,
  ...
);
```

**SQL 实现**：
```sql
UPDATE goods
SET stock = stock - 1,
    version = version + 1,
    updated_at = datetime('now')
WHERE id = ?
  AND version = ?
  AND stock > 0;
```

**工作原理**：
1. 下单时先读取当前商品的 `version`
2. 在事务中执行 UPDATE，WHERE 条件包含读到的 `version`
3. 如果 `version` 未被其他事务改变，UPDATE 成功（影响行数 = 1）
4. 如果 `version` 已被其他事务改变，UPDATE 失败（影响行数 = 0），说明发生了并发冲突
5. 影响行数为 0 时，返回 409 错误码

**代码实现**（orders/route.ts）：
```typescript
const result = transaction(() => {
  const goods = db.prepare(
    "SELECT * FROM goods WHERE id = ? AND status = 'approved'"
  ).get(goodsId);
  if (!goods) return { error: "商品不存在", code: 40401 };
  if (goods.stock <= 0) return { error: "库存不足", code: 40901 };

  const updateResult = db.prepare(
    "UPDATE goods SET stock = stock - 1, version = version + 1, ..."
    + " WHERE id = ? AND version = ? AND stock > 0"
  ).run(goodsId, goods.version);

  if (updateResult.changes === 0) {
    return { error: "已被其他用户抢先购买", code: 40901 };
  }
  // ... 创建订单
});
```

### 第二层：部分唯一索引（数据库层）

**原理**：在订单表上创建部分唯一索引，确保同一买家对同一商品只能有一个 `pending_pay` 状态的活跃订单。

**DDL**：
```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_unique_active
ON orders(goods_id, buyer_id)
WHERE status = 'pending_pay';
```

**作用**：
- 当下单请求 INSERT 时，如果同一用户已经对该商品有一个待付款订单，SQLite 会抛出 UNIQUE 约束违反错误
- 这是第二道防线：即使乐观锁由于某种原因没有拦截（例如网络分区），数据库层也能兜底
- 该索引在订单状态变为 paid/completed/cancelled 后自动失效，允许重新下单

### 第三层：状态机校验

**原理**：订单状态严格按预定义的状态机流转，每一状态转换都有前置条件校验。

```typescript
const transitions = {
  pay: "paid",        // pending_pay -> paid
  cancel: "cancelled", // pending_pay -> cancelled
  complete: "completed", // paid -> completed
};
const allowedPrev = {
  pay: "pending_pay",
  cancel: "pending_pay",
  complete: "paid",
};

if (order.status !== allowedPrev[action]) {
  return error("当前状态不允许此操作");
}
```

**库存恢复机制**：取消待付款订单时，自动释放库存：
```sql
UPDATE goods SET stock = stock + 1, updated_at = datetime('now')
WHERE id = ?;
```

---

## 3. 事务保证

使用 better-sqlite3 的同步事务 API，将库存扣减和订单创建放在同一个事务中：

```typescript
import { transaction } from "@/lib/db";

const result = transaction(() => {
  // 1. 读取商品（含版本号）
  const goods = db.prepare("SELECT * FROM goods WHERE id = ?").get(goodsId);
  // 2. 乐观锁更新库存
  const updateResult = db.prepare("UPDATE goods SET ...").run(goodsId, goods.version);
  // 3. 创建订单
  const orderInfo = db.prepare("INSERT INTO orders (...) VALUES (...)").run(...);
  return { success: true, orderId: orderInfo.lastInsertRowid };
});
```

better-sqlite3 的事务是同步且原子的：要么全部成功提交，要么全部失败回滚。这保证了库存扣减和订单创建的一致性。

---

## 4. 测试验证

### 4.1 测试场景

| 参数 | 值 |
|------|-----|
| 并发请求数 | 100 |
| 商品库存 | 1 |
| 模拟用户数 | 10 |
| 目标接口 | POST /api/orders |

### 4.2 测试结果

```
请求总数:     100
执行耗时:     291ms
下单成功:     1 次  (status=201)
乐观锁拦截:   99 次 (status=409, code=40901)
唯一索引拦截:  0 次
服务器错误:    0 次

最终库存:     0
订单数:       1
```

### 4.3 测试结论

- **第一层（乐观锁）拦截了 99% 的无效请求**，99 个并发请求在 UPDATE 阶段因 version 不匹配或 stock=0 而失败
- **第二层（唯一索引）未触发**，因为所有冲突已在第一层解决
- **零超卖**：最终库存 = 0，订单数 = 1，无负库存
- **零错误**：所有 100 个请求均正常返回，无 500 错误、无死锁、无超时
- **响应时间**：100 个并发请求在 291ms 内全部完成，性能表现良好

---

## 5. 与替代方案对比

| 方案 | 优点 | 缺点 |
|------|------|------|
| **乐观锁（当前方案）** | 无锁等待，高并发性能好 | 乐观冲突时需重试或放弃 |
| **悲观锁（SELECT FOR UPDATE）** | 确保串行化，无超卖风险 | 并发性能差，容易死锁 |
| **Redis 分布式锁** | 跨服务协调，性能好 | 引入额外依赖，复杂度高 |
| **消息队列削峰** | 请求平滑处理 | 架构复杂，不适合本项目规模 |

**选择理由**：本项目使用 SQLite（better-sqlite3），不支持 SELECT FOR UPDATE。乐观锁方案与 SQLite 同步 API 天然匹配，实现简单、性能优异，且有唯一索引作兜底，适合校园二手交易这种非高并发场景。

---

## 6. 潜在风险与改进建议

| 风险 | 影响 | 改进建议 |
|------|------|----------|
| 乐观锁冲突时请求直接失败 | 用户体验差（需重试） | 前端自动重试 1-2 次，或加入排队队列 |
| 取消订单恢复库存时的并发 | 多次取消可能导致库存异常 | 对取消操作也加版本号校验 |
| 同一用户重复下单 | 第二个请求被唯一索引拦截，但第一个已扣库存 | 可在应用层先检查再扣库存（当前已有部分索引兜底） |
| 无超时机制 | pending_pay 订单可长期占用库存 | 添加定时任务，超过 30 分钟未付款自动取消 |

---

*本文档由 AI 起草，需人工审核确认。*
