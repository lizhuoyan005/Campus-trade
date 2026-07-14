// ===================================================
// API 接口测试脚本
// 运行: node tests/api-test.js
// ===================================================

const BASE = "http://localhost:3000";
let passed = 0, failed = 0;

async function api(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  let body;
  try { body = await res.json(); } catch { body = { error: "非JSON响应" }; }
  return { status: res.status, body };
}

function assert(label, ok, detail) {
  if (ok) { passed++; console.log(`  ✅ ${label}`); }
  else { failed++; console.log(`  ❌ ${label}: ${JSON.stringify(detail).slice(0,120)}`); }
}

async function runTests() {
  console.log("\n🧪 校园二手交易平台 API 测试\n");

  const TEST_USER = "t_api_" + Date.now();

  // ── 1. 注册 ──
  console.log("── 1. 用户注册 ──");
  const r1 = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username: TEST_USER, password: "test123", nickname: "测试A" }),
  });
  assert("注册新用户", r1.status === 201 && r1.body.code === 0, r1.body);
  const TOKEN = r1.body.data?.token;

  const r1b = await api("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username: TEST_USER, password: "test123", nickname: "重复" }),
  });
  assert("重复注册返回错误", r1b.status === 400, r1b.body);

  // ── 2. 登录 ──
  console.log("\n── 2. 用户登录 ──");
  const r2 = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: TEST_USER, password: "test123" }),
  });
  assert("登录成功", r2.status === 200 && r2.body.data?.token, r2.body);
  const token = r2.body.data?.token;
  const authH = { Authorization: "Bearer " + token };

  const r2b = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: TEST_USER, password: "wrong" }),
  });
  assert("错误密码返回 401", r2b.status === 401, r2b.body);

  // ── 3. 获取当前用户 ──
  console.log("\n── 3. 获取当前用户 ──");
  const r3 = await api("/api/auth/me", { headers: authH });
  assert("获取用户信息成功", r3.body.data?.username === TEST_USER, r3.body);
  const r3b = await api("/api/auth/me");
  assert("无 Token 返回 401", r3b.status === 401, r3b.body);

  // ── 4. 分类列表 ──
  console.log("\n── 4. 分类列表 ──");
  const r4 = await api("/api/categories");
  assert("获取分类成功", r4.body.data?.length >= 4, r4.body);

  // ── 5. 发布商品 ──
  console.log("\n── 5. 发布商品 ──");
  const r5 = await api("/api/goods", {
    method: "POST",
    headers: authH,
    body: JSON.stringify({ title: "API测试商品", description: "自动化测试用", price: 99.99, category_id: 1 }),
  });
  assert("发布商品成功", r5.status === 201 && r5.body.data?.title === "API测试商品", r5.body);
  const goodsId = r5.body.data?.id;

  const r5b = await api("/api/goods", { method: "POST", body: JSON.stringify({ title: "无权限", price: 10 }) });
  assert("未登录发布返回 401", r5b.status === 401, r5b.body);

  // ── 6. 商品列表 ──
  console.log("\n── 6. 商品列表 ──");
  const r6 = await api("/api/goods?status=approved");
  assert("商品列表返回数据", r6.body.data && r6.body.pagination, r6.body);

  // ── 7. 管理员审核 ──
  console.log("\n── 7. 管理员审核 ──");
  const r7a = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  const adminToken = r7a.body.data?.token;
  const adminAuth = { Authorization: "Bearer " + adminToken };
  assert("管理员登录成功", !!adminToken, r7a.body);

  const r7b = await api("/api/admin/goods?status=pending", { headers: adminAuth });
  assert("待审核列表", r7b.body.data?.length > 0, r7b.body);

  const r7d = await api("/api/admin/goods/" + goodsId, {
    method: "PATCH",
    headers: adminAuth,
    body: JSON.stringify({ status: "approved" }),
  });
  assert("审核通过", r7d.status === 200, r7d.body);

  // ── 8. 商品详情 ──
  console.log("\n── 8. 商品详情 ──");
  const r8 = await api("/api/goods/" + goodsId);
  assert("获取商品详情成功", r8.body.data?.id === goodsId, r8.body);

  // ── 9. 收藏 ──
  console.log("\n── 9. 收藏系统 ──");
  const r9a = await api("/api/favorites/" + goodsId, { method: "POST", headers: authH });
  assert("收藏商品成功", r9a.status === 201, r9a.body);
  const r9b = await api("/api/favorites", { headers: authH });
  assert("我的收藏列表", r9b.body.data?.length > 0, r9b.body);
  const r9c = await api("/api/favorites/" + goodsId, { method: "DELETE", headers: authH });
  assert("取消收藏成功", r9c.status === 200, r9c.body);

  // ── 10. 订单 ──
  console.log("\n── 10. 订单系统 ──");
  const r10 = await api("/api/orders", {
    method: "POST",
    headers: authH,
    body: JSON.stringify({ goodsId }),
  });
  assert("创建订单成功", r10.status === 201 && r10.body.data?.status === "pending_pay", r10.body);
  const orderId = r10.body.data?.id;

  const r10b = await api("/api/orders", { headers: authH });
  assert("我的订单列表", r10b.body.data?.length > 0, r10b.body);

  const r10c = await api("/api/orders/" + orderId, { headers: authH });
  assert("订单详情", r10c.body.data?.id === orderId, r10c.body);

  const r10d = await api("/api/orders/" + orderId, {
    method: "PATCH",
    headers: authH,
    body: JSON.stringify({ action: "pay" }),
  });
  assert("付款成功", r10d.status === 200 && r10d.body.data?.status === "paid", r10d.body);

  const r10e = await api("/api/orders/" + orderId, {
    method: "PATCH",
    headers: authH,
    body: JSON.stringify({ action: "complete" }),
  });
  assert("确认完成成功", r10e.status === 200 && r10e.body.data?.status === "completed", r10e.body);

  // ── 11. 管理员订单 ──
  console.log("\n── 11. 管理员订单 ──");
  const r11 = await api("/api/admin/orders", { headers: adminAuth });
  assert("管理员订单列表", r11.status === 200, r11.body);

  // ── 汇总 ──
  console.log("\n" + "=".repeat(40));
  console.log("📊 测试结果: " + passed + " 通过, " + failed + " 失败, 共 " + (passed + failed) + " 项");
  console.log("=".repeat(40) + "\n");
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((e) => { console.error("💥 异常:", e.message); process.exit(1); });
