import type { RefObject } from 'react';
import { ShaderCanvas } from '../ShaderCanvas';
import { ShaderErrorPanel } from '../atoms/ShaderErrorPanel';
import { StageMessage } from '../atoms/StageMessage';

interface ShaderStageProps {
    selected: boolean;
    source: string;
    loading: boolean;
    error: string;
    playing: boolean;
    onRenderError: (message: string) => void;
    stageRef: RefObject<HTMLDivElement | null>;
}

export function ShaderStage({
    selected,
    source,
    loading,
    error,
    playing,
    onRenderError,
    stageRef,
}: ShaderStageProps) {
    return (
        <div ref={stageRef} className="viewer-stage">
            {selected && !loading && (
                <ShaderCanvas
                    source={source}
                    playing={playing}
                    onError={onRenderError}
                />
            )}
            {loading && <StageMessage>Loading shader…</StageMessage>}
            {!loading && !selected && (
                <StageMessage>
                    No shaders found. Add one under <code>shaders/</code>.
                </StageMessage>
            )}
            {error && <ShaderErrorPanel message={error} />}
            <div className="stage-corner">LIVE PREVIEW</div>
        </div>
    );
}
