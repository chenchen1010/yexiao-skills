/**
 * 剪映风格字幕 — 归一化坐标定位（分辨率无关）
 *
 * 从 JSON: transform(0, -0.435) scale=1.0 fontSize=9
 * CSS: top = (1-(-0.435))/2 = 71.77%
 * 颜色: 白色 #ffffff + 黑描边, 当前字 #ffde00 高亮
 */
import React from "react";
import { AbsoluteFill, useVideoConfig } from "remotion";
import type { Caption } from "@remotion/captions";
import { NIGHT_SCHOOL_59_BASELINE } from "./presets/nightSchool59Baseline";

const WHITE = "#ffffff";
const GOLDEN = "#ffde00";
const STRICT_59_FONT_UNIT = NIGHT_SCHOOL_59_BASELINE.typography.strictFontUnit;
const DEFAULT_FONT_UNIT =
    NIGHT_SCHOOL_59_BASELINE.typography.defaultFontUnit;
const STROKE_RATIO = NIGHT_SCHOOL_59_BASELINE.typography.strokeRatio;
const LAYOUT = NIGHT_SCHOOL_59_BASELINE.layout;
const STRICT_STYLE = NIGHT_SCHOOL_59_BASELINE.strictStyle;

/** 剪映 Y → CSS top 百分比 */
function jyTopPct(jyY: number): string {
    return `${((1 - jyY) / 2) * 100}%`;
}

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

/** 每页最多显示的字符数 */
const MAX_CHARS_PER_PAGE = 12;

/** 手动分页数据 */
export interface CaptionPageData {
    tokens: Caption[];
    startMs: number;
    endMs: number;
}

export function splitCaptionsIntoPages(
    captions: Caption[],
    maxChars: number = MAX_CHARS_PER_PAGE
): CaptionPageData[] {
    const pages: CaptionPageData[] = [];
    let currentTokens: Caption[] = [];
    let charCount = 0;

    for (const token of captions) {
        const tokenLen = token.text.trim().length;
        if (charCount + tokenLen > maxChars && currentTokens.length > 0) {
            pages.push({
                tokens: currentTokens,
                startMs: currentTokens[0].startMs,
                endMs: currentTokens[currentTokens.length - 1].endMs,
            });
            currentTokens = [];
            charCount = 0;
        }
        currentTokens.push(token);
        charCount += tokenLen;
    }

    if (currentTokens.length > 0) {
        pages.push({
            tokens: currentTokens,
            startMs: currentTokens[0].startMs,
            endMs: currentTokens[currentTokens.length - 1].endMs,
        });
    }

    return pages;
}

export const CaptionPage: React.FC<{
    page: CaptionPageData;
    currentTimeMs: number;
    strict59?: boolean;
}> = ({ page, currentTimeMs, strict59 = false }) => {
    const { width } = useVideoConfig();
    const ratio = width / 1080;
    const px = (v: number) => Math.round(v * ratio);
    const fontUnit = strict59 ? STRICT_59_FONT_UNIT : DEFAULT_FONT_UNIT;
    // 剪映 fontSize=9, scale=1.0
    const fontSize = Math.round(
        LAYOUT.subtitle.fontSize * fontUnit * ratio * LAYOUT.subtitle.scale
    );
    const strokePx = strict59
        ? Math.max(2, Math.round(fontSize * STROKE_RATIO))
        : px(3);
    const stroke = makeStroke("#000000", strokePx);

    return (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
            {/* 字幕 @ (0, -0.435) — 元素中心在此坐标 */}
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: jyTopPct(LAYOUT.subtitle.y),
                    transform: "translateY(-50%)",
                    textAlign: "center",
                }}
            >
                <span
                    style={{
                        fontSize,
                        fontWeight: 700,
                        lineHeight: strict59 ? STRICT_STYLE.lineHeight : 1.4,
                        letterSpacing: strict59 ? STRICT_STYLE.letterSpacing : px(1),
                    }}
                >
                    {page.tokens.map((token, i) => {
                        const isActive =
                            token.startMs <= currentTimeMs &&
                            token.endMs > currentTimeMs;

                        return (
                            <span
                                key={`${token.startMs}-${i}`}
                                style={{
                                    color: isActive ? GOLDEN : WHITE,
                                    textShadow: stroke,
                                }}
                            >
                                {token.text}
                            </span>
                        );
                    })}
                </span>
            </div>
        </AbsoluteFill>
    );
};

export const StaticTemplateSubtitle: React.FC<{
    text?: string;
    strict59?: boolean;
}> = ({ text = "字幕", strict59 = false }) => {
    const { width } = useVideoConfig();
    const ratio = width / 1080;
    const px = (v: number) => Math.round(v * ratio);
    const fontUnit = strict59 ? STRICT_59_FONT_UNIT : DEFAULT_FONT_UNIT;
    const fontSize = Math.round(
        LAYOUT.subtitle.fontSize * fontUnit * ratio * LAYOUT.subtitle.scale
    );
    const strokePx = strict59
        ? Math.max(2, Math.round(fontSize * STROKE_RATIO))
        : px(3);

    return (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
            <div
                style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: jyTopPct(LAYOUT.subtitle.y),
                    transform: "translateY(-50%)",
                    textAlign: "center",
                }}
            >
                <span
                    style={{
                        fontSize,
                        fontWeight: 700,
                        lineHeight: strict59 ? STRICT_STYLE.lineHeight : 1.4,
                        letterSpacing: strict59 ? STRICT_STYLE.letterSpacing : px(1),
                        color: WHITE,
                        textShadow: makeStroke("#000000", strokePx),
                    }}
                >
                    {text}
                </span>
            </div>
        </AbsoluteFill>
    );
};
