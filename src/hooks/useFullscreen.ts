import { useCallback, type RefObject } from 'react';

export function useFullscreen(targetRef: RefObject<HTMLElement | null>) {
    return useCallback(async () => {
        if (document.fullscreenElement) {
            await document.exitFullscreen();
            return;
        }
        await targetRef.current?.requestFullscreen();
    }, [targetRef]);
}
