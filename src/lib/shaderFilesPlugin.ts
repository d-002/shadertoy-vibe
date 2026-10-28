import path from 'node:path';
import { readFile } from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import type { Connect, Plugin, ViteDevServer } from 'vite';
import {
    discoverShaders,
    readShader,
    readShaderProject,
} from './shaderFiles.ts';

function errorCode(error: unknown): string | undefined {
    if (error instanceof Error && 'code' in error) {
        return String(error.code);
    }
    return undefined;
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

export function shaderFilesPlugin(): Plugin {
    let server: ViteDevServer | undefined;
    let shadersRoot = '';
    let assetsRoot = '';

    return {
        name: 'local-shader-files',
        configureServer(devServer) {
            server = devServer;
            shadersRoot = path.resolve(devServer.config.root, 'shaders');
            assetsRoot = path.resolve(devServer.config.root, 'assets');
            devServer.watcher.add(assetsRoot);
            devServer.watcher.add(shadersRoot);
            devServer.watcher.on('change', onShaderChange);
            devServer.watcher.on('add', onShaderChange);
            devServer.watcher.on('unlink', onShaderChange);
            devServer.middlewares.use(shaderApiMiddleware);
        },
    };

    function shaderApiMiddleware(
        request: Connect.IncomingMessage,
        response: ServerResponse,
        next: Connect.NextFunction,
    ) {
        void handleShaderRequest(request, response, next);
    }

    async function handleShaderRequest(
        request: Connect.IncomingMessage,
        response: ServerResponse,
        next: Connect.NextFunction,
    ) {
        const pathname = new URL(request.url ?? '/', 'http://localhost')
            .pathname;
        if (
            request.method !== 'GET' ||
            (!pathname.startsWith('/api/shaders') &&
                !pathname.startsWith('/api/assets/'))
        ) {
            next();
            return;
        }

        try {
            if (pathname.startsWith('/api/assets/')) {
                await handleAssetRequest(pathname, response);
                return;
            }
            if (pathname === '/api/shaders') {
                response.setHeader('Content-Type', 'application/json');
                response.end(
                    JSON.stringify(await discoverShaders(shadersRoot)),
                );
                return;
            }

            const match = pathname.match(
                /^\/api\/shaders\/([^/]+)(\/project)?$/,
            );
            if (!match) {
                response.statusCode = 404;
                response.end('Not found');
                return;
            }

            const id = decodeURIComponent(match[1]);
            if (match[2] === '/project') {
                const project = await readShaderProject(shadersRoot, id);
                response.setHeader('Content-Type', 'application/json');
                response.end(JSON.stringify(project));
                return;
            }
            const source = await readShader(shadersRoot, id);
            response.setHeader('Content-Type', 'text/plain; charset=utf-8');
            response.end(source);
        } catch (error) {
            response.statusCode = errorCode(error) === 'ENOENT' ? 404 : 400;
            response.end(errorMessage(error));
        }
    }

    async function handleAssetRequest(
        pathname: string,
        response: ServerResponse,
    ) {
        const match = pathname.match(/^\/api\/assets\/([^/]+)$/);
        const filename = match ? decodeURIComponent(match[1]) : '';
        if (!/^[\w.-]+\.(png|jpe?g|webp)$/i.test(filename)) {
            response.statusCode = 404;
            response.end('Unsupported or invalid image asset.');
            return;
        }
        const mimeTypes: Record<string, string> = {
            png: 'image/png',
            jpg: 'image/jpeg',
            jpeg: 'image/jpeg',
            webp: 'image/webp',
        };
        const extension = path.extname(filename).slice(1).toLowerCase();
        const contents = await readFile(path.join(assetsRoot, filename));
        response.setHeader('Content-Type', mimeTypes[extension]!);
        response.setHeader('Cache-Control', 'no-store');
        response.end(contents);
    }

    function onShaderChange(file: string) {
        if (!server) return;
        const assetRelative = path.relative(assetsRoot, file);
        if (
            !assetRelative.startsWith('..') &&
            !path.isAbsolute(assetRelative)
        ) {
            const assetName = path.basename(file);
            if (/^[\w.-]+\.(png|jpe?g|webp)$/i.test(assetName)) {
                server.ws.send({
                    type: 'custom',
                    event: 'assets:changed',
                    data: { file: assetName },
                });
            }
            return;
        }
        const relative = path.relative(shadersRoot, file);
        if (relative.startsWith('..') || path.isAbsolute(relative)) return;

        const [id, filename] = relative.split(path.sep);
        if (filename === 'shader.json' || filename?.endsWith('.frag')) {
            server.ws.send({
                type: 'custom',
                event: 'shader:changed',
                data: { id },
            });
        }
        if (
            filename === undefined ||
            filename === 'main.frag' ||
            filename === 'shader.json'
        ) {
            server.ws.send({ type: 'custom', event: 'shader:list-changed' });
        }
    }
}
