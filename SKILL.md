---
name: nightschool-video
description: 夜校短视频自动化产出 — 基于 Remotion 的竖屏短视频生成全流程指南
---

# 夜校短视频自动化产出 Skill

基于 Remotion 框架，自动化生成"杭州新青年夜校"品牌推广竖屏短视频。

## 前置条件

- **必须已安装 `remotion-best-practices` Skill**（提供 Remotion 通用 API 知识）
- Node.js >= 18
- FFmpeg >= 4.0（用于音频转换和截帧验收）

## 何时使用此 Skill

当用户需要：
- 生成夜校课程推广短视频
- 修改视频文案、品牌信息、配音或B-roll素材
- 调整视频版式或添加新的视觉元素
- 批量产出不同配音/素材组合的视频

## 一、快速开始（从零到成片 5 分钟）

### 1. 初始化 Remotion 项目

```bash
# 创建项目
npx -y create-video@latest ./remotion-video --template blank
cd remotion-video

# 安装依赖
npm install @remotion/media @remotion/transitions @remotion/captions \
  @remotion/install-whisper-cpp opencc-js
```

### 2. 复制参考实现

将本 Skill 的 `reference/` 目录下的文件作为参考，创建以下项目结构：

```
remotion-video/
├── src/
│   ├── Root.tsx                          # Composition 入口
│   ├── NightSchoolVideo.tsx              # 主编排组件
│   ├── JianyingLayout.tsx                # 版式组件（标题/标签/水印/跑马字幕）
│   ├── CaptionPage.tsx                   # 逐字高亮字幕
│   └── presets/
│       └── nightSchool59Baseline.ts      # 配置中心（品牌/文案/版式参数）
├── scripts/
│   └── transcribe.mjs                    # Whisper 字幕转录
├── public/
│   ├── voiceover.mp3                     # 配音文件
│   ├── captions.json                     # 字幕数据
│   ├── clip-makeup.mp4                   # B-roll 素材
│   ├── clip-guitar.mp4
│   ├── clip-jazz.mp4
│   └── XinQingNian.ttf                   # 新青年体字体
└── package.json
```

### 3. 准备素材

```bash
# 复制配音
cp /path/to/voiceover.mp3 public/voiceover.mp3

# 转 WAV 用于 Whisper 转录
ffmpeg -i public/voiceover.mp3 -ar 16000 -ac 1 public/voiceover.wav -y

# 转录字幕
node scripts/transcribe.mjs public/voiceover.wav public/captions.json

# 复制 B-roll 素材
cp /path/to/clip1.mp4 public/clip-makeup.mp4
cp /path/to/clip2.mp4 public/clip-guitar.mp4
cp /path/to/clip3.mp4 public/clip-jazz.mp4

# 复制字体
cp /path/to/XinQingNian.ttf public/
```

### 4. 渲染

```bash
npx remotion render NightSchoolVideo59Strict --output out/nightschool.mp4
```

---

## 二、配置中心（唯一真源）

所有品牌信息和文案集中在 `src/presets/nightSchool59Baseline.ts` 中。**修改文案只需编辑此文件**：

```typescript
brand: {
    name: "杭州新青年夜校",               // 品牌水印 @杭州新青年夜校
    publicAccountLabel: "公🀄️号：千万间新青年",  // 抖音谐音规避审核
}

text.defaults: {
    title1: "白天上班 晚上学艺",           // 黄底色块，顶部居中
    title2: "杭州新青年夜校100+课程火热开放",  // 深红棕+白描边
    title3: "同学：性价比超高，比外面便宜一半！",  // 浅橙+暗红描边
    title4: "公🀄️号：千万间新青年",          // 白字+黑描边
    studentLabel: "夜校学员:",               // 左下角黑字+白描边
    courseList: "热门课程：美妆，吉他，爵士舞，……",  // 底部金黄跑马字幕
}

compositions: {
    voiceoverDurationSec: 11.42,  // ← 换配音时必须更新此值
}
```

---

## 三、视频组成结构（5 层叠加）

```
┌──────────────────────────────────┐
│  @杭州新青年夜校              (水印)│  右上角，白色 60% 透明
│                                  │
│     ┌──────────────┐             │  层3: JianyingHeader
│     │ 标题1 黄底色块 │             │  ← 宽度跟随文字
│     └──────────────┘             │
│    标题2 深红棕+白描边           │
│    标题3 浅橙+暗红描边           │
│    标题4 公🀄️号（白字）          │
│  📌 课程标签（32px）             │  层4: CourseTag（随片段切换）
│                                  │
│        (层1: B-roll 视频轨)      │  TransitionSeries + fade 转场
│        (层2: 配音音轨)           │
│                                  │
│  夜校学员:              (左下)   │  层4: StudentLabel
│    配音字幕（逐字高亮）   (居中)  │  层5: CaptionPage
│                                  │
│  热门课程：美妆，吉他...  (底部)  │  层4: CourseList（金黄跑马字幕）
└──────────────────────────────────┘
          1080 × 1920 @ 30fps
```

