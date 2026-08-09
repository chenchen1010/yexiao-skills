export type NewsNoticeTemplateProps = {
    city: string;
    headline: string;
    showLocationPin: boolean;
    noticeLabel: string;
    announcement: string;
    highlightLines: readonly [string, string];
    valueBadge: string;
    courseTitle: string;
    courseLines: readonly string[];
    audienceTitle: string;
    audienceLines: readonly string[];
    coverageLines: readonly string[];
    cta: string;
    musicFile: string;
};

export const NEWS_NOTICE_TEMPLATE = {
    meta: {
        version: "v2-news-notice-pixel-baseline",
        referenceDurationSec: 7.383946,
        switchAtSec: 4.2,
        /** 标题、卖点、价格与课程清单均完整显示的信息密集帧 */
        coverFrame: 30,
    },
    composition: {
        id: "NightSchoolNewsNotice",
        fps: 30,
        width: 1080,
        height: 1920,
        durationSec: 7.383946,
    },
    layout: {
        headerTop: 276,
        headlineFontSize: 102,
        noticeFontSize: 56,
        announcementFontSize: 66,
        highlightTop: 602,
        highlightWidth: 732,
        highlightHeight: 244,
        highlightFontSize: 66,
        valueBadgeTop: 902,
        valueBadgeFontSize: 58,
        courseBodyTop: 1064,
        courseBodyFontSize: 56,
        audienceLabelTop: 906,
        audienceLabelFontSize: 60,
        audienceBodyTop: 1064,
        audienceBodyFontSize: 56,
        coverageTop: 1360,
        coverageFontSize: 56,
    },
    defaults: {
        city: "杭州",
        headline: "千万不要错过",
        showLocationPin: false,
        noticeLabel: "杭州夜校2026年发布",
        announcement: "大力开展人工智能课程培训",
        highlightLines: ["年龄不限  男女不限", "全行业覆盖  全领域赋能"],
        valueBadge: "500💰10节课 高性价比",
        courseTitle: "课程设置",
        courseLines: [
            "AI短视频/AI漫剧/短剧创作",
            "AI赋能小红书运营提效/智能体应用",
            "AI生图教学与图文自媒体入门课",
            "豆包全能实战手册/AI小龙虾应用",
            "AI同城短视频精准获客",
            "AI社媒出海/AI+独立站跨境",
            "……",
        ],
        audienceTitle: "适合人群",
        audienceLines: [
            "企业老板/应届大学生",
            "在职人员/OPC创业者/小微企业",
            "个体工商户/灵活就业人员/宝妈",
        ],
        coverageLines: [
            "覆盖上城区、西湖区、拱墅区、",
            "滨江区、余杭区、钱塘区、",
            "萧山区、临平区等",
            "临近地铁，就近安排",
        ],
        cta: "",
        musicFile: "news-notice-music.m4a",
    } satisfies NewsNoticeTemplateProps,
} as const;
