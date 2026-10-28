import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

export async function discoverShaders(root) {
  let entries;
  try {
    entries = await readdir(root, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  const shaders = [];
  for (const entry of entries
    .filter((item) => item.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))) {
    const folder = path.join(root, entry.name);
    try {
      const shaderStat = await stat(path.join(folder, 'main.frag'));
      if (shaderStat.isFile())
        shaders.push({ id: entry.name, name: entry.name });
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return shaders;
}

export async function readShader(root, id) {
  if (!/^[\w.-]+$/.test(id) || id === '.' || id === '..') {
    throw new Error('Invalid shader name');
  }
  const file = path.join(root, id, 'main.frag');
  return readFile(file, 'utf8');
}

export function shaderFilesPlugin() {
  let server;
  let root;
  let shadersRoot;

  return {
    name: 'local-shader-files',
    configureServer(devServer) {
      server = devServer;
      root = devServer.config.root;
      shadersRoot = path.resolve(root, 'shaders');
      devServer.watcher.add(shadersRoot);
      devServer.watcher.on('change', onShaderChange);
      devServer.watcher.on('add', onShaderChange);
      devServer.watcher.on('unlink', onShaderChange);

      devServer.middlewares.use(async (req, res, next) => {
        const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
        if (req.method !== 'GET' || !pathname.startsWith('/api/shaders'))
          return next();
        try {
          if (pathname === '/api/shaders') {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(await discoverShaders(shadersRoot)));
            return;
          }
          const match = pathname.match(/^\/api\/shaders\/([^/]+)$/);
          if (!match) {
            res.statusCode = 404;
            res.end('Not found');
            return;
          }
          const id = decodeURIComponent(match[1]);
          const shader = await readShader(shadersRoot, id);
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          res.end(shader);
        } catch (error) {
          res.statusCode = error.code === 'ENOENT' ? 404 : 400;
          res.end(error.message);
        }
      });
    },
  };

  function onShaderChange(file) {
    const relative = path.relative(shadersRoot, file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) return;
    const [id, filename] = relative.split(path.sep);
    if (filename === 'main.frag')
      server.ws.send({ type: 'custom', event: 'shader:changed', data: { id } });
    if (filename === undefined || filename === 'main.frag') {
      server.ws.send({ type: 'custom', event: 'shader:list-changed' });
    }
  }
}
