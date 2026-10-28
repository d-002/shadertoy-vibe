import { compileProgram } from '../lib/shaderSource';

const UNIFORM_NAMES = [
    'iResolution',
    'iTime',
    'iTimeDelta',
    'iFrame',
    'iMouse',
    'iDate',
] as const;

type ShaderUniforms = Record<
    (typeof UNIFORM_NAMES)[number],
    WebGLUniformLocation | null
>;

export interface WebGLRenderer {
    render(
        now: number,
        mouse: readonly [number, number, number, number],
        isPlaying: boolean,
    ): void;
    dispose(): void;
}

export function createWebGLRenderer(
    canvas: HTMLCanvasElement,
    source: string,
): WebGLRenderer {
    const gl = canvas.getContext('webgl2', {
        antialias: false,
        alpha: false,
    });
    if (!gl) {
        throw new Error('WebGL 2 is not available in this browser.');
    }

    const program = compileProgram(gl, source);
    const uniforms = Object.fromEntries(
        UNIFORM_NAMES.map((name) => [
            name,
            gl.getUniformLocation(program, name),
        ]),
    ) as ShaderUniforms;
    let frame = 0;
    let elapsed = 0;
    let previous = 0;
    let playing: boolean | undefined;

    return {
        render(now, mouse, isPlaying) {
            if (playing !== isPlaying) {
                playing = isPlaying;
                previous = now;
            }

            const delta = previous ? Math.min((now - previous) / 1000, 0.1) : 0;
            if (isPlaying) elapsed += delta;

            resizeCanvas(canvas, gl);
            gl.useProgram(program);
            gl.uniform3f(uniforms.iResolution, canvas.width, canvas.height, 1);
            gl.uniform1f(uniforms.iTime, elapsed);
            gl.uniform1f(uniforms.iTimeDelta, isPlaying ? delta : 0);
            gl.uniform1i(uniforms.iFrame, frame++);
            gl.uniform4f(uniforms.iMouse, ...mouse);
            setDateUniform(gl, uniforms.iDate);
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            previous = now;
        },
        dispose() {
            gl.deleteProgram(program);
        },
    };
}

function resizeCanvas(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
}

function setDateUniform(
    gl: WebGL2RenderingContext,
    location: WebGLUniformLocation | null,
) {
    const date = new Date();
    const seconds =
        date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
    gl.uniform4f(
        location,
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        seconds,
    );
}
