import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type {
    ShaderInfo,
    ShaderManifest,
    ShaderProject,
} from '../types/shader.ts';
import { parseShaderManifest } from './shaderManifest.ts';

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

    const folders = entries
        .filter((entry) => entry.isDirectory())
        .sort((left, right) => left.name.localeCompare(right.name));
    const shaders: ShaderInfo[] = [];

    for (const entry of folders) {
        const folder = path.join(root, entry.name);
        const [mainShader, manifest] = await Promise.all([
            fileExists(path.join(folder, 'main.frag')),
            fileExists(path.join(folder, 'shader.json')),
        ]);
        if (mainShader || manifest) {
            shaders.push({ id: entry.name, name: entry.name });
        }
    }
    return shaders;
}

export async function readShader(root: string, id: string): Promise<string> {
    validateShaderId(id);
    return readFile(path.join(root, id, 'main.frag'), 'utf8');
}

export async function readShaderProject(
    root: string,
    id: string,
): Promise<ShaderProject> {
    validateShaderId(id);
    const folder = path.join(root, id);
    let manifest: ShaderManifest;
    try {
        const text = await readFile(path.join(folder, 'shader.json'), 'utf8');
        manifest = parseShaderManifest(JSON.parse(text) as unknown);
    } catch (error) {
        if (errorCode(error) !== 'ENOENT') throw error;
        manifest = {
            passes: [{ id: 'Image' as const, file: 'main.frag', inputs: [] }],
        };
    }

    const passes = await Promise.all(
        manifest.passes.map(async (pass) => ({
            ...pass,
            source: await readFile(path.join(folder, pass.file), 'utf8'),
        })),
    );
    return { id, passes };
}

function validateShaderId(id: string) {
    if (!/^[\w.-]+$/.test(id) || id === '.' || id === '..') {
        throw new Error('Invalid shader name');
    }
}

async function fileExists(file: string): Promise<boolean> {
    try {
        return (await stat(file)).isFile();
    } catch (error) {
        if (errorCode(error) === 'ENOENT') return false;
        throw error;
    }
}
