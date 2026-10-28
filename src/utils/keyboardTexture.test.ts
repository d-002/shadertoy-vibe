import { describe, expect, it } from 'vitest';
import { createKeyboardPixels, type KeyboardState } from './keyboardTexture';

describe('keyboard texture pixels', () => {
    it('encodes down, pressed, and toggled state in separate rows', () => {
        const state: KeyboardState = {
            down: new Set([65]),
            pressed: new Set([65, 66]),
            toggled: new Set([66]),
        };
        const pixels = createKeyboardPixels(state);
        const red = (key: number, row: number) => pixels[(row * 256 + key) * 4];

        expect(red(65, 0)).toBe(255);
        expect(red(65, 1)).toBe(255);
        expect(red(65, 2)).toBe(0);
        expect(red(66, 0)).toBe(0);
        expect(red(66, 1)).toBe(255);
        expect(red(66, 2)).toBe(255);
    });
});
