import React from "react";
import { Audio } from "@remotion/media";
import {
    AbsoluteFill,
    Easing,
    Sequence,
    interpolate,
    spring,
    staticFile,
    useCurrentFrame,
    useVideoConfig,
} from "remotion";
import {
    NEWS_NOTICE_TEMPLATE,
    type NewsNoticeTemplateProps,
} from "./presets/newsNoticeTemplate";
import { FirstFrameCover } from "./FirstFrameCover";

const FONT_NEWS = "NewsNoticeBold";
const LAYOUT = NEWS_NOTICE_TEMPLATE.layout;

const fontFaceStyle = `
@font-face {
    font-family: '${FONT_NEWS}';
    src: url('${staticFile("NotoSansHans-Bold.otf")}') format('opentype');
    font-weight: 700;
    font-style: normal;
}
`;

if (typeof document !== "undefined" && !document.getElementById("news-notice-font-face")) {
    const style = document.createElement("style");
    style.id = "news-notice-font-face";
    style.textContent = fontFaceStyle;
    document.head.appendChild(style);
}

const clamp = {
    extrapolateLeft: "clamp" as const,
    extrapolateRight: "clamp" as const,
};

const stroke = (color: string, width: number) => ({
    WebkitTextStroke: `${width}px ${color}`,
    paintOrder: "stroke fill" as const,
    textShadow: "0 5px 12px rgba(0,0,0,0.55)",
});

const TechBackground: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const drift = interpolate(frame, [0, 8 * fps], [0, -160], clamp);
    const glow = interpolate(frame, [0, 3.6 * fps, 7.4 * fps], [0.66, 0.9, 0.72], clamp);
    const squares = [
        { left: 80, top: 190, size: 95, delay: 0 },
        { left: 820, top: 120, size: 120, delay: 12 },
        { left: 150, top: 850, size: 70, delay: 24 },
        { left: 880, top: 1050, size: 86, delay: 8 },
        { left: 62, top: 1460, size: 138, delay: 18 },
        { left: 790, top: 1540, size: 110, delay: 30 },
    ];

    return (
        <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#041630" }}>
            <AbsoluteFill
                style={{
                    background:
                        "radial-gradient(circle at 50% 48%, rgba(22,158,255,0.48), transparent 28%), linear-gradient(180deg, #07142f 0%, #072754 52%, #03142c 100%)",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    left: -220,
                    right: -220,
                    top: 900,
                    height: 1180,
                    transform: `perspective(780px) rotateX(64deg) translateY(${drift}px)`,
                    transformOrigin: "50% 0%",
                    opacity: 0.62,
                    backgroundImage:
                        "linear-gradient(rgba(53,184,255,0.34) 2px, transparent 2px), linear-gradient(90deg, rgba(53,184,255,0.34) 2px, transparent 2px)",
                    backgroundSize: "92px 92px",
                    boxShadow: "inset 0 40px 120px rgba(17,175,255,0.2)",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    left: -180,
                    right: -180,
                    top: 1080,
                    height: 16,
                    opacity: glow,
                    background: "linear-gradient(90deg, transparent, #33d6ff, #ffffff, #33d6ff, transparent)",
                    filter: "blur(5px)",
                    boxShadow: "0 0 70px 28px rgba(0,169,255,0.55)",
                }}
            />
            {squares.map((square, index) => {
                const local = (frame + square.delay) % (3 * fps);
                const opacity = interpolate(local, [0, 1.5 * fps, 3 * fps], [0.08, 0.38, 0.08], clamp);
                const translateY = interpolate(local, [0, 3 * fps], [24, -28], clamp);
                return (
                    <div
                        key={index}
                        style={{
                            position: "absolute",
                            left: square.left,
                            top: square.top,
                            width: square.size,
                            height: square.size,
                            opacity,
                            transform: `translateY(${translateY}px) rotate(45deg)`,
                            outline: "3px solid rgba(82,202,255,0.7)",
                            boxShadow: "0 0 28px rgba(62,186,255,0.35)",
                        }}
                    />
                );
            })}
            <AbsoluteFill
                style={{
                    background:
                        "linear-gradient(180deg, rgba(0,0,0,0.06), transparent 30%, rgba(0,0,0,0.24) 100%)",
                }}
            />
        </AbsoluteFill>
    );
};

const MapPin: React.FC = () => (
    <div
        style={{
            position: "relative",
            width: 58,
            height: 72,
            marginRight: 18,
            flexShrink: 0,
        }}
    >
        <div
            style={{
                width: 54,
                height: 54,
                borderRadius: "50% 50% 50% 0",
                transform: "rotate(-45deg)",
                background: "linear-gradient(135deg, #ff725f, #e32636)",
                boxShadow: "0 8px 18px rgba(0,0,0,0.38)",
            }}
        />
        <div
            style={{
                position: "absolute",
                left: 19,
                top: 15,
                width: 17,
                height: 17,
                borderRadius: "50%",
                backgroundColor: "white",
                boxShadow: "0 0 0 5px rgba(0,0,0,0.12)",
            }}
        />
    </div>
);