### 颜色系统

| 名称 | HEX | 用途 |
|------|-----|------|
| 金黄 | #ffde00 | 标题1背景、跑马字幕文字、字幕高亮 |
| 浅橙肉色 | #ffd9c6 | 标题3 文字 |
| 深红棕 | #ab4a37 | 标题2 文字 |
| 暗红 | #a74f59 | 标题3 描边 |
| 白 | #ffffff | 字幕、标题4、描边 |
| 黑 | #000000 | 标题1文字、学员标注、描边 |

### 字体

- **新青年体**（`XinQingNian.ttf`）：标题1-4、学员标注、课程标签、品牌水印
- **系统中文**：配音字幕、跑马字幕

---

## 四、版式布局参数（已冻结）

所有坐标基于剪映坐标系，换算规则：
- X: `px = 540 + x × 540`（-1=左, 0=中, 1=右）
- Y: `px = 960 - y × 960`（-1=底, 0=中, 1=顶）

| 元素 | 剪映坐标 (x, y) | 像素位置 | scale | fontSize |
|------|----------------|---------|-------|----------|
| 标题1 | (0, 0.812) | top=180, 居中 | 1.0 | 16 |
| 标题2 | (0, 0.651) | top=335, 居中 | 1.168 | 11 |
| 标题3 | (0, 0.538) | top=443, 居中 | 0.922 | 14 |
| 标题4 | (0, 0.408) | top=568, 居中 | 0.851 | 12 |
| 字幕 | (0, -0.435) | top=1378, 居中 | 1.0 | 9 |
| 学员标注 | (-0.703, -0.339) | left=160, top=1286 | 0.851 | 12 |
| 跑马字幕 | (0, -0.694) | top=1627, 居中 | 0.728 | 14 |
| 课程标签 | left=20, top=640 | — | — | 32px |
| 品牌水印 | right=16, top=130 | — | — | 16px |

### 标题1 特殊样式

- 黄底色块宽度**跟随文字长度**（`display: inline`）
- padding: `10px 24px`，borderRadius: `6px`
- 居中显示（外层 `display: flex; justifyContent: center`）

---

## 五、素材编排规则

### 核心约束

| 参数 | 值 | 说明 |
|------|---|------|
| 即梦素材物理时长 | **5.06s** | 所有即梦 AI 生成的 B-roll 素材固定时长 |
| 转场时长 | **0.8s** | fade 过渡期间两段素材重叠播放 |
| 安全余量 | **0.2s** | 避免素材末尾黑帧，实际可用 ≈ 4.86s |
| 总视频时长 | = 配音时长 | 视频时长完全由配音决定 |

### 自适应段数公式

```
可用单段时长 = 5.06 - 0.2 = 4.86s

需要的最少段数: n = ceil((T + 0.8) / 4.86)
  其中 T = 配音时长（秒）

每段展示时长: clip_sec = (T + (n-1) × 0.8) / n
```

**速查表**：

| 配音时长 T | 段数 n | 每段展示时长 | 策略 |
|-----------|-------|------------|------|
| 6-7s | 2 | 3.4-3.9s | 自然裁剪 |
| 8-13s | 3 | 3.2-4.9s | 自然裁剪 |
| 14-17s | 4 | 4.1-4.85s | 自然裁剪 |
| 18-21s | 5 | 4.2-4.84s | 自然裁剪 |
| >22s | 6+ | 计算 | 可能需减速 |

### Remotion Video 素材操控能力

#### 1. 裁剪（最常用）

```tsx
<Video src={staticFile("clip.mp4")} trimBefore={0.5 * fps} trimAfter={4 * fps} muted />
```

- 素材 5.06s > 需要的 3-4s → 只播放部分
- `trimBefore`/`trimAfter` 单位是**帧**

#### 2. 加速/减速

```tsx
<Video src={staticFile("clip.mp4")} playbackRate={1.2} muted />
```

- 安全范围: `0.8 ≤ playbackRate ≤ 1.3`
- 用于微调 0.5-1s 的时长差

#### 3. 循环（兜底）

```tsx
<Video src={staticFile("clip.mp4")} loop muted />
```

- 优先级最低，应先增加素材段数

### 编排决策树

```
1. 计算段数: n = ceil((T + 0.8) / 4.86)
2. 素材不够 → loop 或 playbackRate=0.85 补足
3. 选 n 段素材，课程类型不重复

4. clip_sec = (T + (n-1) × 0.8) / n

5. 播放策略:
   ├─ clip_sec < 4.86s → 自然裁剪（最常见）
   ├─ clip_sec ≈ 4.86-5.06s → 刚好
   ├─ clip_sec > 5.06s → playbackRate = 5.06 / clip_sec
   └─ playbackRate < 0.8 → 增加段数或 loop
```

