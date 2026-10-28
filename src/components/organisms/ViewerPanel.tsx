import { useRef } from 'react';
import type { ShaderProject } from '../../types/shader';
import { useFullscreen } from '../../hooks/useFullscreen';
import { FullscreenButton } from '../molecules/FullscreenButton';
import { PlaybackControls } from '../molecules/PlaybackControls';
import { PreviewTimer } from '../molecules/PreviewTimer';
import { ViewerHeading } from '../molecules/ViewerHeading';
import { ShaderStage } from './ShaderStage';

interface ViewerPanelProps {
    selectedName: string;
    project: ShaderProject | null;
    loading: boolean;
    error: string;
    playing: boolean;
    elapsed: number;
    resetKey: number;
    onResetTime: () => void;
    onTogglePlayback: () => void;
    onRenderError: (message: string) => void;
}

export function ViewerPanel({
    selectedName,
    project,
    loading,
    error,
    playing,
    elapsed,
    resetKey,
    onResetTime,
    onTogglePlayback,
    onRenderError,
}: ViewerPanelProps) {
    const stageRef = useRef<HTMLDivElement>(null);
    const toggleFullscreen = useFullscreen(stageRef);

    return (
        <section className="main-panel">
            <ViewerHeading shaderName={selectedName} />
            <ShaderStage
                selected={Boolean(selectedName)}
                project={project}
                loading={loading}
                error={error}
                playing={playing}
                onRenderError={onRenderError}
                resetKey={resetKey}
                stageRef={stageRef}
            />
            <div className="control-bar">
                <PlaybackControls
                    playing={playing}
                    onToggle={onTogglePlayback}
                />
                <PreviewTimer elapsed={elapsed} onReset={onResetTime} />
                <FullscreenButton onClick={toggleFullscreen} />
            </div>
            <div className="hint">
                Edit shader files in <code>shaders/</code> to reload the preview
            </div>
        </section>
    );
}