const Header: React.FC<Pick<NewsNoticeTemplateProps, "city" | "headline" | "showLocationPin" | "noticeLabel" | "announcement">> = ({
    city,
    headline,
    showLocationPin,
    noticeLabel,
    announcement,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const displayHeadline = `${city}${headline}`;
    const headlineFontSize =
        displayHeadline.length > 10
            ? LAYOUT.headlineFontSize - 12
            : displayHeadline.length > 8
                ? LAYOUT.headlineFontSize - 5
                : LAYOUT.headlineFontSize;
    const entrance = spring({ frame, fps, durationInFrames: 20, config: { damping: 200 } });
    const translateY = interpolate(entrance, [0, 1], [-48, 0], clamp);

    return (
        <div
            style={{
                position: "absolute",
                top: LAYOUT.headerTop,
                left: 44,
                right: 44,
                textAlign: "center",
                opacity: entrance,
                transform: `translateY(${translateY}px)`,
            }}
        >
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                {showLocationPin ? <MapPin /> : null}
                <div
                    style={{
                        fontFamily: `'${FONT_NEWS}', sans-serif`,
                        color: "white",
                        fontSize: headlineFontSize,
                        lineHeight: 1,
                        letterSpacing: -2,
                        ...stroke("#050505", 9),
                    }}
                >
                    {displayHeadline}
                </div>
            </div>
            <div
                style={{
                    marginTop: 21,
                    color: "white",
                    fontFamily: `'${FONT_NEWS}', sans-serif`,
                    fontSize: LAYOUT.noticeFontSize,
                    fontWeight: 700,
                    letterSpacing: 0,
                    ...stroke("#050505", 4),
                }}
            >
                {noticeLabel}
            </div>
            <div
                style={{
                    marginTop: 4,
                    color: "white",
                    fontFamily: `'${FONT_NEWS}', sans-serif`,
                    fontSize: LAYOUT.announcementFontSize,
                    lineHeight: 1.15,
                    fontWeight: 700,
                    ...stroke("#ff2337", 4),
                }}
            >
                {announcement}
            </div>
        </div>
    );
};

const HighlightCard: React.FC<Pick<NewsNoticeTemplateProps, "highlightLines">> = ({
    highlightLines,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const entrance = spring({ frame: frame - 10, fps, durationInFrames: 18, config: { damping: 18, stiffness: 180 } });
    const scale = interpolate(entrance, [0, 1], [0.86, 1], clamp);

    return (
        <div
            style={{
                position: "absolute",
                top: LAYOUT.highlightTop,
                left: "50%",
                width: LAYOUT.highlightWidth,
                height: LAYOUT.highlightHeight,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                opacity: entrance,
                transform: `translateX(-50%) scale(${scale})`,
            }}
        >
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    textAlign: "center",
                    color: "#101010",
                    background: "#ffe500",
                    borderRadius: 8,
                    boxShadow: "0 10px 28px rgba(0,0,0,0.34)",
                    fontFamily: `'${FONT_NEWS}', sans-serif`,
                    fontSize: LAYOUT.highlightFontSize,
                    lineHeight: 1.34,
                    letterSpacing: 0,
                }}
            >
                <div>{highlightLines[0]}</div>
                <div>{highlightLines[1]}</div>
            </div>
        </div>
    );
};

const ValueBadge: React.FC<{ text: string; durationInFrames: number }> = ({
    text,
    durationInFrames,
}) => {
    const frame = useCurrentFrame();
    const opacity = interpolate(
        frame,
        [0, 8, durationInFrames - 10, durationInFrames - 1],
        [0, 1, 1, 0],
        clamp
    );

    return (
        <div
            style={{
                position: "absolute",
                top: LAYOUT.valueBadgeTop,
                left: "50%",
                transform: "translateX(-50%)",
                opacity,
                padding: "15px 28px 17px",
                color: "#111",
                backgroundColor: "white",
                fontFamily: `'${FONT_NEWS}', sans-serif`,
                fontSize: LAYOUT.valueBadgeFontSize,
                lineHeight: 1,
                whiteSpace: "nowrap",
                boxShadow: "0 7px 18px rgba(0,0,0,0.38)",
            }}
        >
            {text}
        </div>
    );
};

type InformationSectionProps = {
    kind: "course" | "audience";
    title: string;
    lines: readonly string[];
    footerLines?: readonly string[];
    durationInFrames: number;
};

