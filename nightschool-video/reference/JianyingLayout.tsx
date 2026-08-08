/**
 * 🎨 剪映版式精确复刻 — 归一化坐标 + 百分比定位（分辨率无关）
 *
 * 坐标系（从 5.9 草稿 JSON 验证）:
 *   剪映使用归一化坐标，坐标指向元素**中心点**
 *   - 画面中心 = (0, 0)
 *   - x ∈ [-1, 1]：-1=左边缘, 0=中心, 1=右边缘
 *   - y ∈ [-1, 1]：-1=底部, 0=中心, 1=顶部
 *
 * 转换公式（百分比，分辨率无关）:
 *   CSS left = (1 + x) / 2 × 100%
 *   CSS top  = (1 - y) / 2 × 100%
 *   配合 transform: translate(-50%, -50%) 实现中心定位
 *
 * 字号缩放:
 *   基准: 剪映 size × 3.75 = px（在 1080 宽度下）
 *   实际: size × 3.75 × (canvasWidth / 1080)
 */
import React from "react";
import {
    AbsoluteFill,
    interpolate,
    useCurrentFrame,
    useVideoConfig,
    staticFile,
} from "remotion";
import { NIGHT_SCHOOL_59_BASELINE } from "./presets/nightSchool59Baseline";

// ===== 剪映色彩系统 =====
const GOLDEN = "#ffde00";
const DEEP_RED_BROWN = "#ab4a37";
const LIGHT_PEACH = "#ffd9c6";
const DARK_RED = "#a74f59";
const WHITE = "#ffffff";
const BLACK = "#000000";
const STRICT_59_FONT_UNIT = NIGHT_SCHOOL_59_BASELINE.typography.strictFontUnit;
const DEFAULT_FONT_UNIT =
    NIGHT_SCHOOL_59_BASELINE.typography.defaultFontUnit;
const STROKE_RATIO = NIGHT_SCHOOL_59_BASELINE.typography.strokeRatio;
const LAYOUT = NIGHT_SCHOOL_59_BASELINE.layout;
const STRICT_STYLE = NIGHT_SCHOOL_59_BASELINE.strictStyle;

// ===== 坐标转换工具（分辨率无关） =====

/** 剪映 Y → CSS top 百分比 */
function jyTopPct(jyY: number): string {
    return `${((1 - jyY) / 2) * 100}%`;
}

/** 剪映 X → CSS left 百分比 */
function jyLeftPct(jyX: number): string {
    return `${((1 + jyX) / 2) * 100}%`;
}

/** 全宽居中定位（x=0 的元素：标题、字幕等） */
function jyCenterY(jyY: number): React.CSSProperties {
    return {
        position: "absolute",
        left: 0,
        right: 0,
        top: jyTopPct(jyY),
        transform: "translateY(-50%)",
    };
}

/** 精确点定位（x≠0 的元素：学员标注等） */
function jyCenterXY(jyX: number, jyY: number): React.CSSProperties {
    return {
        position: "absolute",
        left: jyLeftPct(jyX),
        top: jyTopPct(jyY),
        transform: "translate(-50%, -50%)",
    };
}

// ===== 缩放 Hook =====
function useScale(fontUnit: number = DEFAULT_FONT_UNIT) {
    const { width } = useVideoConfig();
    const ratio = width / 1080;
    return {
        /** 剪映字号 → px（含 scale 系数） */
        jySz: (size: number, scale: number = 1) =>
            Math.round(size * fontUnit * ratio * scale),
        /** 1080 基准像素 → 当前画布像素 */
        px: (v: number) => Math.round(v * ratio),
    };
}

// ===== 描边工具 =====
function makeStroke(color: string, px: number = 2): string {
    return [
        `${px}px ${px}px 0 ${color}`,
        `${-px}px ${-px}px 0 ${color}`,
        `${px}px ${-px}px 0 ${color}`,
        `${-px}px ${px}px 0 ${color}`,
        `0 ${px + 1}px 0 ${color}`,
        `0 ${-(px + 1)}px 0 ${color}`,
        `${px + 1}px 0 0 ${color}`,
        `${-(px + 1)}px 0 0 ${color}`,
    ].join(", ");
}

// ===== 字体 =====
const FONT_XQN = "XinQingNian";

const fontFaceStyle = `
@font-face {
    font-family: '${FONT_XQN}';
    src: url('${staticFile("XinQingNian.ttf")}') format('truetype');
    font-weight: normal;
    font-style: normal;
}
`;

if (typeof document !== "undefined") {
    const existing = document.getElementById("xqn-font-face");
    if (!existing) {
        const style = document.createElement("style");
        style.id = "xqn-font-face";
        style.textContent = fontFaceStyle;
        document.head.appendChild(style);
    }
}

