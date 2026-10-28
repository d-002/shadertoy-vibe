import { useCallback, useEffect, useState } from 'react';
import { ShaderCanvas } from './ShaderCanvas.jsx';

export default function App() {
    const [shaders, setShaders] = useState([]);
    const [selected, setSelected] = useState('');
    const [source, setSource] = useState('');
    const [playing, setPlaying] = useState(true);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const loadList = useCallback(async () => {
        try {
            const response = await fetch('/api/shaders');
            if (!response.ok)
                throw new Error(`Could not load shaders (${response.status}).`);
            const items = await response.json();
            setShaders(items);
            setSelected((current) =>
                items.some((item) => item.id === current)
                    ? current
                    : (items[0]?.id ?? ''),
            );
        } catch (loadError) {
            setError(loadError.message);
        }
    }, []);

    const loadSource = useCallback(async (id) => {
        if (!id) {
            setSource('');
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(
                `/api/shaders/${encodeURIComponent(id)}`,
            );
            if (!response.ok)
                throw new Error(`Could not load ${id} (${response.status}).`);
            setSource(await response.text());
            setError('');
        } catch (loadError) {
            setError(loadError.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadList();
    }, [loadList]);
    useEffect(() => {
        loadSource(selected);
    }, [selected, loadSource]);

    useEffect(() => {
        if (!import.meta.hot) return undefined;
        const onShaderChanged = ({ id }) => {
            if (id === selected) loadSource(id);
        };
        import.meta.hot.on('shader:changed', onShaderChanged);
        import.meta.hot.on('shader:list-changed', loadList);
        return () => {
            import.meta.hot.off('shader:changed', onShaderChanged);
            import.meta.hot.off('shader:list-changed', loadList);
        };
    }, [selected, loadList, loadSource]);

    const toggleFullscreen = async () => {
        const stage = document.querySelector('.viewer-stage');
        if (!document.fullscreenElement) await stage?.requestFullscreen?.();
        else await document.exitFullscreen?.();
    };

    return (
        <main className="app-shell">
            <header className="topbar">
                <a className="brand" href="#">
                    Shader Room
                </a>
                <span className="local-badge">
                    <span /> LOCAL
                </span>
            </header>
            <div className="workspace">
                <aside className="sidebar" aria-label="Shaders">
                    <div className="sidebar-heading">
                        <span>LIBRARY</span>
                        <span className="count">{shaders.length}</span>
                    </div>
                    {shaders.map((shader, index) => (
                        <button
                            key={shader.id}
                            className={
                                selected === shader.id
                                    ? 'shader-item active'
                                    : 'shader-item'
                            }
                            onClick={() => setSelected(shader.id)}
                        >
                            <span className="shader-icon">
                                {index === 0 ? '◈' : '◇'}
                            </span>
                            <span>{shader.name}</span>
                            <span className="item-arrow">›</span>
                        </button>
                    ))}
                    {shaders.length === 0 && (
                        <p className="empty-state">
                            Add a folder with a <code>main.frag</code> file
                            inside <code>shaders/</code>.
                        </p>
                    )}
                </aside>
                <section className="main-panel">
                    <div className="shader-heading">
                        <div>
                            <div className="eyebrow">NOW PLAYING</div>
                            <h1>{selected || 'No shader selected'}</h1>
                        </div>
                        <div className="shader-meta">
                            GLSL ES 3.00 <span>·</span> WebGL 2
                        </div>
                    </div>
                    <div className="viewer-stage">
                        {selected && !loading && (
                            <ShaderCanvas
                                source={source}
                                playing={playing}
                                onError={setError}
                            />
                        )}
                        {loading && (
                            <div className="stage-message">Loading shader…</div>
                        )}
                        {!loading && !selected && (
                            <div className="stage-message">
                                No shaders found. Add one under{' '}
                                <code>shaders/</code>.
                            </div>
                        )}
                        {error && (
                            <div role="alert" className="error-panel">
                                <strong>Shader error</strong>
                                <pre>{error}</pre>
                            </div>
                        )}
                        <div className="stage-corner">LIVE PREVIEW</div>
                    </div>
                    <div className="control-bar">
                        <div className="playback-controls">
                            <button
                                className="icon-button primary"
                                aria-label={playing ? 'Pause' : 'Play'}
                                title={playing ? 'Pause' : 'Play'}
                                onClick={() => setPlaying((state) => !state)}
                            >
                                {playing ? 'Ⅱ' : '▶'}
                            </button>
                            <span className="control-divider" />
                            <span className="status-dot" />
                            <span className="status-text">
                                {playing ? 'RENDERING' : 'PAUSED'}
                            </span>
                        </div>
                        <button
                            className="icon-button"
                            aria-label="Fullscreen"
                            title="Fullscreen"
                            onClick={toggleFullscreen}
                        >
                            ⛶
                        </button>
                    </div>
                    <div className="hint">
                        Edit shader files in <code>shaders/</code> to reload the
                        preview
                    </div>
                </section>
            </div>
        </main>
    );
}
