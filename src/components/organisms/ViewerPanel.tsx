import { useRef } from 'react';
import { useFullscreen } from '../../hooks/useFullscreen';
import { FullscreenButton } from '../molecules/FullscreenButton';
import { PlaybackControls } from '../molecules/PlaybackControls';
import { ViewerHeading } from '../molecules/ViewerHeading';
import { ShaderStage } from './ShaderStage';

interface ViewerPanelProps {
    selectedName: string;
    source: string;
    loading: boolean;
    error: string;
    playing: boolean;
    onTogglePlayback: () => void;
    onRenderError: (message: string) => void;
}

export function ViewerPanel({
    selectedName,
    source,
    loading,
    error,
    playing,
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
                source={source}
                loading={loading}
                error={error}
                playing={playing}
                onRenderError={onRenderError}
                stageRef={stageRef}
            />
            <div className="control-bar">
                <PlaybackControls
                    playing={playing}
                    onToggle={onTogglePlayback}
                />
                <FullscreenButton onClick={toggleFullscreen} />
            </div>
            <div className="hint">
                Edit shader files in <code>shaders/</code> to reload the preview
            </div>
        </section>
    );
}
