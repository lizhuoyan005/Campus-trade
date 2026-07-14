// ===================================================
// 并发压测脚本 - 模拟 100 个请求同时抢购同一件商品
// 验证乐观锁 + 唯一索引双重防超卖
// 运行: node tests/concurrency-test.js
// ===================================================

const BASE = "http://localhost:3000";

async function api(path, opts = {}) {
  const res = await fetch(BASE + path, {
    headers: { "Content-Type": "application/json", ...opts.headers },
    ...opts,
  });
  return { status: res.status, body: await res.json() };
}

function randomStr() { return Math.random().toString(36).substring(2, 8); }

async function main() {
  console.log("\n🔥 并发压测：100 个请求同时抢购 1 件库存商品\n");

  // 1. 管理员登录
  const login = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  const adminToken = login.body.data?.token;
  const adminAuth = { Authorization: `Bearer ${adminToken}` };
  console.log("  ✅ 管理员已登录");

  // 2. 管理员发布一个测试商品
  const goodsName = `压测商品-${randomStr()}`;
  const create = await api("/api/goods", {
    method: "POST",
    headers: adminAuth,
    body: JSON.stringify({ title: goodsName, description: "并发测试专用", price: 1.00, category_id: 1 }),
  });
  const goodsId = create.body.data?.id;
  console.log(`  ✅ 测试商品已发布 (ID=${goodsId})，库存=1`);

  // 3. 管理员审核通过
  await api(`/api/admin/goods/${goodsId}`, {
    method: "PATCH",
    headers: adminAuth,
    body: JSON.stringify({ status: "approved" }),
  });
  console.log("  ✅ 商品已审核通过");

  // 4. 注册 10 个压测用户
  const users = [];
  for (let i = 0; i < 10; i++) {
    const uname = `conc${i}_${randomStr()}`;
    const reg = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ username: uname, password: "test123", nickname: `并发用户${i}` }),
    });
    if (reg.body.data?.token) users.push(reg.body.data.token);
  }
  console.log(`  ✅ ${users.length} 个压测用户已注册`);

  // 5. 发起 100 个并发购买请求（每个用户 10 次）
  console.log("\n  ⏳ 发起 100 个并发购买请求...\n");

  const results = { success: 0, conflict: 0, duplicate: 0, error: 0, others: 0 };
  const startTime = Date.now();

  const promises = [];
  for (let i = 0; i < 100; i++) {
    const token = users[i % users.length];
    promises.push(
      api("/api/orders", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ goodsId }),
      }).then((r) => {
        if (r.status === 201) results.success++;
        else if (r.status === 409 && r.body.code === 40901) results.conflict++;
        else if (r.status === 409 && r.body.code === 40902) results.duplicate++;
        else if (r.status >= 500) results.error++;
        else results.others++;
        return r;
      })
    );
  }

  const responses = await Promise.all(promises);
  const elapsed = Date.now() - startTime;

  // 6. 结果分析
  console.log("  📊 并发测试结果:\n");
  console.log(`     请求总数:     100`);
  console.log(`     执行耗时:     ${elapsed}ms`);
  console.log(`     ✅ 下单成功:  ${results.success} 次`);
  console.log(`     ⚡ 乐观锁拦截: ${results.conflict} 次（库存不足）`);
  console.log(`     🔒 唯一索引拦截: ${results.duplicate} 次（重复下单）`);
  console.log(`     ❌ 服务器错误: ${results.error} 次`);
  if (results.others > 0) console.log(`     ❓ 其他:       ${results.others} 次`);

  // 7. 验证最终状态
  console.log(`\n  -- 最终状态验证 --`);

  // 查商品
  const goodsCheck = await api(`/api/goods/${goodsId}`);
  const finalStock = goodsCheck.body.data?.stock;
  const finalStatus = goodsCheck.body.data?.status;
  console.log(`     商品库存:     ${finalStock}`);
  console.log(`     商品状态:     ${finalStatus}`);

  // 查订单（管理员查所有订单）
  const ordersCheck = await api("/api/admin/orders", { headers: adminAuth });
  const pendingOrders = ordersCheck.body.data?.filter((o) => o.goods_title === goodsName) || [];
  console.log(`     相关订单数:   ${pendingOrders.length}`);
  console.log(`     pending_pay:  ${pendingOrders.filter((o) => o.status === "pending_pay").length}`);

  // 结论
  console.log(`\n  ${"=".repeat(40)}`);
  const passed = results.success === 1 && finalStock === 0;
  if (passed) {
    console.log("  ✅ 并发测试通过！防超卖机制正常运作");
    console.log("     只有 1 个用户成功下单，库存已归零。");
  } else {
    console.log("  ❌ 并发测试失败！");
    if (results.success > 1) console.log("     错误：多个用户同时下单成功（超卖）");
    if (finalStock < 0) console.log(`     错误：库存为负数 (${finalStock})`);
  }
  console.log(`  ${"=".repeat(40)}\n`);
  process.exit(passed ? 0 : 1);
}

main().catch((e) => {
  console.error("💥 测试执行异常:", e.message);
  process.exit(1);
});
