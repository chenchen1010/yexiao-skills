import type { ReactNode } from "react";
import { Freeze, useCurrentFrame } from "remotion";

type FirstFrameCoverProps = {
    sourceFrame: number;
    children: ReactNode;
};

/**
 * Overlays a fully composed, information-dense visual on video frame 0 only.
 * Audio and the normal animation timeline continue unchanged underneath.
 */
export const FirstFrameCover: React.FC<FirstFrameCoverProps> = ({
    sourceFrame,
    children,
}) => {
    const frame = useCurrentFrame();

    return frame === 0
        ? <Freeze frame={sourceFrame}>{children}</Freeze>
        : null;
};
