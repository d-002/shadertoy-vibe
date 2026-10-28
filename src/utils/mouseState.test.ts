import { describe, expect, it } from 'vitest';
import { updateMouseUniform, type MousePointerState } from './mouseState';

describe('mouse uniform state', () => {
    it('reports pixel position and click point across release', () => {
        const pointer: MousePointerState = {
            down: false,
            hasClick: false,
            clickX: 0,
            clickY: 0,
        };
        const rect = { left: 10, top: 20, width: 100, height: 50 };
        const pressed = updateMouseUniform(
            pointer,
            'down',
            20,
            30,
            rect,
            300,
            150,
        );
        const dragged = updateMouseUniform(
            pointer,
            'move',
            25,
            35,
            rect,
            300,
            150,
        );
        const released = updateMouseUniform(
            pointer,
            'up',
            25,
            35,
            rect,
            300,
            150,
        );

        expect(pressed).toEqual([30, 120, 30, 120]);
        expect(dragged).toEqual([45, 105, 30, 120]);
        expect(released).toEqual([45, 105, -30, -120]);
    });
});
