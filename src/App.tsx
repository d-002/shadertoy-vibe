import { useEffect, useRef } from 'react';
import { useShaderViewer } from './hooks/useShaderViewer';
import { AppHeader } from './components/organisms/AppHeader';
import { ShaderLibrary } from './components/organisms/ShaderLibrary';
import { ViewerPanel } from './components/organisms/ViewerPanel';
import { usePlayback } from './hooks/usePlayback';
import './styles.css';

export default function App() {
    const viewer = useShaderViewer();
    const playback = usePlayback(Boolean(viewer.project) && !viewer.loading);
    const resetPlayback = playback.reset;
    const previousProjectRef = useRef(viewer.project);
    const hasLoadedProjectRef = useRef(false);

    useEffect(() => {
        if (
            viewer.project &&
            hasLoadedProjectRef.current &&
            previousProjectRef.current !== viewer.project
        ) {
            resetPlayback();
        }
        if (viewer.project) hasLoadedProjectRef.current = true;
        previousProjectRef.current = viewer.project;
    }, [viewer.project, resetPlayback]);

    return (
        <main className="app-shell">
            <AppHeader />
            <div className="workspace">
                <ShaderLibrary
                    shaders={viewer.shaders}
                    selectedId={viewer.selectedId}
                    onSelect={viewer.selectShader}
                />
                <ViewerPanel
                    selectedName={viewer.selectedName}
                    project={viewer.project}
                    loading={viewer.loading}
                    error={viewer.error}
                    playing={playback.playing}
                    onTogglePlayback={playback.toggle}
                    elapsed={playback.elapsed}
                    resetKey={playback.resetKey}
                    onResetTime={playback.reset}
                    onRenderError={viewer.setError}
                />
            </div>
        </main>
    );
}
