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
import { FirstFrameCover } from "./FirstFrameCover";
import { NIGHT_SCHOOL_59_BASELINE } from "./nightSchool59Baseline";

const CLIPS = ["clip-makeup.mp4", "clip-guitar.mp4", "clip-jazz.mp4"];
const CLIP_LABELS = ["美妆课", "吉他课", "爵士舞课"];

const VOICEOVER_DURATION_SEC =
    NIGHT_SCHOOL_59_BASELINE.compositions.voiceoverDurationSec;
const TRANSITION_DURATION_SEC = 0.8;
const CLIP_COUNT = 3;
const TRANSITION_COUNT = 2;
const CLIP_DURATION_SEC =
    (VOICEOVER_DURATION_SEC + TRANSITION_COUNT * TRANSITION_DURATION_SEC) /
    CLIP_COUNT;
const SOURCE_CLIP_DURATION_SEC = 4;
const CLIP_PLAYBACK_RATE = SOURCE_CLIP_DURATION_SEC / CLIP_DURATION_SEC;

const TEXT = NIGHT_SCHOOL_59_BASELINE.text.defaults;

type NightSchoolVideoProps = {
    strict59?: boolean;
};

type NightSchoolVisualsProps = {
    strict59: boolean;
    pages: ReturnType<typeof splitCaptionsIntoPages>;
};

const NightSchoolVisuals: React.FC<NightSchoolVisualsProps> = ({
    strict59,
    pages,
}) => {
    const { fps } = useVideoConfig();
    const frame = useCurrentFrame();
    const clipFrames = Math.round(CLIP_DURATION_SEC * fps);
    const transitionFrames = Math.round(TRANSITION_DURATION_SEC * fps);
    const currentTimeMs = (frame / fps) * 1000;
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
            <TransitionSeries>
                <TransitionSeries.Sequence durationInFrames={clipFrames}>
                    <Video
                        src={staticFile(CLIPS[0])}
                        style={{ width: "100%", height: "100%" }}
                        objectFit="cover"
                        playbackRate={CLIP_PLAYBACK_RATE}
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
                        style={{ width: "100%", height: "100%" }}
                        objectFit="cover"
                        playbackRate={CLIP_PLAYBACK_RATE}
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
                        style={{ width: "100%", height: "100%" }}
                        objectFit="cover"
                        playbackRate={CLIP_PLAYBACK_RATE}
                        muted
                    />
                </TransitionSeries.Sequence>
            </TransitionSeries>

            <JianyingHeader
                title1={TEXT.title1}
                title2={TEXT.title2}
                title3={TEXT.title3}
                title4={TEXT.title4}
                strict59={strict59}
            />
            <BrandWatermark />

            {CLIP_LABELS.map((label, index) => {
                const clipStart = Math.round(
                    index * clipFrames - index * transitionFrames
                );
                return (
                    <Sequence
                        key={label}
                        from={Math.max(0, clipStart)}
                        durationInFrames={clipFrames}
                        premountFor={fps}
                    >
                        <CourseTag label={label} />
                    </Sequence>
                );
            })}

            <StudentLabel strict59={strict59} text={TEXT.studentLabel} />
            <CourseList strict59={strict59} courses={TEXT.courseList} />

            <AbsoluteFill>
                {pages.map((page, index) => {
                    const startFrame = Math.round((page.startMs / 1000) * fps);
                    const endFrame = Math.round((page.endMs / 1000) * fps);
                    const durationInFrames = endFrame - startFrame;
                    if (durationInFrames <= 0) return null;

                    return (
                        <Sequence
                            key={index}
                            from={startFrame}
                            durationInFrames={durationInFrames}
                            premountFor={fps}
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

export const NightSchoolVideo: React.FC<NightSchoolVideoProps> = ({
    strict59 = false,
}) => {
    const [captions, setCaptions] = useState<Caption[] | null>(null);
    const { delayRender, continueRender, cancelRender } = useDelayRender();
    const [handle] = useState(() => delayRender());

    const fetchCaptions = useCallback(async () => {
        try {
            const response = await fetch(staticFile("captions.json"));
            const data = await response.json();
            setCaptions(data);
            continueRender(handle);
        } catch (error) {
            cancelRender(error);
        }
    }, [continueRender, cancelRender, handle]);

    useEffect(() => {
        fetchCaptions();
    }, [fetchCaptions]);

    const pages = useMemo(
        () => splitCaptionsIntoPages(captions ?? [], 12),
        [captions]
    );

    if (!captions) return null;

    return (
        <AbsoluteFill style={{ backgroundColor: "black" }}>
            <Audio src={staticFile("voiceover.mp3")} volume={0.9} />
            <NightSchoolVisuals strict59={strict59} pages={pages} />
            <FirstFrameCover
                sourceFrame={NIGHT_SCHOOL_59_BASELINE.compositions.coverFrame}
            >
                <NightSchoolVisuals strict59={strict59} pages={pages} />
            </FirstFrameCover>
        </AbsoluteFill>
    );
};
