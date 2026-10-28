import path from 'node:path';
import type { ServerResponse } from 'node:http';
import type { Connect, Plugin, ViteDevServer } from 'vite';
import { discoverShaders, readShader } from './shaderFiles.ts';

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

    return {
        name: 'local-shader-files',
        configureServer(devServer) {
            server = devServer;
            shadersRoot = path.resolve(devServer.config.root, 'shaders');
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
        if (request.method !== 'GET' || !pathname.startsWith('/api/shaders')) {
            next();
            return;
        }

        try {
            if (pathname === '/api/shaders') {
                response.setHeader('Content-Type', 'application/json');
                response.end(
                    JSON.stringify(await discoverShaders(shadersRoot)),
                );
                return;
            }

            const match = pathname.match(/^\/api\/shaders\/([^/]+)$/);
            if (!match) {
                response.statusCode = 404;
                response.end('Not found');
                return;
            }

            const id = decodeURIComponent(match[1]);
            const shader = await readShader(shadersRoot, id);
            response.setHeader('Content-Type', 'text/plain; charset=utf-8');
            response.end(shader);
        } catch (error) {
            response.statusCode = errorCode(error) === 'ENOENT' ? 404 : 400;
            response.end(errorMessage(error));
        }
    }

    function onShaderChange(file: string) {
        if (!server) return;
        const relative = path.relative(shadersRoot, file);
        if (relative.startsWith('..') || path.isAbsolute(relative)) return;

        const [id, filename] = relative.split(path.sep);
        if (filename === 'main.frag') {
            server.ws.send({
                type: 'custom',
                event: 'shader:changed',
                data: { id },
            });
        }
        if (filename === undefined || filename === 'main.frag') {
            server.ws.send({ type: 'custom', event: 'shader:list-changed' });
        }
    }
}
