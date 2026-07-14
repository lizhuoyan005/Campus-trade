# WorkBuddy 接入配置指南 + 录屏脚本

> 项目：CampusTrade 校园二手交易平台
> 用途：通过 WorkBuddy 自定义 Skill 调用平台 API

---

## 一、接入概述

WorkBuddy 是一款 AI 助手平台，支持通过**自定义 Skill** 接入外部 RESTful API。接入后，用户可以用自然语言与平台交互，例如"帮我搜索 200 元以下的教材"。

### 需要暴露的接口

根据课程要求，至少暴露以下 3 个接口：

| 接口 | 方法 | 用途 |
|------|------|------|
| 搜索商品 | GET /api/v1/goods | 按关键词/分类/价格搜索 |
| 商品详情 | GET /api/v1/goods/{id} | 查看商品完整信息 |
| 发布商品 | POST /api/v1/goods | 发布新商品 |

> 当前部署地址：http://localhost:3000（本地开发） 或 Docker 部署地址

---

## 二、配置步骤

### 2.1 准备工作

1. **确保后端已启动**（Docker 或本地 dev server）
2. **获取一个固定 API Token**：使用管理员账号登录后获取 Token

获取 Token 的方法：

```bash
# 通过 curl 获取 admin 的 Token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 响应示例
{"code":0,"message":"success","data":{"token":"eyJhbGciOiJIUzI1NiIs...","user":{...}}}

# 保存返回的 token 值，后续配置要用
```

也可以在浏览器中打开 http://localhost:3000/login，用 `admin / admin123` 登录，然后从浏览器开发者工具的 LocalStorage 中复制 `campus_trade_token` 的值。

### 2.2 创建自定义 Skill

以下步骤在 WorkBuddy 后台操作（具体界面以实际版本为准）：

1. 登录 WorkBuddy 后台
2. 进入 **Skills** → **自定义 Skill**
3. 点击 **创建 Skill**
4. 填写基本信息：
   - **名称**：校园二手交易平台
   - **描述**：查询和发布校园二手商品
   - **版本**：1.0.0

### 2.3 配置 API 端点

创建 3 个 API 端点：

#### 端点 1：搜索商品

| 字段 | 值 |
|------|------|
| 方法 | GET |
| 路径 | /api/v1/goods |
| 描述 | 搜索商品列表 |

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| keyword | query | string | 否 | 关键词（匹配标题和描述） |
| categoryId | query | integer | 否 | 分类 ID（1=教材教辅，2=电子产品，3=生活用品，4=运动户外，5=服饰箱包，6=其他） |
| maxPrice | query | number | 否 | 最高价格 |
| minPrice | query | number | 否 | 最低价格 |
| page | query | integer | 否 | 页码（默认 1） |
| pageSize | query | integer | 否 | 每页条数（默认 12） |

#### 端点 2：商品详情

| 字段 | 值 |
|------|------|
| 方法 | GET |
| 路径 | /api/v1/goods/{id} |
| 描述 | 获取商品详细信息 |

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| id | path | integer | 是 | 商品 ID |

#### 端点 3：发布商品

| 字段 | 值 |
|------|------|
| 方法 | POST |
| 路径 | /api/v1/goods |
| 描述 | 发布新商品 |
| 认证 | Bearer Token |

| 参数名 | 位置 | 类型 | 必填 | 说明 |
|--------|------|------|------|------|
| title | body | string | 是 | 商品标题（1-100 字符） |
| description | body | string | 否 | 商品描述 |
| price | body | number | 是 | 价格（>0） |
| category_id | body | integer | 否 | 分类 ID（默认 6） |
| contact | body | string | 否 | 联系方式 |

### 2.4 配置认证

对于需要登录的接口（发布商品），WorkBuddy 需要在 Header 中传递认证信息：

| 配置项 | 值 |
|--------|------|
| Header 名称 | Authorization |
| Header 值 | Bearer {从步骤 2.1 获取的 Token} |

> 注意：Token 有效期为 7 天，过期后需要重新获取并更新 WorkBuddy 配置。

### 2.5 编写触发规则

配置自然语言触发规则，让 WorkBuddy 能理解用户的意图并调用对应的 API：

