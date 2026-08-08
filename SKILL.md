---
name: wechat-channels-publish
description: 微信视频号自动发布 — 使用 Stagehand + Playwright 自动化上传视频、填写描述、声明原创并发布到微信视频号
---

# 微信视频号自动发布 Skill

通过浏览器自动化（Stagehand + Playwright）实现视频号的全自动发布：上传视频、填写描述、可选声明原创、一键发表。

## 何时使用此 Skill

当用户需要：
- 将视频自动发布到微信视频号
- 批量发布多个视频到视频号
- 在自动化流水线中集成视频号发布步骤

## 一、前置条件

### 系统要求

- **Node.js** >= 18
- **npm** 包管理器

### 依赖包

```bash
npm install @browserbasehq/stagehand dotenv
```

> Stagehand 内置了 Playwright Chromium，无需额外安装浏览器。

### LLM API 配置

Stagehand 需要一个 LLM 接口用于 AI 辅助操作。在项目根目录 `.env` 中配置：

```env
# 方式一：Anthropic 官方（推荐）
ANTHROPIC_API_KEY=sk-ant-xxx

# 方式二：中转服务
ANTHROPIC_API_KEY=sk-xxx
ANTHROPIC_BASE_URL=https://your-proxy.com

# 方式三：OpenAI
OPENAI_API_KEY=sk-xxx

# 可选：指定模型（默认 anthropic/claude-haiku-4-5-20251001）
STAGEHAND_MODEL=anthropic/claude-haiku-4-5-20251001
```

---

## 二、交互流程（给 AI Agent 的指引）

当用户请求发布视频到视频号时，按以下步骤执行：

### Step 1：收集发布信息

向用户确认以下信息（只有视频文件是必填的）：

| 参数 | 是否必填 | 说明 |
|------|---------|------|
| **视频文件路径** | ✅ 必填 | 本地视频文件的绝对路径 |
| **视频描述** | 可选 | 发布时的文字描述，可包含话题标签如 `#话题` |
| **是否声明原创** | 可选 | 默认声明原创。如用户明确不需要则直接发表 |

**示例交互：**

```
用户：帮我把 /path/to/video.mp4 发布到视频号
AI：收到！我来帮你发布。请确认：
    - 视频文件：/path/to/video.mp4
    - 描述：需要填写什么描述？（如不需要可留空）
    - 是否声明原创：默认声明原创，是否需要修改？

用户：描述写 #杭州 #生活，声明原创
AI：好的，开始发布...
```

### Step 2：执行发布脚本

```bash
node <skill-scripts-dir>/publish-sph.mjs \
  --video=/path/to/video.mp4 \
  --desc="#话题1 #话题2 描述文字" \
  --original
```

**命令行参数：**

| 参数 | 说明 |
|------|------|
| `--video=<路径>` | 视频文件路径（必填） |
| `--desc=<描述>` | 视频描述文字（可选，默认空） |
| `--original` | 声明原创（可选，加此标志则声明原创） |
| `--no-original` | 不声明原创，直接发表 |

> 注意：首次运行需要用户在弹出的浏览器中扫码登录微信视频号后台。登录态会持久化保存，后续无需再次登录。

### Step 3：处理登录

当前脚本已升级为“自动扫码登录模式”：如果检测到未登录，会周期性保存二维码截图到 `~/.wechat-channels-publish/login-qrcodes/`，并自动轮询是否登录成功，无需人工回车继续。

当脚本输出类似：

```
📱 检测到未登录，进入自动扫码登录模式...
📷 登录二维码截图 #1：/Users/xxx/.wechat-channels-publish/login-qrcodes/wx-login-qr-时间戳.png
```

AI 应这样告知用户：

```
AI：视频号当前未登录。我已经生成了登录二维码截图。
    请直接打开截图并用微信扫码；扫码成功后脚本会自动检测并继续，无需再回复“已登录”。
```

如果 10 分钟内仍未登录成功，脚本会报登录超时，此时再人工介入排查。

### Step 4：确认发布结果

脚本完成后检查输出：
- `🎉 发布成功！` → 发布成功
- `⚠️` → 有异常，需要人工检查

---

## 三、登录态持久化机制

### 工作原理

- 使用 Playwright Chromium 的 **用户数据目录**（User Data Directory）持久化浏览器状态
- 数据存储在 `~/.wechat-channels-publish/chrome-data/` 目录（家目录下，跨项目共享）
- 包含 cookie、localStorage、sessionStorage 等全部浏览器状态
- 首次登录后，后续运行自动复用登录态，无需重复扫码

### 登录态失效

以下情况会导致登录态失效，需要重新扫码：
- 超过 30 天未使用
- 用户在其他设备上退出了视频号后台
- 手动删除了 `~/.wechat-channels-publish/chrome-data/` 目录
- 微信账号安全策略变更

