# 夜校素材库说明

当前素材库已经统一整理为：

```text
夜校视频自动产出/即梦生成素材/
├── material-library.json          # 素材索引 / useCount / lastUsedAt
├── legacy/                        # 历史即梦 5.06s 素材
│   ├── 滑雪/
│   ├── 声乐/
│   ├── 羽毛球/
│   └── ...
└── seedance2-generated/           # 新生成的 Seedance 课程素材
    ├── 滑雪/
    ├── 国画/
    ├── 化妆/
    └── ...
```

规则：
- 历史素材统一放 `legacy/<课程>/`
- 新生成素材统一放 `seedance2-generated/<课程>/`
- 所有素材使用情况记录在 `material-library.json`
- 每条素材记录：
  - `videoPath`
  - `coverPath`
  - `durationSec`
  - `useCount`
  - `lastUsedAt`
  - `source`

相关脚本：
- 批量主流程：`scripts/nightschool-course-batch.mjs`
- 素材库整理脚本：`scripts/organize-nightschool-material-library.mjs`
- 老 prepare-assets 脚本：已支持递归读取本目录下的子目录素材

当前默认降本策略：
- 新生成时长默认 `4s`
- 优先复用本地素材缓存
- 每门课默认缓存目标 `1` 条