### 课程标签与素材匹配

CLIPS 和 CLIP_LABELS **一一对应**，标签跟随当前 B-roll 切换：

```tsx
const CLIPS = ["clip-makeup.mp4", "clip-guitar.mp4", "clip-jazz.mp4"];
const CLIP_LABELS = ["美妆课", "吉他课", "爵士舞课"];
```

即梦素材文件名包含课程关键词，可自动匹配标签。

---

## 六、字幕处理流程

### 转录

```bash
# 1. 音频转 WAV (Whisper 需要 16kHz mono)
ffmpeg -i public/voiceover.mp3 -ar 16000 -ac 1 public/voiceover.wav -y

# 2. Whisper.cpp 转录
node scripts/transcribe.mjs public/voiceover.wav public/captions.json
```

### 字幕格式 (captions.json)

```json
[
  { "text": "它", "startMs": 400, "endMs": 600, "confidence": 0.95 },
  { "text": "不", "startMs": 600, "endMs": 800, "confidence": 0.92 },
  ...
]
```

### 常见修复

Whisper 中文转录常见问题：
- **繁→简**: "學" → "学"（opencc-js 自动处理）
- **乱码**: U+FFFD 替换字符（脚本自动清理）
- **漏字**: "年轻人" 被识别为 "年人" → 手动补"轻"
- **错字**: "价格" 被识别为 "价" → 手动补"格"

**建议**: 转录后务必人工校对 captions.json，对照音频逐字核实。

### 字幕显示规则

- 分页：每 12 个字一页
- 高亮：当前播放到的字高亮为金黄色 #ffde00
- 位置：居中偏下 (top=1378)
- 字体：系统中文，白字+黑描边

---

## 七、验收清单

### 渲染前检查

```
□ nightSchool59Baseline.ts 文案和品牌信息完整
□ Root.tsx Composition 定义正确 (1080×1920, 30fps)
□ captions.json 非空，每个 token 有 startMs/endMs/text
□ voiceover.mp3 存在且时长 > 0
□ clip-*.mp4 至少 1 个存在
□ XinQingNian.ttf 字体存在
□ voiceoverDurationSec 与实际音频时长匹配
```

### 渲染后截帧验收

在 0s、50%、末尾截帧：

```bash
ffmpeg -i output.mp4 -ss 0.5 -frames:v 1 frame-0s.png -y
ffmpeg -i output.mp4 -ss 5.5 -frames:v 1 frame-mid.png -y
ffmpeg -i output.mp4 -ss 10.5 -frames:v 1 frame-end.png -y
```

逐项确认：

```
□ 标题1 黄底色块居中，宽度跟随文字
□ 标题2 深红棕可见
□ 标题3 浅橙可见
□ 标题4 "公🀄️号：千万间新青年" 可见
□ 品牌水印 @杭州新青年夜校 右上角
□ 📌 课程标签清晰可读，随片段切换
□ 配音字幕居中下半部，逐字高亮
□ 夜校学员标注左下方可见
□ 跑马字幕底部金黄色可见
□ B-roll 有画面 + fade 转场
□ 配音有声音
```

---

## 八、渲染命令速查

```bash
# 开发预览
cd remotion-video && npm run dev

# 渲染（推荐）
npx remotion render NightSchoolVideo59Strict --output out/nightschool.mp4

# 渲染 5.9 模板对照版
npx remotion render NightSchoolVideo59PixelRef --output out/nightschool-pixelref.mp4

# 重新转录字幕
ffmpeg -i public/voiceover.mp3 -ar 16000 -ac 1 public/voiceover.wav -y
node scripts/transcribe.mjs public/voiceover.wav public/captions.json
```

---

## 九、换配音 / 换素材流程

```bash
# 1. 复制新配音
cp /path/to/new-voiceover.mp3 public/voiceover.mp3

# 2. 获取配音时长
ffprobe -v quiet -show_entries format=duration -of csv=p=0 public/voiceover.mp3

# 3. 更新 baseline 中的 voiceoverDurationSec

# 4. 转录字幕
ffmpeg -i public/voiceover.mp3 -ar 16000 -ac 1 public/voiceover.wav -y
node scripts/transcribe.mjs public/voiceover.wav public/captions.json

# 5. 人工校对 captions.json

# 6. 根据配音时长计算需要的素材段数（参考第五节公式）
#    复制对应数量的素材到 public/

# 7. 更新 NightSchoolVideo.tsx 中的 CLIPS 和 CLIP_LABELS

# 8. 渲染
npx remotion render NightSchoolVideo59Strict --output out/nightschool.mp4

# 9. 截帧验收
```
