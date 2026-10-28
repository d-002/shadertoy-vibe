import { useCallback, useEffect, useRef } from 'react';

interface MutableKeyboardState {
    down: Set<number>;
    pressed: Set<number>;
    toggled: Set<number>;
}

export function useKeyboardInput(onInput: () => void) {
    const stateRef = useRef<MutableKeyboardState>({
        down: new Set<number>(),
        pressed: new Set<number>(),
        toggled: new Set<number>(),
    });
    const onInputRef = useRef(onInput);

    useEffect(() => {
        onInputRef.current = onInput;
    }, [onInput]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (isEditableTarget(event.target)) return;
            const key = event.keyCode;
            if (key < 0 || key > 255) return;

            const state = stateRef.current;
            if (!state.down.has(key)) {
                state.down.add(key);
                state.pressed.add(key);
                if (state.toggled.has(key)) state.toggled.delete(key);
                else state.toggled.add(key);
            }
            onInputRef.current();
        };
        const handleKeyUp = (event: KeyboardEvent) => {
            stateRef.current.down.delete(event.keyCode);
            onInputRef.current();
        };
        const handleBlur = () => {
            stateRef.current.down.clear();
            onInputRef.current();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleBlur);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleBlur);
        };
    }, []);

    const clearPressed = useCallback(() => {
        stateRef.current.pressed.clear();
    }, []);

    return { stateRef, clearPressed };
}

function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    return (
        target.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    );
}
