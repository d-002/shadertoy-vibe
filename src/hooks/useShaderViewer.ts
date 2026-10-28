import { useCallback, useEffect, useState } from 'react';
import type { ShaderInfo } from '../types/shader';

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

export function useShaderViewer() {
    const [shaders, setShaders] = useState<ShaderInfo[]>([]);
    const [selectedId, setSelectedId] = useState('');
    const [source, setSource] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    const loadShaders = useCallback(async () => {
        try {
            const response = await fetch('/api/shaders');
            if (!response.ok) {
                throw new Error(`Could not load shaders (${response.status}).`);
            }
            const items = (await response.json()) as ShaderInfo[];
            setShaders(items);
            setSelectedId((current) =>
                items.some((item) => item.id === current)
                    ? current
                    : (items[0]?.id ?? ''),
            );
        } catch (loadError) {
            setError(errorMessage(loadError));
        }
    }, []);

    const loadSource = useCallback(async (id: string) => {
        if (!id) {
            setSource('');
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `/api/shaders/${encodeURIComponent(id)}`,
            );
            if (!response.ok) {
                throw new Error(`Could not load ${id} (${response.status}).`);
            }
            setSource(await response.text());
            setError('');
        } catch (loadError) {
            setError(errorMessage(loadError));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadShaders();
    }, [loadShaders]);

    useEffect(() => {
        void loadSource(selectedId);
    }, [selectedId, loadSource]);

    useEffect(() => {
        if (!import.meta.hot) return undefined;

        const onShaderChanged = (data: { id: string }) => {
            if (data.id === selectedId) void loadSource(data.id);
        };

        import.meta.hot.on('shader:changed', onShaderChanged);
        import.meta.hot.on('shader:list-changed', loadShaders);
        return () => {
            import.meta.hot?.off('shader:changed', onShaderChanged);
            import.meta.hot?.off('shader:list-changed', loadShaders);
        };
    }, [selectedId, loadShaders, loadSource]);

    const selectShader = useCallback((id: string) => {
        setSelectedId(id);
    }, []);

    const selectedName =
        shaders.find((shader) => shader.id === selectedId)?.name ?? '';

    return {
        shaders,
        selectedId,
        selectedName,
        source,
        loading,
        error,
        setError,
        selectShader,
    };
}
