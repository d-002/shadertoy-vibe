import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { ShaderInfo } from '../types/shader.ts';

function errorCode(error: unknown): string | undefined {
    if (error instanceof Error && 'code' in error) {
        return String(error.code);
    }
    return undefined;
}

export async function discoverShaders(root: string): Promise<ShaderInfo[]> {
    let entries;
    try {
        entries = await readdir(root, { withFileTypes: true });
    } catch (error) {
        if (errorCode(error) === 'ENOENT') return [];
        throw error;
    }

    const shaders: ShaderInfo[] = [];
    const folders = entries
        .filter((entry) => entry.isDirectory())
        .sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of folders) {
        const folder = path.join(root, entry.name);
        try {
            const shaderStat = await stat(path.join(folder, 'main.frag'));
            if (shaderStat.isFile()) {
                shaders.push({ id: entry.name, name: entry.name });
            }
        } catch (error) {
            if (errorCode(error) !== 'ENOENT') throw error;
        }
    }
    return shaders;
}

export async function readShader(root: string, id: string): Promise<string> {
    if (!/^[\w.-]+$/.test(id) || id === '.' || id === '..') {
        throw new Error('Invalid shader name');
    }
    const file = path.join(root, id, 'main.frag');
    return readFile(file, 'utf8');
}
