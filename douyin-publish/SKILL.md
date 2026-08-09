---
name: douyin-publish
description: 抖音自动发布 — 使用 Stagehand + Playwright 自动化上传视频、填写描述并发布到抖音创作者平台
slug: yexiao-douyin-publish
displayName: 抖音视频发布【星元科技·Firefly·出品】
version: 1.0.0
summary: 将本地视频上传到抖音创作者中心，填写标题和描述，并核验发布状态。
license: MIT
homepage: https://github.com/chenchen1010/yexiao-skills
agent_created: true
---

# 抖音自动发布 Skill

通过浏览器自动化（Stagehand + Playwright）实现抖音的全自动发布：上传视频、填写描述/标题、一键发表。

## 何时使用此 Skill

当用户需要：
- 将视频自动发布到抖音
- 批量发布多个视频到抖音
- 在自动化流水线中集成抖音发布步骤

## 一、前置条件

### 系统要求

- **Node.js** >= 18
- **npm** 包管理器

### 依赖包

```bash
npm install @browserbasehq/stagehand dotenv
```

### LLM API 配置

Stagehand 需要一个 LLM 接口。在项目根目录 `.env` 中配置：

```env
# 方式一：Anthropic（推荐）
ANTHROPIC_API_KEY=sk-ant-xxx

# 方式二：中转服务
ANTHROPIC_API_KEY=sk-xxx
ANTHROPIC_BASE_URL=https://your-proxy.com

# 方式三：OpenAI
OPENAI_API_KEY=sk-xxx

# 可选：指定模型
STAGEHAND_MODEL=anthropic/claude-haiku-4-5-20251001
```

---

## 二、交互流程（给 AI Agent 的指引）

当用户请求发布视频到抖音时，按以下步骤执行：

### Step 1：收集发布信息

向用户确认以下信息：

| 参数 | 是否必填 | 说明 |
|------|---------|------|
| **视频文件路径** | ✅ 必填 | 本地视频文件的绝对路径 |
| **视频描述** | 可选 | 发布时的文字描述，可包含话题标签如 `#话题` |
| **视频标题** | 可选 | 抖音支持短标题（概括视频主题） |

### Step 2：执行发布脚本

```bash
node <skill-scripts-dir>/publish-dy.mjs \
  --video=/path/to/video.mp4 \
  --desc="#话题1 #话题2 描述文字" \
  --title="视频标题"
```

**命令行参数：**

| 参数 | 说明 |
|------|------|
| `--video=<路径>` | 视频文件路径（必填） |
| `--desc=<描述>` | 视频描述文字（可选，默认空） |
| `--title=<标题>` | 视频标题（可选） |

### Step 3：处理登录

首次运行需要用户在弹出的浏览器中用抖音 App 扫码登录。登录态会持久化保存到 `~/.douyin-publish/chrome-data/`，后续无需再次登录。

如果脚本输出 `📱 需要登录`，通知用户：

```
AI：浏览器已打开抖音创作者中心登录页。
    请打开抖音 App，点击左上角扫一扫，扫描浏览器中的二维码登录。
    登录成功后告诉我，我继续操作。
```

### Step 4：确认发布结果

脚本完成后检查输出：
- `🎉 发布成功！` + 页面跳转到 `content/manage` → 发布成功
- `⚠️` → 有异常，需要人工检查

---

## 三、登录态持久化机制

### 工作原理

- 使用 Playwright Chromium 的 **用户数据目录** 持久化浏览器状态
- 数据存储在 `~/.douyin-publish/chrome-data/` 目录（家目录下，跨项目共享）
- 包含 cookie、localStorage 等全部浏览器状态
- 首次登录后，后续运行自动复用登录态

### 登录态失效

以下情况需要重新扫码：
- 超过一定时间未使用（抖音的登录态有效期通常较长）
- 手动删除了 `~/.douyin-publish/chrome-data/` 目录
- 在其他设备上退出了抖音

---

## 四、技术架构

### 与视频号的对比

| 特性 | 抖音 | 微信视频号 |
|------|------|----------|
| 微前端框架 | ❌ 无（直接操作主页面 DOM） | ✅ wujie（需穿透 iframe） |
| 上传方式 | `input[type="file"]` + `setInputFiles` | 同上 |
| 编辑器 | `contenteditable` div | `.input-editor` contenteditable |
| 发布按钮 | `button` 文字 "发布" | `button` 文字 "发表" |
| 原创声明 | 无弹窗流程 | 两步弹窗（选择原创→勾选协议→再次发表） |
| 发布成功标志 | URL 跳转到 `/content/manage` | URL 跳转到 `/post/list` |

### 发布流程

```
Step 1: 初始化 Stagehand（Playwright Chromium + 持久化登录态）
Step 2: 打开创作者发布页 → 如需登录则等待扫码
Step 3: 上传视频 → 暴露 input[type=file] 并 setInputFiles
Step 4: 填写描述/标题 → DOM 操作 + stagehand.act 回退
Step 5: 点击发布 → 等待页面跳转到 content/manage
```

---

## 五、常见问题

### Q: 抖音和视频号能同时发布吗？
A: 可以。两个平台使用独立的浏览器数据目录，互不影响。可以先发一个再发另一个。

### Q: 抖音支持声明原创吗？
A: 抖音的原创声明逻辑与视频号不同，发布时不会弹窗确认，而是在创作者后台设置中管理。当前脚本不处理原创声明。

### Q: 为什么描述没有正确填写？
A: 抖音的编辑器可能更新了 DOM 结构。脚本会先尝试 DOM 操作，失败后回退到 `stagehand.act()` AI 辅助操作。如果两种方式都失败，需要更新选择器。

### Q: 视频上传失败怎么办？
A: 脚本会提示在浏览器中手动上传。上传后按回车即可继续后续步骤。