const InformationSection: React.FC<InformationSectionProps> = ({
    kind,
    title,
    lines,
    footerLines = [],
    durationInFrames,
}) => {
    const frame = useCurrentFrame();
    const fadeOutStart = Math.max(11, durationInFrames - 12);
    const opacity = interpolate(frame, [0, 10, fadeOutStart, durationInFrames - 1], [0, 1, 1, 0], {
        ...clamp,
        easing: Easing.inOut(Easing.quad),
    });
    const translateY = interpolate(frame, [0, 12], [38, 0], clamp);
    const isCourse = kind === "course";

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                opacity,
                transform: `translateY(${translateY}px)`,
                textAlign: "center",
                color: "white",
            }}
        >
            {!isCourse && (
                <div
                    style={{
                        position: "absolute",
                        top: LAYOUT.audienceLabelTop,
                        left: "50%",
                        transform: "translateX(-50%)",
                        display: "inline-block",
                        padding: "15px 29px 17px",
                        color: "#061426",
                        backgroundColor: "white",
                        fontFamily: `'${FONT_NEWS}', sans-serif`,
                        fontSize: LAYOUT.audienceLabelFontSize,
                        lineHeight: 1,
                        whiteSpace: "nowrap",
                        boxShadow: "0 7px 18px rgba(0,0,0,0.35)",
                    }}
                >
                    {title}
                </div>
            )}
            <div
                style={{
                    position: "absolute",
                    top: isCourse ? LAYOUT.courseBodyTop : LAYOUT.audienceBodyTop,
                    left: 42,
                    right: 42,
                    fontFamily: `'${FONT_NEWS}', sans-serif`,
                    fontSize: isCourse
                        ? LAYOUT.courseBodyFontSize
                        : LAYOUT.audienceBodyFontSize,
                    lineHeight: isCourse ? 1.48 : 1.45,
                    fontWeight: 700,
                    ...stroke("#060606", 4),
                }}
            >
                {lines.map((line) => <div key={line}>{line}</div>)}
            </div>
            {footerLines.length > 0 && (
                <div
                    style={{
                        position: "absolute",
                        top: LAYOUT.coverageTop,
                        left: 36,
                        right: 36,
                        fontFamily: `'${FONT_NEWS}', sans-serif`,
                        fontSize: LAYOUT.coverageFontSize,
                        lineHeight: 1.43,
                        color: "white",
                        fontWeight: 700,
                        ...stroke("#060606", 4),
                    }}
                >
                    {footerLines.map((line) => <div key={line}>{line}</div>)}
                </div>
            )}
        </div>
    );
};

const NewsNoticeVisuals: React.FC<NewsNoticeTemplateProps> = (props) => {
    const frame = useCurrentFrame();
    const { fps, durationInFrames } = useVideoConfig();
    const switchFrame = Math.round(NEWS_NOTICE_TEMPLATE.meta.switchAtSec * fps);
    const ctaOpacity = interpolate(frame, [durationInFrames - 42, durationInFrames - 20], [0, 1], clamp);

    return (
        <AbsoluteFill style={{ backgroundColor: "#041630", fontFamily: `'${FONT_NEWS}', sans-serif` }}>
            <TechBackground />
            <Header
                city={props.city}
                headline={props.headline}
                showLocationPin={props.showLocationPin}
                noticeLabel={props.noticeLabel}
                announcement={props.announcement}
            />
            <HighlightCard highlightLines={props.highlightLines} />

            <Sequence from={0} durationInFrames={switchFrame} premountFor={fps}>
                <ValueBadge
                    text={props.valueBadge}
                    durationInFrames={switchFrame}
                />
                <InformationSection
                    kind="course"
                    title={props.courseTitle}
                    lines={props.courseLines}
                    durationInFrames={switchFrame}
                />
            </Sequence>
            <Sequence from={switchFrame} durationInFrames={durationInFrames - switchFrame} premountFor={fps}>
                <InformationSection
                    kind="audience"
                    title={props.audienceTitle}
                    lines={props.audienceLines}
                    footerLines={props.coverageLines}
                    durationInFrames={durationInFrames - switchFrame}
                />
            </Sequence>

            {props.cta ? (
                <div
                    style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        bottom: 78,
                        textAlign: "center",
                        opacity: ctaOpacity,
                        color: "#ffdf23",
                        fontFamily: `'${FONT_NEWS}', sans-serif`,
                        fontSize: 40,
                        ...stroke("#07101f", 4),
                    }}
                >
                    {props.cta}
                </div>
            ) : null}
        </AbsoluteFill>
    );
};

export const NewsNoticeVideo: React.FC<NewsNoticeTemplateProps> = (props) => {
    const { durationInFrames } = useVideoConfig();

    return (
        <AbsoluteFill style={{ backgroundColor: "#041630" }}>
            <Audio
                src={staticFile(props.musicFile)}
                volume={(audioFrame) =>
                    interpolate(
                        audioFrame,
                        [0, 10, durationInFrames - 18, durationInFrames - 1],
                        [0, 0.6, 0.6, 0],
                        clamp
                    )
                }
            />
            <NewsNoticeVisuals {...props} />
            <FirstFrameCover sourceFrame={NEWS_NOTICE_TEMPLATE.meta.coverFrame}>
                <NewsNoticeVisuals {...props} />
            </FirstFrameCover>
        </AbsoluteFill>
    );
};
