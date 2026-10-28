import type { RefObject } from 'react';
import type { ShaderProject } from '../../types/shader';
import { ShaderCanvas } from '../ShaderCanvas';
import { ShaderErrorPanel } from '../atoms/ShaderErrorPanel';
import { StageMessage } from '../atoms/StageMessage';

interface ShaderStageProps {
    selected: boolean;
    project: ShaderProject | null;
    loading: boolean;
    error: string;
    playing: boolean;
    resetKey: number;
    onRenderError: (message: string) => void;
    stageRef: RefObject<HTMLDivElement | null>;
}

export function ShaderStage({
    selected,
    project,
    loading,
    error,
    playing,
    resetKey,
    onRenderError,
    stageRef,
}: ShaderStageProps) {
    return (
        <div ref={stageRef} className="viewer-stage">
            {selected && project && !loading && (
                <ShaderCanvas
                    project={project}
                    playing={playing}
                    resetKey={resetKey}
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
