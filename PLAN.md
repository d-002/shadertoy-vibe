# Project checkpoint

**You are here: local image texture inputs are complete; next is deployment
planning.**

## Agreed direction

- Local-only Shadertoy-style viewer; no authentication and no web editor.
- React frontend, with tests.
- Shader source is local files edited externally within the documented layout,
  preferably with hot reload.
- Vite dev server will serve the app and provide local shader discovery/file
  watching through a plugin; Chokidar will watch the shader tree and Vite's
  websocket will notify the frontend.
- Start with single-pass GLSL, then add fixed Shadertoy-like channels, buffers,
  mouse and keyboard input.
- Buffer graph is declarative JSON; runtime keeps a fixed set of channel IDs and
  familiar uniforms.

## Current local workflow and shader format

- Run `npm install`, then `npm run dev`; open the URL printed by Vite.
- Add a folder per shader under `shaders/`, starting with `main.frag`.
- Use GLSL ES 3.00 and `mainImage(out vec4 fragColor, in vec2 fragCoord)`;
  viewer uniforms include resolution, time, frame, mouse and date.
- Optional `shader.json` lists passes in render order. `BufferA`–`BufferD` are
  buffer pass IDs, `Image` is the final pass, and each pass has up to four
  inputs mapped to `iChannel0`–`iChannel3`. Inputs can reference buffers, the
  keyboard texture, or local images in `assets/`. Buffers can be sampled from
  the previous frame for feedback. Mouse is a uniform; keyboard state is exposed
  as a Shadertoy-style texture.
- Source files remain the editing surface; JSON only describes pass/input
  wiring.

## Checklist

- [x] Read global `AGENTS.md` and verify `$HOME/persistent` is empty.
- [x] Initialize Git repository.
- [x] Document the workflow and initial shader format in `README.md`.
- [x] Build the single-pass viewer and test setup.
- [x] Split the viewer UI into components and migrate application source to
      TypeScript.
- [x] Add buffer passes and interactive keyboard/mouse inputs.
- [x] Add an example that demonstrates buffer feedback and keyboard/mouse input.
- [x] Add local PNG, JPEG, and WebP channel inputs and document the asset
      layout.
- [x] Show shader API validation details in the viewer.
- [x] Add a preview timer with shader reset controls.
- [x] Add an image input example using the sample asset.
- [ ] Plan and implement deployment (for example, Cloudflare Pages); decide
      deployment details later.
- [ ] Remove this temporary checkpoint when the project work is complete.
