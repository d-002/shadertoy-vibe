import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePlayback } from './usePlayback';

afterEach(() => {
    vi.useRealTimers();
});

describe('playback timer', () => {
    it('updates at 10 Hz, pauses, and resets', async () => {
        vi.useFakeTimers();
        const { result } = renderHook(() => usePlayback());

        await act(async () => {
            await vi.advanceTimersByTimeAsync(300);
        });
        expect(result.current.elapsed).toBeCloseTo(0.3, 1);

        act(() => result.current.reset());
        expect(result.current.elapsed).toBe(0);
        expect(result.current.resetKey).toBe(1);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(200);
        });
        act(() => result.current.toggle());
        const elapsedWhenPaused = result.current.elapsed;
        await act(async () => {
            await vi.advanceTimersByTimeAsync(500);
        });
        expect(result.current.elapsed).toBe(elapsedWhenPaused);
    });
});
