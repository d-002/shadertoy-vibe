# Local Shader Viewer

A local Shadertoy-style shader viewer. Shader code lives in local files in the
documented layout; file editing is left to you, and there is no in-browser code
editor.

## Local workflow

Run `npm install`, then `npm run dev` and open the local URL printed by Vite
(normally `http://localhost:5173`). Put each shader in its own folder under
`shaders/`. The viewer discovers those folders and runs the selected shader.
Edit and save its files with your preferred tools; the local Vite plugin watches
them and reloads the shader in the viewer.

Start with a single `main.frag` file. It uses GLSL ES 3.00 and the
Shadertoy-style `mainImage(out vec4 fragColor, in vec2 fragCoord)` entry point.
The viewer supplies `iResolution`, `iTime`, `iTimeDelta`, `iFrame`, `iMouse`,
and `iDate` uniforms. Compile errors are shown in the viewer.

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    fragColor = vec4(uv, 0.5 + 0.5 * sin(iTime), 1.0);
}
```

For multi-pass shaders, add a `shader.json` manifest beside the GLSL files.
Declare passes in render order, using `BufferA` through `BufferD` for buffer IDs
and `Image` for the final output. Each pass can bind up to four inputs
(`iChannel0`–`iChannel3`) to declared buffers; buffer inputs can read the prior
frame for feedback. The viewer also provides mouse state and a Shadertoy-style
keyboard texture. The manifest is configuration only: all shader code remains in
`.frag` files.

```json
{
    "passes": [
        { "id": "BufferA", "file": "buffer-a.frag", "inputs": [] },
        {
            "id": "Image",
            "file": "image.frag",
            "inputs": [{ "channel": 0, "source": "BufferA" }]
        }
    ]
}
```

The initial viewer will focus on single-pass files; manifest-based buffers and
interactive inputs are planned follow-up features.

## Project checks

- `npm run lint` runs ESLint's recommended JavaScript rules, React Hooks checks,
  and an 80-column maximum line check.
- `npm run format` formats supported source, config, and Markdown files with
  Prettier at an 80-column print width.
- `npm run format:check` checks that formatting is applied.
- `npm test` runs the Vitest suite.
- `npm run build` creates the production frontend build.
- `npm run check` runs lint, formatting check, tests, and production build.
