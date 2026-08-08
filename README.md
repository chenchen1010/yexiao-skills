# yexiao-skills

杭州新青年夜校短视频自动化产出与分发的 AI Skills 集合。从 [ai-skills-private](https://github.com/chenchen1010/ai-skills-private) 拆分而来（保留原有提交历史），专属于夜校视频制作链路。

## 📦 包含的 Skills

### 1. nightschool-video
基于 Remotion 的夜校短视频自动化产出全流程。**含全量生产素材（`assets/`，约 134M），clone 下来即可直接出片，无需外部素材路径**。

- 竖屏 1080×1920 短视频生成（配音 + B-roll + 标题 + 逐字字幕）
- 剪映版式精确复刻（标题、跑马字幕、课程标签、品牌水印）
- 自适应素材编排（随机选素材 + 随机裁剪，根据配音时长自动计算段数）
- 豆包 VC 字幕转录（默认）/ Whisper 转录 + 繁简转换 + 乱码修复

**素材清单**（`nightschool-video/assets/`）：
- `即梦生成素材/` — B-roll 视频池
- `夜校配音文件/` — 19 条配音 mp3
- `夜校视频模板/` — 各账号剪映成片示例
- `参考源/` — 剪映 5.9 草稿 JSON + 版式规范
- `提示词/` — 素材生成 / 编排提示词
- `font/XinQingNian.ttf` — 新青年体字体（渲染必需）

**前置依赖**：`remotion-best-practices`

### 2. remotion-best-practices
Remotion 通用最佳实践规则集（`rules/` 按主题拆分：音频、字幕、转场、动画等），是 `nightschool-video` 的前置依赖。

### 3. douyin-publish
抖音自动发布 — Stagehand + Playwright 自动化上传视频、填写描述/标题并发布到抖音创作者平台。

- 登录态持久化（`~/.douyin-publish/chrome-data/`，首次扫码后免登录）
- DOM 直接操作 + `stagehand.act()` AI 回退双保险
- 发布成功以 URL 跳转 `/content/manage` 为准

```bash
node douyin-publish/scripts/publish-dy.mjs --video=/path/to/video.mp4 --desc="#话题 描述" --title="标题"
```

### 4. wechat-channels-publish
微信视频号自动发布 — 上传视频、填写描述、声明原创并发表（处理 wujie 微前端 iframe 穿透）。

## 生产链路全景

```
① 素材准备（配音 + B-roll + 字体）
② 字幕生成（豆包 VC / Whisper 转录 + 校对）
③ Remotion 渲染（nightschool-video + remotion-best-practices）
④ 分发（douyin-publish / wechat-channels-publish）
```

## 在其他项目中引入

```bash
# 直接软链到本地 skills 目录
ln -s /path/to/yexiao-skills/nightschool-video ~/.claude/skills/nightschool-video
ln -s /path/to/yexiao-skills/remotion-best-practices ~/.claude/skills/remotion-best-practices
ln -s /path/to/yexiao-skills/douyin-publish ~/.claude/skills/douyin-publish
ln -s /path/to/yexiao-skills/wechat-channels-publish ~/.claude/skills/wechat-channels-publish
```

## 私有仓库说明

私有使用，包含账号运营相关脚本，请勿公开。
