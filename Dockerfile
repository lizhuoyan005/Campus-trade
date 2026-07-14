# ============================================================
# Dockerfile - 校园二手交易平台
# ============================================================

# ---- Stage 1: 构建（安装全部依赖 + 编译原生模块 + 构建 Next.js） ----
FROM node:20-slim AS builder
WORKDIR /app

# 安装编译工具（better-sqlite3 需要从源码编译）
RUN apt-get update -qq && \
    apt-get install -y -qq python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Stage 2: 生产运行 ----
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# 复制构建产物（node_modules 已包含编译好的 better-sqlite3）
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/src/lib/schema.sql ./src/lib/schema.sql

# 数据目录
VOLUME /app/data

EXPOSE 3000

CMD ["npm", "run", "start"]