// ===== 组件 =====

/*
 * 从剪映 JSON 提取的精确参数（含 scale）:
 *
 *   标题1:     transform(0, 0.812)  scale=1.000  fontSize=16
 *   标题2:     transform(0, 0.651)  scale=1.168  fontSize=11
 *   标题3:     transform(0, 0.538)  scale=0.922  fontSize=14
 *   标题4:     transform(0, 0.408)  scale=0.851  fontSize=12
 *   字幕:      transform(0, -0.435) scale=1.000  fontSize=9
 *   夜校学员:  transform(-0.703, -0.339) scale=0.851  fontSize=12
 *   跑马字幕:  transform(0, -0.694) scale=0.728  fontSize=14
 */

interface JianyingHeaderProps {
    title1: string;
    title2: string;
    title3: string;
    title4?: string;
    strict59?: boolean;
}

export const JianyingHeader: React.FC<JianyingHeaderProps> = ({
    title1,
    title2,
    title3,
    title4,
    strict59 = false,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const { jySz, px } = useScale(
        strict59 ? STRICT_59_FONT_UNIT : DEFAULT_FONT_UNIT
    );
    const title2FontSize = jySz(LAYOUT.title2.fontSize, LAYOUT.title2.scale);
    const title3FontSize = jySz(LAYOUT.title3.fontSize, LAYOUT.title3.scale);
    const title2StrokePx = strict59
        ? Math.max(2, Math.round(title2FontSize * STROKE_RATIO))
        : px(3);
    const title3StrokePx = strict59
        ? Math.max(2, Math.round(title3FontSize * STROKE_RATIO))
        : px(3);
    const opacity = interpolate(frame, [0, 0.3 * fps], [0, 1], {
        extrapolateRight: "clamp",
    });

    return (
        <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
            {/* 标题1 @ (0, 0.812) scale=1.0 — 黑字+黄底色块 */}
            <div
                style={{
                    ...jyCenterY(LAYOUT.title1.y),
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                <span
                    style={{
                        fontFamily: `'${FONT_XQN}', sans-serif`,
                        fontSize: jySz(LAYOUT.title1.fontSize, LAYOUT.title1.scale),
                        fontWeight: 400,
                        color: BLACK,
                        backgroundColor: GOLDEN,
                        padding: `${px(10)}px ${px(24)}px`,
                        borderRadius: px(6),
                        display: "inline",
                        letterSpacing: strict59 ? STRICT_STYLE.letterSpacing : px(2),
                        lineHeight: strict59 ? STRICT_STYLE.lineHeight : 1.3,
                        whiteSpace: "nowrap",
                    }}
                >
                    {title1}
                </span>
            </div>

            {/* 标题2 @ (0, 0.651) scale=1.168 — 深红棕+白描边 */}
            <div style={{ ...jyCenterY(LAYOUT.title2.y), textAlign: "center" }}>
                <span
                    style={{
                        fontFamily: `'${FONT_XQN}', sans-serif`,
                        fontSize: title2FontSize,
                        fontWeight: 400,
                        color: DEEP_RED_BROWN,
                        textShadow: makeStroke(WHITE, title2StrokePx),
                        letterSpacing: strict59 ? STRICT_STYLE.letterSpacing : px(1),
                        lineHeight: strict59 ? STRICT_STYLE.lineHeight : undefined,
                        whiteSpace: "nowrap",
                    }}
                >
                    {title2}
                </span>
            </div>

            {/* 标题3 @ (0, 0.538) scale=0.922 — 浅橙+暗红描边 */}
            <div style={{ ...jyCenterY(LAYOUT.title3.y), textAlign: "center" }}>
                <span
                    style={{
                        fontFamily: `'${FONT_XQN}', sans-serif`,
                        fontSize: title3FontSize,
                        fontWeight: 400,
                        color: LIGHT_PEACH,
                        textShadow: makeStroke(DARK_RED, title3StrokePx),
                        letterSpacing: strict59 ? STRICT_STYLE.letterSpacing : px(2),
                        lineHeight: strict59 ? STRICT_STYLE.lineHeight : undefined,
                        whiteSpace: "nowrap",
                    }}
                >
                    {title3}
                </span>
            </div>

            {/* 标题4 @ (0, 0.408) scale=0.851 — 白字 */}
            {title4 && (
                <div style={{ ...jyCenterY(LAYOUT.title4.y), textAlign: "center" }}>
                    <span
                        style={{
                            fontFamily: `'${FONT_XQN}', sans-serif`,
                            fontSize: jySz(
                                LAYOUT.title4.fontSize,
                                LAYOUT.title4.scale
                            ),
                            fontWeight: 400,
                            color: WHITE,
                            textShadow: strict59
                                ? undefined
                                : makeStroke(BLACK, px(2)),
                            letterSpacing: strict59 ? STRICT_STYLE.letterSpacing : px(1),
                            lineHeight: strict59 ? STRICT_STYLE.lineHeight : undefined,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {title4}
                    </span>
                </div>
            )}
        </AbsoluteFill>
    );
};

/**
 * 夜校学员标注 @ (-0.703, -0.339) scale=0.851
 */
export const StudentLabel: React.FC<{ text?: string; strict59?: boolean }> = ({
    text = "夜校学员:",
    strict59 = false,
}) => {
    const { jySz, px } = useScale(strict59 ? STRICT_59_FONT_UNIT : DEFAULT_FONT_UNIT);
    const fontSize = jySz(
        LAYOUT.studentLabel.fontSize,
        LAYOUT.studentLabel.scale
    );
    const strokePx = strict59
        ? Math.max(2, Math.round(fontSize * STROKE_RATIO))
        : px(3);
    return (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
            <div style={jyCenterXY(LAYOUT.studentLabel.x, LAYOUT.studentLabel.y)}>
                <span
                    style={{
                        fontFamily: `'${FONT_XQN}', sans-serif`,
                        fontSize,
                        fontWeight: 400,
                        color: BLACK,
                        textShadow: makeStroke(WHITE, strokePx),
                        letterSpacing: strict59
                            ? STRICT_STYLE.letterSpacing
                            : undefined,
                        lineHeight: strict59 ? STRICT_STYLE.lineHeight : undefined,
                        whiteSpace: "nowrap",
                    }}
                >
                    {text}
                </span>
            </div>
        </AbsoluteFill>
    );
};

/**
 * 跑马字幕 @ (0, -0.694) scale=0.728
 */
export const CourseList: React.FC<{ courses?: string; strict59?: boolean }> = ({
    courses = "热门课程：游泳，吉他，架子鼓，爵士舞，绘画，书法，\n美妆，声乐，钢琴，普拉提，视频剪辑，摄影，拳击，古筝……",
    strict59 = false,
}) => {
    const { jySz, px } = useScale(strict59 ? STRICT_59_FONT_UNIT : DEFAULT_FONT_UNIT);
    const fontSize = jySz(LAYOUT.courseList.fontSize, LAYOUT.courseList.scale);
    const strokePx = strict59
        ? Math.max(2, Math.round(fontSize * STROKE_RATIO))
        : px(3);
    return (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
            <div style={{ ...jyCenterY(LAYOUT.courseList.y), textAlign: "center" }}>
                <span
                    style={{
                        fontSize,
                        fontWeight: 400,
                        color: GOLDEN,
                        textShadow: makeStroke(BLACK, strokePx),
                        lineHeight: strict59 ? STRICT_STYLE.lineHeight : 1.5,
                        letterSpacing: strict59 ? STRICT_STYLE.letterSpacing : px(2),
                        width: strict59
                            ? `${LAYOUT.courseList.strictTextWidthPct}%`
                            : undefined,
                        display: strict59 ? "inline-block" : "inline",
                        whiteSpace: strict59 ? "normal" : "pre-wrap",
                    }}
                >
                    {courses}
                </span>
            </div>
        </AbsoluteFill>
    );
};

/**
 * 🏷️ 课程标签贴纸（自定义元素，非剪映模板）
 */
export const CourseTag: React.FC<{ label: string }> = ({ label }) => {
    const { px } = useScale();
    return (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
            <div
                style={{
                    position: "absolute",
                    left: px(20),
                    top: px(640),
                }}
            >
                <span
                    style={{
                        fontFamily: `'${FONT_XQN}', sans-serif`,
                        fontSize: px(32),
                        fontWeight: 400,
                        color: WHITE,
                        backgroundColor: "rgba(0,0,0,0.55)",
                        borderRadius: px(6),
                        padding: `${px(6)}px ${px(16)}px`,
                        letterSpacing: px(2),
                    }}
                >
                    📌 {label}
                </span>
            </div>
        </AbsoluteFill>
    );
};

/**
 * 🏢 品牌水印（自定义元素，非剪映模板）
 */
export const BrandWatermark: React.FC<{ name?: string }> = ({
    name = "杭州新青年夜校",
}) => {
    const { px } = useScale();
    return (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
            <div
                style={{
                    position: "absolute",
                    right: px(16),
                    top: px(130),
                }}
            >
                <span
                    style={{
                        fontFamily: `'${FONT_XQN}', sans-serif`,
                        fontSize: px(16),
                        fontWeight: 400,
                        color: "rgba(255,255,255,0.6)",
                        letterSpacing: px(2),
                    }}
                >
                    @{name}
                </span>
            </div>
        </AbsoluteFill>
    );
};
