/**
 * 🎬 夜校短视频 — 剪映版式精确复刻版 V8
 *
 * 使用从 5.9 剪映草稿 JSON 提取的精确参数
 * 字体：新青年体 + 系统中文
 * 色系：金黄 #ffde00 / 深红棕 #ab4a37 / 浅橙 #ffd9c6 / 暗红 #a74f59 / 白 / 黑
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import {
    AbsoluteFill,
    Sequence,
    staticFile,
    useDelayRender,
    useVideoConfig,
    interpolate,
    useCurrentFrame,
} from "remotion";
import { Video, Audio } from "@remotion/media";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import type { Caption } from "@remotion/captions";
import {
    CaptionPage,
    splitCaptionsIntoPages,
} from "./CaptionPage";
import {
    JianyingHeader,
    StudentLabel,
    CourseList,
    CourseTag,
    BrandWatermark,
} from "./JianyingLayout";
import { NIGHT_SCHOOL_59_BASELINE } from "./presets/nightSchool59Baseline";

// 3 段素材及对应的课程标签
const CLIPS = ["clip-makeup.mp4", "clip-guitar.mp4", "clip-jazz.mp4"];
const CLIP_LABELS = ["美妆课", "吉他课", "爵士舞课"];

// 视频参数
const VOICEOVER_DURATION_SEC =
    NIGHT_SCHOOL_59_BASELINE.compositions.voiceoverDurationSec;
const TRANSITION_DURATION_SEC = 0.8;
const CLIP_COUNT = 3;
const TRANSITION_COUNT = 2;
const CLIP_DURATION_SEC =
    (VOICEOVER_DURATION_SEC + TRANSITION_COUNT * TRANSITION_DURATION_SEC) /
    CLIP_COUNT;

const TEXT = NIGHT_SCHOOL_59_BASELINE.text.defaults;


interface NightSchoolVideoProps {
    strict59?: boolean;
}

export const NightSchoolVideo: React.FC<NightSchoolVideoProps> = ({
    strict59 = false,
}) => {
    const { fps } = useVideoConfig();
    const frame = useCurrentFrame();

    // ===== 字幕加载 =====
    const [captions, setCaptions] = useState<Caption[] | null>(null);
    const { delayRender, continueRender, cancelRender } = useDelayRender();
    const [handle] = useState(() => delayRender());

    const fetchCaptions = useCallback(async () => {
        try {
            const response = await fetch(staticFile("captions.json"));
            const data = await response.json();
            setCaptions(data);
            continueRender(handle);
        } catch (e) {
            cancelRender(e);
        }
    }, [continueRender, cancelRender, handle]);

    useEffect(() => {
        fetchCaptions();
    }, [fetchCaptions]);

    // ===== 手动字幕分页（每 12 个字一页） =====
    const pages = useMemo(() => {
        return splitCaptionsIntoPages(captions ?? [], 12);
    }, [captions]);

    // ===== 帧数计算 =====
    const clipFrames = Math.round(CLIP_DURATION_SEC * fps);
    const transitionFrames = Math.round(TRANSITION_DURATION_SEC * fps);

    // 全局当前时间 (ms)
    const currentTimeMs = (frame / fps) * 1000;

    if (!captions) return null;

    const globalFadeIn = strict59
        ? 1
        : interpolate(frame, [0, 0.3 * fps], [0, 1], {
            extrapolateRight: "clamp",
        });

    return (
        <AbsoluteFill
            style={{
                backgroundColor: "black",
                opacity: globalFadeIn,
            }}
        >
            {/* ===== 1. 视频轨道（全部淡入淡出转场） ===== */}
            <TransitionSeries>
                <TransitionSeries.Sequence durationInFrames={clipFrames}>
                    <Video
                        src={staticFile(CLIPS[0])}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        muted
                    />
                </TransitionSeries.Sequence>
                <TransitionSeries.Transition
                    presentation={fade()}
                    timing={linearTiming({ durationInFrames: transitionFrames })}
                />
                <TransitionSeries.Sequence durationInFrames={clipFrames}>
                    <Video
                        src={staticFile(CLIPS[1])}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        muted
                    />
                </TransitionSeries.Sequence>
                <TransitionSeries.Transition
                    presentation={fade()}
                    timing={linearTiming({ durationInFrames: transitionFrames })}
                />
                <TransitionSeries.Sequence durationInFrames={clipFrames}>
                    <Video
                        src={staticFile(CLIPS[2])}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        muted
                    />
                </TransitionSeries.Sequence>
            </TransitionSeries>

            {/* ===== 2. 配音 ===== */}
            <Audio src={staticFile("voiceover.mp3")} volume={0.9} />

            <JianyingHeader
                title1={TEXT.title1}
                title2={TEXT.title2}
                title3={TEXT.title3}
                title4={TEXT.title4}
                strict59={strict59}
            />
            <BrandWatermark />

            {CLIP_LABELS.map((label, i) => {
                const clipStart = Math.round(
                    i * clipFrames - i * transitionFrames
                );
                return (
                    <Sequence
                        key={label}
                        from={Math.max(0, clipStart)}
                        durationInFrames={clipFrames}
                    >
                        <CourseTag label={label} />
                    </Sequence>
                );
            })}

            <StudentLabel
                strict59={strict59}
                text={TEXT.studentLabel}
            />
            <CourseList
                strict59={strict59}
                courses={TEXT.courseList}
            />

            <AbsoluteFill>
                {pages.map((page, index) => {
                    const startFrame = Math.round((page.startMs / 1000) * fps);
                    const endFrame = Math.round((page.endMs / 1000) * fps);
                    const dur = endFrame - startFrame;
                    if (dur <= 0) return null;

                    return (
                        <Sequence
                            key={index}
                            from={startFrame}
                            durationInFrames={dur}
                        >
                            <CaptionPage
                                page={page}
                                currentTimeMs={currentTimeMs}
                                strict59={strict59}
                            />
                        </Sequence>
                    );
                })}
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
