import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { discoverShaders, readShader, readShaderProject } from './shaderFiles';

let temp: string | undefined;
afterEach(async () => {
    if (temp) await rm(temp, { recursive: true, force: true });
    temp = undefined;
});

describe('shader file discovery', () => {
    it('lists shader folders alphabetically', async () => {
        temp = await mkdtemp(path.join(os.tmpdir(), 'shader-viewer-'));
        await mkdir(path.join(temp, 'zeta'));
        await mkdir(path.join(temp, 'alpha'));
        await mkdir(path.join(temp, 'not-a-shader'));
        await writeFile(
            path.join(temp, 'zeta', 'main.frag'),
            'void mainImage() {}',
        );
        await writeFile(
            path.join(temp, 'alpha', 'main.frag'),
            'void mainImage() {}',
        );
        expect(await discoverShaders(temp)).toEqual([
            { id: 'alpha', name: 'alpha' },
            { id: 'zeta', name: 'zeta' },
        ]);
    });

    it('returns empty when the shader directory is absent', async () => {
        expect(await discoverShaders('/path/that/does/not/exist')).toEqual([]);
    });

    it('loads every source listed in a buffer manifest', async () => {
        temp = await mkdtemp(path.join(os.tmpdir(), 'shader-viewer-'));
        const folder = path.join(temp, 'multi-pass');
        await mkdir(folder);
        await writeFile(
            path.join(folder, 'shader.json'),
            JSON.stringify({
                passes: [
                    { id: 'BufferA', file: 'buffer-a.frag', inputs: [] },
                    { id: 'Image', file: 'image.frag', inputs: [] },
                ],
            }),
        );
        await writeFile(path.join(folder, 'buffer-a.frag'), 'buffer source');
        await writeFile(path.join(folder, 'image.frag'), 'image source');

        await expect(discoverShaders(temp)).resolves.toEqual([
            { id: 'multi-pass', name: 'multi-pass' },
        ]);
        await expect(
            readShaderProject(temp, 'multi-pass'),
        ).resolves.toMatchObject({
            passes: [
                { id: 'BufferA', source: 'buffer source' },
                { id: 'Image', source: 'image source' },
            ],
        });
    });

    it('reads the main fragment shader and rejects unsafe names', async () => {
        temp = await mkdtemp(path.join(os.tmpdir(), 'shader-viewer-'));
        await mkdir(path.join(temp, 'sample'));
        await writeFile(
            path.join(temp, 'sample', 'main.frag'),
            'shader source',
        );
        await expect(readShader(temp, 'sample')).resolves.toBe('shader source');
        await expect(readShader(temp, '../package')).rejects.toThrow(
            'Invalid shader name',
        );
    });
});
