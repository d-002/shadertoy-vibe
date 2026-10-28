import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { discoverShaders, readShader } from './shaderFiles.js';

let temp;
afterEach(async () => { if (temp) await rm(temp, { recursive: true, force: true }); temp = undefined; });

describe('shader file discovery', () => {
  it('returns shader folders with main.frag in stable alphabetical order', async () => {
    temp = await mkdtemp(path.join(os.tmpdir(), 'shader-viewer-'));
    await mkdir(path.join(temp, 'zeta'));
    await mkdir(path.join(temp, 'alpha'));
    await mkdir(path.join(temp, 'not-a-shader'));
    await writeFile(path.join(temp, 'zeta', 'main.frag'), 'void mainImage() {}');
    await writeFile(path.join(temp, 'alpha', 'main.frag'), 'void mainImage() {}');
    expect(await discoverShaders(temp)).toEqual([{ id: 'alpha', name: 'alpha' }, { id: 'zeta', name: 'zeta' }]);
  });

  it('returns an empty list when the shader directory does not exist', async () => {
    expect(await discoverShaders('/path/that/does/not/exist')).toEqual([]);
  });

  it('reads the main fragment shader and rejects unsafe names', async () => {
    temp = await mkdtemp(path.join(os.tmpdir(), 'shader-viewer-'));
    await mkdir(path.join(temp, 'sample'));
    await writeFile(path.join(temp, 'sample', 'main.frag'), 'shader source');
    await expect(readShader(temp, 'sample')).resolves.toBe('shader source');
    await expect(readShader(temp, '../package')).rejects.toThrow('Invalid shader name');
  });
});