### 多账号支持

如需支持多个视频号账号，可修改 `userDataDir` 路径：
```javascript
const userDataDir = resolve(homedir(), `.wechat-channels-publish/chrome-data-${accountName}`);
```

---

## 四、技术架构

### 核心难点：wujie 微前端

微信视频号后台使用 **wujie 微前端框架**，真实 DOM 内容放在 `iframe[name="content"]` 内部，而非主页面。**所有 DOM 操作必须穿通此 iframe**。

```javascript
// execInWujie：在 wujie iframe 中执行代码
async function execInWujie(page, fnBody, ...fnArgs) {
    return await page.evaluate(({ body, args }) => {
        const iframe = document.querySelector('iframe[name="content"]');
        const doc = iframe.contentDocument;
        const fn = new Function('doc', ...args.map((_, i) => `a${i}`), body);
        return fn(doc, ...args);
    }, { body: fnBody, args: fnArgs });
}
```

### 发布流程详解

```
Step 1: 初始化 Stagehand（Playwright Chromium + 持久化登录态）
Step 2: 打开发布页 → 如需登录则进入自动扫码模式（保存二维码截图 + 自动轮询登录结果）
Step 3: 上传视频 → 暴露隐藏的 input[type=file] 并 setInputFiles
Step 4: 填写描述 → 穿透 wujie iframe 操作 .input-editor
Step 5: 点击发表 → 触发弹窗
Step 6: 处理原创声明弹窗（如需要）
    ├─ 弹窗1: 选择"声明原创"（或"直接发表")
    ├─ 弹窗2: 勾选 ant-checkbox-wrapper 协议
    └─ 弹窗2: 等待按钮可用 → 确认
Step 7: 再次点击发表 → 等待页面跳转到列表页
```

### 关键技术点

| 问题 | 解决方案 |
|------|---------|
| wujie iframe DOM 访问 | `execInWujie()` 辅助函数穿透 iframe |
| input[type=file] 被隐藏 | `page.evaluate()` 修改 CSS 使其可见后 `setInputFiles` |
| Ant Design checkbox | 点击 `label.ant-checkbox-wrapper` 而非 `input`（Ant Design 事件绑在 wrapper 上） |
| 声明原创是两步流程 | 弹窗1选择原创 → 弹窗2勾选协议+确认 → **回到表单** → 需要再次点击发表 |
| 按钮禁用状态 | 检测 `disabled` 属性和 `.weui-desktop-btn_disabled` CSS 类 |
| 弹窗可见性检测 | 过滤 `offsetWidth === 0 && offsetHeight === 0` 的隐藏弹窗 |

---

## 五、完整脚本参考

发布脚本位于本 Skill 的 `scripts/publish-sph.mjs`。

使用前需要将 `scripts/stagehand-config.mjs` 复制到项目的 `scripts/` 目录，或者修改 import 路径。

### 项目结构

```
your-project/
├── .env                          # LLM API 配置
~/.wechat-channels-publish/
│   └── chrome-data/              # 浏览器登录态持久化目录（家目录下，自动创建）
└── scripts/
    ├── stagehand-config.mjs      # Stagehand 统一配置工具
    └── publish-sph.mjs           # 视频号发布脚本
```

### 快速开始

```bash
# 1. 安装依赖
npm install @browserbasehq/stagehand dotenv

# 2. 配置 .env（参考第一节）

# 3. 首次运行（需要扫码登录）
node scripts/publish-sph.mjs --video=/path/to/video.mp4 --desc="#话题" --original

# 4. 后续运行（自动复用登录态）
node scripts/publish-sph.mjs --video=/path/to/another.mp4 --original
```

---

## 六、常见问题

### Q: 脚本说"需要登录"但浏览器窗口没有出现？
A: 检查是否有其他 Playwright/Chromium 进程占用了 `chrome-data/sph-main/` 目录。可以 `killall Chromium` 后重试。

### Q: 声明原创后视频没有成功发布？
A: 声明原创弹窗流程只是在表单中勾选了原创选项，**之后还需要再次点击"发表"按钮**。脚本已包含此步骤（Step 7）。

### Q: 视频上传超时？
A: 大文件上传可能需要更长时间。脚本最多等待 5 分钟（60 × 5s 轮询）。如果网络较慢可调整等待时间。

### Q: 能修改视频号的位置吗？
A: 视频号的位置功能是 POI 地点搜索（具体商铺/场所），不支持城市级修改。脚本默认保持视频号的原有位置不变。

### Q: 多次运行会重复发布吗？
A: 是的，每次运行都会创建新的视频发布。脚本不会检查是否存在相同内容的视频。
