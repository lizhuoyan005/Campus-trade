校园二手交易平台 - CampusTrade
================================

1) GitHub 仓库地址
   https://github.com/lizhuoyan005/Campus-trade
   若为私有仓库，请邀请 sunshinezxf@hotmail.com。

2) Docker 镜像下载 & 启动
   镜像包下载链接（约 175MB）：
   https://box.nju.edu.cn/seafhttp/f/2031e46176b14998adf2/?op=view

   加载镜像：
   docker load -i campus-trade-image.tar

   启动容器：
   docker run -d -p 3000:3000 campus-trade

   或通过 Docker Compose 从源码构建（需克隆 GitHub 仓库）：
   git clone https://github.com/lizhuoyan005/Campus-trade.git
   cd Campus-trade
   docker compose up --build -d

   # 方法二：Docker 直接启动
   docker build -t campus-trade .
   docker run -d -p 3000:3000 -v app-data:/app/data campus-trade

   启动后访问 http://localhost:3000

3) 数据库和资源文件挂载说明
   数据库：SQLite (via better-sqlite3)，文件自动生成在 /app/data/dev.db
   挂载方式：Docker Compose 中通过 named volume 持久化
     volumes:
       - app-data:/app/data
   如需本地访问，可将 volume 挂载到宿主机目录：
     - ./data:/app/data
   数据库初始化：首次启动时自动建表并插入种子数据（3个测试用户、6个分类、6件商品）
   如需重置数据库：删除宿主机 data 目录下的 dev.db* 文件后重启容器

   资源文件：
   - 数据库 Schema: src/lib/schema.sql
   - 种子数据：src/lib/db.ts (seedDb 函数)
   - 接口契约：contracts/openapi.yaml
   - 测试脚本：tests/api-test.js, tests/concurrency-test.js

4) Web 服务公网访问地址
   无。当前仅支持本地部署访问 (http://localhost:3000)。

5) 课程中印象最深刻的内容（可选）
   并发控制防超卖的实现。通过乐观锁 + 部分唯一索引 + 状态机校验三层防护，
   100个并发请求仅1个下单成功、0超卖，让我对数据库事务和竞态条件有了实际的理解。

6) 课程改进建议（可选）
   -
================================
演示账号
  管理员：admin / admin123
  普通用户：zhangsan / 123456
  普通用户：lisi / 123456
================================
AI 助手演示
  访问 http://localhost:3000/agent 进入 AI 助手页面
  支持自然语言搜索商品、查看详情、发布商品