```yaml
rules:
  - triggers:
      - "搜索{keyword}"
      - "查找{keyword}"
      - "{keyword}的商品"
      - "{maxPrice}元以下的{category}"
    action:
      endpoint: 搜索商品
      params:
        keyword: "{keyword}"
        categoryId: "{category_id}"
        maxPrice: "{maxPrice}"

  - triggers:
      - "查看{title}的详情"
      - "看看{title}"
    action:
      endpoint: 商品详情
      params:
        id: "{id}"

  - triggers:
      - "发布{title}"
      - "我要卖{title}"
      - "上架{title}"
    action:
      endpoint: 发布商品
      auth: required
      body:
        title: "{title}"
        price: "{price}"
        description: "{description}"
```

---

## 三、录屏演示脚本

按照以下步骤录制演示视频（建议使用 OBS Studio 或系统自带录屏工具）：

### 准备工作

1. 关闭其他不必要的窗口，保持桌面整洁
2. 打开浏览器并登录 WorkBuddy
3. 在另一个标签页打开 http://localhost:3000（验证后端正常运行）
4. 确保录屏工具已就绪

### 场景 1：搜索商品（约 30 秒）

| 步骤 | 操作 | 画面内容 | 解说词 |
|------|------|----------|--------|
| 1 | 打开 WorkBuddy 对话界面 | WorkBuddy 聊天窗口 | "我现在用 WorkBuddy 来查询二手商品" |
| 2 | 输入：`帮我搜索200元以下的二手教材` | 输入框 + 发送按钮 | "我想看看 200 元以下有什么教材在卖" |
| 3 | 等待 WorkBuddy 响应 | 调用 API 的过程提示 | "WorkBuddy 正在调用平台的搜索接口" |
| 4 | 展示返回结果 | 商品列表（教材类，<200 元） | "看，WorkBuddy 返回了符合条件的商品列表，包括高等数学和 C 语言教材" |

### 场景 2：发布商品（约 40 秒）

| 步骤 | 操作 | 画面内容 | 解说词 |
|------|------|----------|--------|
| 1 | 在 WorkBuddy 输入：`我要发布一本《计算机网络》，50元` | 输入框 | "接下来我试试发布一个新商品" |
| 2 | 等待 WorkBuddy 调用 API | 显示调用 POST /api/v1/goods | "WorkBuddy 调用发布接口，在后台创建了商品" |
| 3 | 展示返回结果 | "发布成功，等待管理员审核" | "商品已成功发布，现在处于待审核状态" |
| 4 | 切换回平台页面 | 刷新平台首页 | "刷新一下平台页面，可以看到这条商品" |

### 场景 3：查看详情（约 20 秒）

| 步骤 | 操作 | 画面内容 | 解说词 |
|------|------|----------|--------|
| 1 | 输入：`查看刚才发布的《计算机网络》` | 输入框 | "我让 WorkBuddy 查看刚才发布的商品详情" |
| 2 | 展示结果 | 商品详情信息 | "WorkBuddy 返回了商品的完整信息，包括价格、描述和联系方式" |

### 录屏注意事项

- 分辨率建议：1920x1080
- 帧率：30fps
- 格式：MP4
- 录制过程中保持鼠标移动流畅，避免抖动
- 如果某个步骤出错，可以在剪辑时剪掉重试部分
- 总时长建议控制在 2 分钟以内

---

## 四、常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| WorkBuddy 返回"接口调用失败" | Token 过期或后端未启动 | 确认后端正在运行，重新获取 Token |
| 搜索无结果 | 关键词不匹配或分类错误 | 尝试输入简短的搜索词，如"教材" |
| 发布失败 | 未配置认证 Header | 确认在 WorkBuddy Skill 中已填入有效的 Bearer Token |
| 返回 404 | 接口路径配置错误 | 检查路径中的 /api/v1 前缀是否正确 |
| 返回 409 | 并发冲突或重复操作 | 检查是否已经对同一商品下过单 |

---

## 五、附录：平台 OpenAPI 文档

完整的接口定义详见 [contracts/openapi.yaml](/contracts/openapi.yaml)。

---

*本文档由 AI 输出配置指导，需人工操作录屏。*
