import { describe, expect, it } from 'vitest';
import { createWebGLRenderer } from './webglRenderer';

describe('WebGL renderer', () => {
    it('reports when WebGL 2 is unavailable', () => {
        const canvas = {
            getContext: () => null,
        } as unknown as HTMLCanvasElement;
        expect(() => createWebGLRenderer(canvas, '')).toThrow(
            'WebGL 2 is not available in this browser.',
        );
    });
});
