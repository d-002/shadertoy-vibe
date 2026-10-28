export const vertexSource = `#version 300 es
precision highp float;
const vec2 positions[3] = vec2[3](
    vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0)
);
void main() { gl_Position = vec4(positions[gl_VertexID], 0.0, 1.0); }
`;

export function wrapFragmentSource(source: string): string {
    return `#version 300 es
precision highp float;
uniform vec3 iResolution;
uniform float iTime;
uniform float iTimeDelta;
uniform int iFrame;
uniform vec4 iMouse;
uniform vec4 iDate;
out vec4 _shaderColor;
${source}
void main() { mainImage(_shaderColor, gl_FragCoord.xy); }
`;
}

export function compileProgram(
    gl: WebGL2RenderingContext,
    source: string,
): WebGLProgram {
    const vertex = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    let fragment: WebGLShader;
    try {
        fragment = compileShader(
            gl,
            gl.FRAGMENT_SHADER,
            wrapFragmentSource(source),
        );
    } catch (error) {
        gl.deleteShader(vertex);
        throw error;
    }

    const program = gl.createProgram();
    if (!program) {
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);
        throw new Error('Could not create a WebGL program.');
    }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const message =
            gl.getProgramInfoLog(program) ||
            'Shader program could not be linked.';
        gl.deleteProgram(program);
        throw new Error(message);
    }
    return program;
}

function compileShader(
    gl: WebGL2RenderingContext,
    type: number,
    source: string,
): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Could not create a WebGL shader.');
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message =
            gl.getShaderInfoLog(shader) || 'Shader could not be compiled.';
        gl.deleteShader(shader);
        throw new Error(message);
    }
    return shader;
}
