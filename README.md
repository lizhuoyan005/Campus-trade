# CampusTrade 校园二手交易平台

基于 **Next.js 16 + React 19 + TypeScript + TailwindCSS v4 + better-sqlite3** 构建的校园二手交易平台，完成 Web 开发课程大作业的完整闭环。

---

## 功能特性

| 模块 | 功能 | 说明 |
|------|------|------|
| 🔐 用户认证 | 注册 / 登录 / JWT 鉴权 | bcrypt 密码加密，角色区分（普通用户/管理员） |
| 📦 商品管理 | 发布 / 浏览 / 搜索 / 编辑 / 下架 | 分类筛选、关键词搜索、价格排序、分页 |
| 🛒 交易系统 | 下单 / 付款 / 取消 / 确认完成 | 乐观锁防超卖，事务保证数据一致性 |
| ⭐ 收藏系统 | 收藏 / 取消收藏 / 收藏列表 | 唯一约束防重复收藏 |
| ✅ 后台审核 | 商品审核 / 订单管理 | 管理员通过/驳回（含原因） |
| 🔄 四种 UI 状态 | Loading / Empty / Error / Success | Skeleton 骨架屏 + 空态插图 + 错误重试 |

## 技术栈

### 前端
- **框架**: Next.js 16 (App Router)
- **UI 库**: React 19
- **语言**: TypeScript (strict mode)
- **样式**: TailwindCSS v4

### 后端
- **运行时**: Next.js API Routes
- **数据库**: SQLite (via better-sqlite3)
- **认证**: JWT (jsonwebtoken) + bcrypt
- **校验**: Zod

### 部署
- **容器化**: Docker + docker-compose
- **数据库持久化**: Docker Volume

---

## 快速开始

### 前置要求

- Node.js 20+
- npm 10+

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（自动建表 + 种子数据）
npm run dev

# 3. 打开浏览器访问
open http://localhost:3000
```

### Docker 部署

```bash
# 构建并启动
docker compose up --build -d

# 查看状态
docker compose ps

# 查看日志
docker compose logs

# 停止
docker compose down

# 停止并删除数据卷
docker compose down -v
```

---

## 演示账号

| 角色 | 用户名 | 密码 | 说明 |
|------|--------|------|------|
| 普通用户 | `zhangsan` | `123456` | 已发布商品，可购买 |
| 普通用户 | `lisi` | `123456` | 已发布商品 |
| 管理员 | `admin` | `admin123` | 可审核商品、管理订单 |

---

## 项目结构

```
campus-trade/
├── src/
│   ├── app/
│   │   ├── api/               # API 路由（18 个端点）
│   │   │   ├── auth/          # 注册 / 登录 / 获取用户
│   │   │   ├── goods/         # 商品 CRUD
│   │   │   ├── orders/        # 订单 + 状态流转
│   │   │   ├── favorites/     # 收藏管理
│   │   │   └── admin/         # 后台审核 + 订单管理
│   │   ├── user/              # 用户页面
│   │   │   ├── favorites/     # 我的收藏
│   │   │   ├── orders/        # 我的订单
│   │   │   └── my-goods/      # 我的发布
│   │   ├── goods/             # 商品详情页（SSR）
│   │   ├── login/             # 登录页
│   │   ├── register/          # 注册页
│   │   └── page.tsx           # 首页（SSR + 搜索/分页）
│   ├── components/
│   │   ├── Header.tsx         # 导航栏（含用户菜单）
│   │   ├── GoodsCard.tsx      # 商品卡片
│   │   ├── GoodsListClient.tsx# 商品列表（搜索/筛选/分页）
│   │   ├── GoodsDetailClient.tsx# 商品详情（购买/收藏）
│   │   ├── Skeleton.tsx       # 骨架屏
│   │   └── EmptyState.tsx     # 空态组件
│   └── lib/
│       ├── db.ts              # 数据库连接 + 种子数据
│       ├── api.ts             # 前端 API 封装（JWT + 响应解析）
│       ├── auth.ts            # JWT 签发/验证 + bcrypt
│       ├── auth-context.tsx   # 认证状态 React Context
│       ├── api-utils.ts       # 统一响应格式 + 错误码
│       ├── validate.ts        # Zod 校验 schema
│       ├── schema.sql         # 数据库 DDL
│       └── init.ts            # 数据库初始化
├── contracts/
│   └── openapi.yaml           # OpenAPI 接口契约
├── Dockerfile                 # 多阶段 Docker 构建
├── docker-compose.yml         # Docker Compose 配置
└── README.md
```

---

## API 概览

所有 API 响应格式：

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

| 错误码 | 含义 |
|--------|------|
| 0 | 成功 |
| 40001 | 参数校验失败 |
| 40101 | 未登录 / Token 过期 |
| 40301 | 无权限 |
| 40401 | 资源不存在 |
| 40901 | 并发冲突（乐观锁重试失败） |
| 40902 | 重复操作 |
| 50001 | 服务器内部错误 |

完整接口定义见 [contracts/openapi.yaml](contracts/openapi.yaml)。

---

## 并发控制方案（防超卖）

采用**乐观锁 + 数据库约束**双重保障：

1. **乐观锁（应用层）**：通过 `version` 字段实现 CAS 更新
2. **部分唯一索引（兜底）**：同一买家对同一商品只能有一个待付款订单
3. **状态机校验**：订单状态严格按 `pending_pay → paid → completed / cancelled` 流转
4. **取消释放库存**：取消待付款订单时自动恢复库存

---

## 交付物清单

| 交付项 | 状态 | 说明 |
|--------|------|------|
| GitHub 仓库 | ⏳ | 待创建 |
| Spec 文档 | ⏳ | 待起草 |
| contracts/openapi.yaml | ✅ | 23 个接口定义 |
| 数据库 Schema | ✅ | schema.sql |
| 测试报告 | ⏳ | 待编写 |
| Dockerfile + Compose | ✅ | 一键启动 |
| README | ✅ | 本文档 |
| 并发问题报告 | ⏳ | 待起草 |
| WorkBuddy 接入 | ⏳ | 待配置 |

---

## 课程要求

- ✅ Next.js App Router (SSR + Client Component)
- ✅ TypeScript strict mode
- ✅ TailwindCSS
- ✅ 四种 UI 状态（Skeleton / Empty / Error / Success）
- ✅ 数据仅通过 API 获取
- ✅ JWT 鉴权
- ✅ 并发控制（防超卖）
- ✅ Docker 部署
- ✅ ESLint + TypeScript 零报错
