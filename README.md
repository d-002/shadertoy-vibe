# Local Shader Viewer

A local Shadertoy-style shader viewer built with React and TypeScript. Shader
code lives in local files in the documented layout; file editing is left to you,
and there is no in-browser code editor.

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

The included `shaders/example-basic/` folder demonstrates a single-pass shader.
`shaders/example-buffers/` demonstrates frame feedback, the keyboard texture,
and the mouse uniform. Hold the mouse button over the preview to paint; press C
to cycle the brush through red, green, and blue.

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    fragColor = vec4(uv, 0.5 + 0.5 * sin(iTime), 1.0);
}
```

For multi-pass shaders, add a `shader.json` manifest beside the GLSL files.
Declare buffer passes (`BufferA` through `BufferD`) before the final `Image`
pass. Each pass binds up to four channels (`iChannel0`–`iChannel3`) to an
earlier buffer, the built-in `Keyboard` texture, or an image `Texture`. To use
an image, put a PNG, JPEG, or WebP file directly in `assets/`, then reference
its filename in the input manifest. For example,
`"source": "Texture", "file": "sample.jpg"` binds `assets/sample.jpg` to that
channel. The optional `"history": true` flag is this viewer's manifest syntax
for reading a buffer's previous-frame image (feedback); ordinary buffer links
read the current frame. Shadertoy expresses feedback through buffer channel
wiring rather than this manifest flag. Image textures are loaded as 2D channels
and report their dimensions through `iChannelResolution`; cubemap channels are
not supported yet. Shader files remain individual `.frag` files.

```json
{
    "passes": [
        {
            "id": "BufferA",
            "file": "buffer-a.frag",
            "inputs": [
                { "channel": 0, "source": "BufferA", "history": true },
                { "channel": 1, "source": "Keyboard" }
            ]
        },
        {
            "id": "Image",
            "file": "image.frag",
            "inputs": [{ "channel": 0, "source": "BufferA" }]
        }
    ]
}
```

The `Keyboard` texture has 256 columns (key codes) and three rows: down, pressed
for one frame, and toggled. For example,
`texelFetch(iChannel1, ivec2(32, 0), 0).r` reads whether Space is held when
`Keyboard` is bound to channel 1. `iMouse` contains the pointer position in
pixels in `.xy`; `.zw` stores the click position, positive while held and
negative after release.

## Project checks

- `npm run lint` runs ESLint's recommended JavaScript/TypeScript rules and React
  Hooks checks, and an 80-column maximum line check.
- `npm run format` formats supported source, config, and Markdown files with
  Prettier at an 80-column print width.
- `npm run format:check` checks that formatting is applied.
- `npm test` runs the Vitest suite.
- `npm run build` typechecks the TypeScript and creates the production build.
- `npm run check` runs lint, formatting check, tests, and production build.
