import { act, fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useKeyboardInput } from './useKeyboardInput';

describe('keyboard input hook', () => {
    it('tracks held, one-frame pressed, and toggled key states', () => {
        const onInput = vi.fn();
        const { result } = renderHook(() => useKeyboardInput(onInput));

        act(() => fireEvent.keyDown(window, { keyCode: 65 }));
        expect(result.current.stateRef.current.down.has(65)).toBe(true);
        expect(result.current.stateRef.current.pressed.has(65)).toBe(true);
        expect(result.current.stateRef.current.toggled.has(65)).toBe(true);

        act(() => fireEvent.keyDown(window, { keyCode: 65, repeat: true }));
        expect(result.current.stateRef.current.toggled.has(65)).toBe(true);

        act(() => result.current.clearPressed());
        expect(result.current.stateRef.current.pressed.has(65)).toBe(false);
        act(() => fireEvent.keyUp(window, { keyCode: 65 }));
        expect(result.current.stateRef.current.down.has(65)).toBe(false);

        act(() => fireEvent.keyDown(window, { keyCode: 65 }));
        expect(result.current.stateRef.current.toggled.has(65)).toBe(false);
        expect(onInput).toHaveBeenCalled();
    });
});
