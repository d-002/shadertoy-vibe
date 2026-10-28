import { describe, expect, it, vi } from 'vitest';
import type { ShaderProject } from '../types/shader';
import { createWebGLRenderer } from './webglRenderer';

function createFakeContext() {
    let currentUnit = 0;
    const boundTextures = new Map<number, WebGLTexture | null>();
    const programs: WebGLProgram[] = [];
    const draws: {
        program: WebGLProgram | null;
        textures: Map<number, WebGLTexture | null>;
    }[] = [];
    let resourceId = 0;
    const gl = {
        VERTEX_SHADER: 1,
        FRAGMENT_SHADER: 2,
        COMPILE_STATUS: 3,
        LINK_STATUS: 4,
        FRAMEBUFFER: 5,
        COLOR_ATTACHMENT0: 6,
        TEXTURE_2D: 7,
        TEXTURE_MIN_FILTER: 8,
        TEXTURE_MAG_FILTER: 9,
        TEXTURE_WRAP_S: 10,
        TEXTURE_WRAP_T: 11,
        TEXTURE0: 100,
        TEXTURE1: 101,
        TEXTURE2: 102,
        TEXTURE3: 103,
        NEAREST: 12,
        LINEAR: 13,
        CLAMP_TO_EDGE: 14,
        RGBA8: 15,
        RGBA: 16,
        UNSIGNED_BYTE: 17,
        FRAMEBUFFER_COMPLETE: 18,
        TRIANGLES: 19,
        createShader: vi.fn((type: number) => ({ type, id: ++resourceId })),
        shaderSource: vi.fn(),
        compileShader: vi.fn(),
        getShaderParameter: vi.fn(() => true),
        getShaderInfoLog: vi.fn(() => ''),
        deleteShader: vi.fn(),
        createProgram: vi.fn(() => {
            const program = { id: ++resourceId } as unknown as WebGLProgram;
            programs.push(program);
            return program;
        }),
        attachShader: vi.fn(),
        linkProgram: vi.fn(),
        getProgramParameter: vi.fn(() => true),
        getProgramInfoLog: vi.fn(() => ''),
        deleteProgram: vi.fn(),
        getUniformLocation: vi.fn(
            (_program: WebGLProgram, name: string) =>
                ({
                    name,
                }) as unknown as WebGLUniformLocation,
        ),
        createTexture: vi.fn(() => ({ id: ++resourceId }) as WebGLTexture),
        deleteTexture: vi.fn(),
        bindTexture: vi.fn((_target: number, texture: WebGLTexture | null) => {
            boundTextures.set(currentUnit, texture);
        }),
        texParameteri: vi.fn(),
        texImage2D: vi.fn(),
        texSubImage2D: vi.fn(),
        createFramebuffer: vi.fn(
            () => ({ id: ++resourceId }) as WebGLFramebuffer,
        ),
        deleteFramebuffer: vi.fn(),
        bindFramebuffer: vi.fn(),
        framebufferTexture2D: vi.fn(),
        checkFramebufferStatus: vi.fn(() => 18),
        viewport: vi.fn(),
        useProgram: vi.fn(),
        uniform3f: vi.fn(),
        uniform1f: vi.fn(),
        uniform1i: vi.fn(),
        uniform4f: vi.fn(),
        uniform3fv: vi.fn(),
        activeTexture: vi.fn((unit: number) => {
            currentUnit = unit;
        }),
        drawArrays: vi.fn(() => {
            draws.push({
                program:
                    (gl.useProgram.mock.calls.at(-1)?.[0] as WebGLProgram) ??
                    null,
                textures: new Map(boundTextures),
            });
        }),
    };
    return { gl, programs, draws };
}

const project: ShaderProject = {
    id: 'feedback',
    passes: [
        {
            id: 'BufferA',
            file: 'buffer-a.frag',
            source: 'void mainImage(out vec4 c, in vec2 p) { c = vec4(1.0); }',
            inputs: [
                { channel: 0, source: 'BufferA', history: true },
                { channel: 1, source: 'Keyboard' },
            ],
        },
        {
            id: 'Image',
            file: 'image.frag',
            source: 'void mainImage(out vec4 c, in vec2 p) { c = vec4(1.0); }',
            inputs: [{ channel: 0, source: 'BufferA' }],
        },
    ],
};

function createCanvas(gl: WebGL2RenderingContext): HTMLCanvasElement {
    return {
        width: 8,
        height: 4,
        getContext: () => gl,
        getBoundingClientRect: () => ({ width: 8, height: 4 }),
    } as unknown as HTMLCanvasElement;
}

describe('WebGL renderer', () => {
    it('reports when WebGL 2 is unavailable', () => {
        const canvas = {
            getContext: () => null,
        } as unknown as HTMLCanvasElement;
        expect(() => createWebGLRenderer(canvas, project)).toThrow(
            'WebGL 2 is not available in this browser.',
        );
    });

    it('renders ordered passes with ping-pong feedback', () => {
        const { gl, programs, draws } = createFakeContext();
        const renderer = createWebGLRenderer(
            createCanvas(gl as unknown as WebGL2RenderingContext),
            project,
        );
        const keyboard = {
            down: new Set<number>(),
            pressed: new Set<number>(),
            toggled: new Set<number>(),
        };
        renderer.render(1000, [0, 0, 0, 0], false, keyboard);
        renderer.render(1016, [0, 0, 0, 0], false, keyboard);

        expect(draws.map((draw) => draw.program)).toEqual([
            ...programs.slice(-2),
            ...programs.slice(-2),
        ]);
        expect(draws[0]?.textures.get(gl.TEXTURE0)).toBe(
            gl.createTexture.mock.results[0]?.value,
        );
        expect(draws[0]?.textures.get(gl.TEXTURE1)).toBe(
            gl.createTexture.mock.results[2]?.value,
        );
        expect(draws[1]?.textures.get(gl.TEXTURE0)).toBe(
            gl.createTexture.mock.results[1]?.value,
        );
        expect(draws[2]?.textures.get(gl.TEXTURE0)).toBe(
            gl.createTexture.mock.results[1]?.value,
        );
        expect(draws[3]?.textures.get(gl.TEXTURE0)).toBe(
            gl.createTexture.mock.results[0]?.value,
        );
        renderer.dispose();
    });
});
