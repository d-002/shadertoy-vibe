import { compileProgram } from '../lib/shaderSource.js';

const UNIFORM_NAMES = [
    'iResolution',
    'iTime',
    'iTimeDelta',
    'iFrame',
    'iMouse',
    'iDate',
];

export function createWebGLRenderer(canvas, source) {
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
    );
    let frame = 0;
    let elapsed = 0;
    let previous = 0;
    let playing;

    return {
        render(now, mouse, isPlaying) {
            if (playing !== isPlaying) {
                playing = isPlaying;
                previous = now;
            }

            const delta = previous ? Math.min((now - previous) / 1000, 0.1) : 0;
            if (isPlaying) elapsed += delta;

            const rect = canvas.getBoundingClientRect();
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const width = Math.max(1, Math.floor(rect.width * dpr));
            const height = Math.max(1, Math.floor(rect.height * dpr));
            if (canvas.width !== width || canvas.height !== height) {
                canvas.width = width;
                canvas.height = height;
            }

            gl.viewport(0, 0, width, height);
            gl.useProgram(program);
            gl.uniform3f(uniforms.iResolution, width, height, 1);
            gl.uniform1f(uniforms.iTime, elapsed);
            gl.uniform1f(uniforms.iTimeDelta, isPlaying ? delta : 0);
            gl.uniform1i(uniforms.iFrame, frame++);
            gl.uniform4f(uniforms.iMouse, ...mouse);

            const date = new Date();
            const seconds =
                date.getHours() * 3600 +
                date.getMinutes() * 60 +
                date.getSeconds();
            gl.uniform4f(
                uniforms.iDate,
                date.getFullYear(),
                date.getMonth() + 1,
                date.getDate(),
                seconds,
            );
            gl.drawArrays(gl.TRIANGLES, 0, 3);
            previous = now;
        },
        dispose() {
            gl.deleteProgram(program);
        },
    };
}
