import { useShaderViewer } from './hooks/useShaderViewer';
import { AppHeader } from './components/organisms/AppHeader';
import { ShaderLibrary } from './components/organisms/ShaderLibrary';
import { ViewerPanel } from './components/organisms/ViewerPanel';
import { usePlayback } from './hooks/usePlayback';
import './styles.css';

export default function App() {
    const viewer = useShaderViewer();
    const playback = usePlayback();

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
                    source={viewer.source}
                    loading={viewer.loading}
                    error={viewer.error}
                    playing={playback.playing}
                    onTogglePlayback={playback.toggle}
                    onRenderError={viewer.setError}
                />
            </div>
        </main>
    );
}
