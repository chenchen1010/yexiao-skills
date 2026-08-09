/**
 * 5.9 像素基线 + 通用文案配置
 *
 * 冻结来源:
 * - 已接受成片: out/nightschool-ep1-v13-59strict-pixel.mp4
 * - 对照模板: 夜校视频自动产出/参考源/5.9模板字幕成品示例.mp4
 *
 * 说明:
 * - 版式布局参数（layout/typography/strictStyle）已冻结，不可修改。
 * - text.defaults 为当前通用文案，可根据营销方案灵活调整。
 * - text.strict59 为 5.9 模板原始文案，仅用于 PixelRef 对照。
 * - brand 为品牌信息，全局统一使用。
 */
export const NIGHT_SCHOOL_59_BASELINE = {
    meta: {
        version: "v13-59strict-pixel-frozen",
        acceptedRender: "out/nightschool-ep1-v13-59strict-pixel.mp4",
        templateRender: "夜校视频自动产出/参考源/5.9模板字幕成品示例.mp4",
        frozenOn: "2026-02-22",
    },

    // ===== 品牌信息 =====
    brand: {
        name: "杭州新青年夜校",
        watermarkPrefix: "@",
        publicAccount: "千万间新青年",
        /** 抖音等平台使用谐音规避审核 */
        publicAccountLabel: "公🀄️号：千万间新青年",
    },

    // ===== Composition 定义 =====
    compositions: {
        strictId: "NightSchoolVideo59Strict",
        pixelRefId: "NightSchoolVideo59PixelRef",
        legacyId: "NightSchoolVideo",
        fps: 30,
        strictCanvas: { width: 1080, height: 1920 },
        legacyCanvas: { width: 720, height: 1280 },
        voiceoverDurationSec: 11.42,
        templateRefDurationSec: 5.033333,
        /** 主标题、课程标签与首屏字幕均完整显示的信息密集帧 */
        coverFrame: 45,
    },

    // ===== 字体参数 =====
    typography: {
        defaultFontUnit: 3.75,
        strictFontUnit: 5.6,
        strokeRatio: 0.08,
    },

    // ===== 文案 =====
    text: {
        /** 当前通用文案（可根据营销方案调整） */
        defaults: {
            title1: "白天上班 晚上学艺",
            title2: "杭州新青年夜校100+课程火热开放",
            title3: "同学：性价比超高，比外面便宜一半！",
            title4: "公🀄️号：千万间新青年",
            studentLabel: "夜校学员:",
            courseList:
                "热门课程：美妆，吉他，爵士舞，游泳，架子鼓，绘画，书法，\n声乐，钢琴，普拉提，视频剪辑，摄影，拳击，古筝……",
        },
        /** 5.9 模板原始文案（仅用于 PixelRef 对照，已冻结） */
        strict59: {
            title1: "杭州为年轻人开的养老院",
            title2: "在线向18岁到48岁的朋友征集",
            title3: "同学：一期才500，每天晚上都快乐",
            title4: "标题4",
            studentLabel: "夜校学员",
            subtitlePlaceholder: "字幕",
            courseList:
                "热门课程： 游泳，吉他，架子鼓，爵士舞，绘画，书法，美妆，声乐，钢琴，普拉提，视频剪辑，摄影，拳击，古筝……",
        },
    },

    // ===== 版式布局（已冻结，不可修改） =====
    layout: {
        title1: {
            x: 0,
            y: 0.812211278054658,
            scale: 1.0,
            fontSize: 16,
        },
        title2: {
            x: 0,
            y: 0.651198671407377,
            scale: 1.168357061254563,
            fontSize: 11,
        },
        title3: {
            x: 0,
            y: 0.53821202396648,
            scale: 0.922139331848762,
            fontSize: 14,
        },
        title4: {
            x: 0,
            y: 0.408306340933985,
            scale: 0.850701983993831,
            fontSize: 12,
        },
        subtitle: {
            x: 0,
            y: -0.4353895713278473,
            scale: 1.0,
            fontSize: 9,
        },
        studentLabel: {
            x: -0.7033951561019489,
            y: -0.3394663165160918,
            scale: 0.850701983993831,
            fontSize: 12,
        },
        courseList: {
            x: 0,
            y: -0.694387112511343,
            scale: 0.728373885980559,
            fontSize: 14,
            strictTextWidthPct: 82,
        },
        courseTag: {
            left1080: 20,
            top1080: 640,
            fontSize1080: 32,
        },
        brandWatermark: {
            right1080: 16,
            top1080: 130,
            fontSize1080: 16,
        },
    },

    // ===== strict59 样式微调 =====
    strictStyle: {
        lineHeight: 1,
        letterSpacing: 0,
    },
} as const;
