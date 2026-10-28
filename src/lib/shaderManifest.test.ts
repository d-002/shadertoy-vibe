import { describe, expect, it } from 'vitest';
import { parseShaderManifest } from './shaderManifest';

describe('shader manifest', () => {
    it('allows history feedback and keyboard channel inputs', () => {
        const manifest = parseShaderManifest({
            passes: [
                {
                    id: 'BufferA',
                    file: 'buffer-a.frag',
                    inputs: [
                        { channel: 0, source: 'BufferA', history: true },
                        { channel: 1, source: 'Keyboard' },
                    ],
                },
                {
                    id: 'Image',
                    file: 'image.frag',
                    inputs: [{ channel: 0, source: 'BufferA' }],
                },
            ],
        });
        expect(manifest.passes).toHaveLength(2);
        expect(manifest.passes[0]?.inputs[0]?.history).toBe(true);
    });

    it('requires ordinary buffer inputs to refer to an earlier pass', () => {
        expect(() =>
            parseShaderManifest({
                passes: [
                    {
                        id: 'BufferA',
                        file: 'a.frag',
                        inputs: [{ channel: 0, source: 'BufferB' }],
                    },
                    { id: 'BufferB', file: 'b.frag' },
                    { id: 'Image', file: 'image.frag' },
                ],
            }),
        ).toThrow('must read earlier buffers');
    });

    it('rejects duplicate channel bindings and unsafe file paths', () => {
        expect(() =>
            parseShaderManifest({
                passes: [
                    {
                        id: 'Image',
                        file: '../outside.frag',
                        inputs: [],
                    },
                ],
            }),
        ).toThrow('local .frag file');
        expect(() =>
            parseShaderManifest({
                passes: [
                    {
                        id: 'Image',
                        file: 'image.frag',
                        inputs: [
                            { channel: 0, source: 'Keyboard' },
                            { channel: 0, source: 'Keyboard' },
                        ],
                    },
                ],
            }),
        ).toThrow('cannot bind a channel more than once');
    });
});
