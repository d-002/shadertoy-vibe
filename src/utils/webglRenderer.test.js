import { describe, expect, it } from 'vitest';
import { createWebGLRenderer } from './webglRenderer.js';

describe('WebGL renderer', () => {
    it('reports when WebGL 2 is unavailable', () => {
        const canvas = { getContext: () => null };
        expect(() => createWebGLRenderer(canvas, '')).toThrow(
            'WebGL 2 is not available in this browser.',
        );
    });
});
