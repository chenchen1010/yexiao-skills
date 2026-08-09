# 新闻通知类 Remotion 参考实现

将 `src/NewsNoticeVideo.tsx`、`src/FirstFrameCover.tsx` 与
`src/presets/newsNoticeTemplate.ts` 复制到 Remotion
项目的对应目录，在 `Root.tsx` 中注册 `NightSchoolNewsNotice` Composition。

模板依赖：

- `public/NotoSansHans-Bold.otf`
- `public/news-notice-music.m4a`（可从 `assets/新闻通知类模板/` 的参考片抽取，或换成已授权音乐）
- `@remotion/media`

注册示例：

```tsx
<Composition
  id={NEWS_NOTICE_TEMPLATE.composition.id}
  component={NewsNoticeVideo}
  durationInFrames={Math.round(
    NEWS_NOTICE_TEMPLATE.composition.durationSec *
      NEWS_NOTICE_TEMPLATE.composition.fps,
  )}
  fps={NEWS_NOTICE_TEMPLATE.composition.fps}
  width={NEWS_NOTICE_TEMPLATE.composition.width}
  height={NEWS_NOTICE_TEMPLATE.composition.height}
  defaultProps={NEWS_NOTICE_TEMPLATE.defaults}
/>
```

该模板不复用课程混剪 B-roll，也不修改 5.9 像素冻结基线。

当前参考实现为 `v2-news-notice-pixel-baseline`，主基线来自第二支参考片。固定
坐标与字号统一位于 `NEWS_NOTICE_TEMPLATE.layout`，更换城市和文案时不要直接
修改组件内布局。

`NEWS_NOTICE_TEMPLATE.meta.coverFrame` 控制抖音默认首帧的取样位置。当前第 0 帧
冻结第 30 帧的完整信息画面，第 1 帧即恢复正常动画。
