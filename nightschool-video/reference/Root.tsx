import "./index.css";
import { Composition } from "remotion";
import { NightSchoolVideo } from "./NightSchoolVideo";
import { NIGHT_SCHOOL_59_BASELINE } from "./presets/nightSchool59Baseline";

const FPS = NIGHT_SCHOOL_59_BASELINE.compositions.fps;
const TOTAL_FRAMES = Math.round(
    NIGHT_SCHOOL_59_BASELINE.compositions.voiceoverDurationSec * FPS
);
const TEMPLATE_REF_FRAMES = Math.round(
    NIGHT_SCHOOL_59_BASELINE.compositions.templateRefDurationSec * FPS
);
const Strict59Composition: React.FC = () => <NightSchoolVideo strict59 />;

export const RemotionRoot: React.FC = () => {
    return (
        <>
            {/* 严格 5.9 复刻：固定 1080x1920，不叠加模板外元素 */}
            <Composition
                id={NIGHT_SCHOOL_59_BASELINE.compositions.strictId}
                component={Strict59Composition}
                durationInFrames={TOTAL_FRAMES}
                fps={FPS}
                width={NIGHT_SCHOOL_59_BASELINE.compositions.strictCanvas.width}
                height={NIGHT_SCHOOL_59_BASELINE.compositions.strictCanvas.height}
            />
            <Composition
                id={NIGHT_SCHOOL_59_BASELINE.compositions.pixelRefId}
                component={Strict59Composition}
                durationInFrames={TEMPLATE_REF_FRAMES}
                fps={FPS}
                width={NIGHT_SCHOOL_59_BASELINE.compositions.strictCanvas.width}
                height={NIGHT_SCHOOL_59_BASELINE.compositions.strictCanvas.height}
            />

            {/* 兼容旧版输出：720x1280 */}
            <Composition
                id={NIGHT_SCHOOL_59_BASELINE.compositions.legacyId}
                component={NightSchoolVideo}
                durationInFrames={TOTAL_FRAMES}
                fps={FPS}
                width={NIGHT_SCHOOL_59_BASELINE.compositions.legacyCanvas.width}
                height={NIGHT_SCHOOL_59_BASELINE.compositions.legacyCanvas.height}
            />
        </>
    );
};
