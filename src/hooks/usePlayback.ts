import { useCallback, useEffect, useRef, useState } from 'react';

export function usePlayback(active = true) {
    const [playing, setPlaying] = useState(true);
    const [elapsed, setElapsed] = useState(0);
    const [resetKey, setResetKey] = useState(0);
    const elapsedRef = useRef(0);
    const runningSinceRef = useRef<number | null>(null);

    useEffect(() => {
        if (!playing || !active) return undefined;

        runningSinceRef.current = performance.now();
        const interval = window.setInterval(() => {
            const startedAt = runningSinceRef.current;
            if (startedAt === null) return;
            setElapsed(
                elapsedRef.current + (performance.now() - startedAt) / 1000,
            );
        }, 100);

        return () => {
            window.clearInterval(interval);
            const startedAt = runningSinceRef.current;
            if (startedAt !== null) {
                elapsedRef.current += (performance.now() - startedAt) / 1000;
                runningSinceRef.current = null;
                setElapsed(elapsedRef.current);
            }
        };
    }, [playing, active]);

    const toggle = useCallback(() => {
        setPlaying((current) => !current);
    }, []);

    const reset = useCallback(() => {
        elapsedRef.current = 0;
        runningSinceRef.current = playing && active ? performance.now() : null;
        setElapsed(0);
        setResetKey((current) => current + 1);
    }, [playing, active]);

    return { playing, toggle, elapsed, reset, resetKey };
}
