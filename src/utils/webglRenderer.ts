import type {
    BufferId,
    ShaderInput,
    ShaderPassSource,
    ShaderProject,
} from '../types/shader';
import { compileProgram } from '../lib/shaderSource';
import { updateKeyboardTexture, type KeyboardState } from './keyboardTexture';

const CHANNEL_COUNT = 4;
interface PassUniforms {
    resolution: WebGLUniformLocation | null;
    time: WebGLUniformLocation | null;
    timeDelta: WebGLUniformLocation | null;
    frame: WebGLUniformLocation | null;
    mouse: WebGLUniformLocation | null;
    date: WebGLUniformLocation | null;
    channelResolution: WebGLUniformLocation | null;
    channels: (WebGLUniformLocation | null)[];
}

interface CompiledPass {
    pass: ShaderPassSource;
    program: WebGLProgram;
    uniforms: PassUniforms;
}

interface RenderTarget {
    texture: WebGLTexture;
    framebuffer: WebGLFramebuffer;
}

interface BufferState {
    targets: [RenderTarget, RenderTarget];
    current: 0 | 1;
}

export interface WebGLRenderer {
    render(
        now: number,
        mouse: readonly [number, number, number, number],
        isPlaying: boolean,
        keyboard: KeyboardState,
    ): void;
    dispose(): void;
}

export function createWebGLRenderer(
    canvas: HTMLCanvasElement,
    project: ShaderProject,
): WebGLRenderer {
    const gl = canvas.getContext('webgl2', {
        antialias: false,
        alpha: false,
    });
    if (!gl) {
        throw new Error('WebGL 2 is not available in this browser.');
    }

    const passes = compilePasses(gl, project.passes);
    const buffers = new Map<BufferId, BufferState>();
    let keyboardTexture: WebGLTexture | null = null;
    const usesKeyboard = project.passes.some((pass) =>
        pass.inputs.some((input) => input.source === 'Keyboard'),
    );
    try {
        for (const pass of project.passes) {
            if (pass.id === 'Image') continue;
            const first = createRenderTarget(gl);
            try {
                const second = createRenderTarget(gl);
                buffers.set(pass.id, {
                    targets: [first, second],
                    current: 0,
                });
            } catch (error) {
                disposeTarget(gl, first);
                throw error;
            }
        }
        keyboardTexture = createKeyboardTexture(gl);
    } catch (error) {
        disposePasses(gl, passes);
        disposeBuffers(gl, buffers);
        if (keyboardTexture) gl.deleteTexture(keyboardTexture);
        throw error;
    }

    let frame = 0;
    let elapsed = 0;
    let previous = 0;
    let playing: boolean | undefined;
    const initialSize = resizeCanvas(canvas, gl);
    try {
        resizeBuffers(gl, buffers, initialSize.width, initialSize.height);
    } catch (error) {
        disposePasses(gl, passes);
        disposeBuffers(gl, buffers);
        gl.deleteTexture(keyboardTexture);
        throw error;
    }
    let bufferWidth = initialSize.width;
    let bufferHeight = initialSize.height;

    return {
        render(now, mouse, isPlaying, keyboard) {
            if (playing !== isPlaying) {
                playing = isPlaying;
                previous = now;
            }
            const delta = previous ? Math.min((now - previous) / 1000, 0.1) : 0;
            if (isPlaying) elapsed += delta;

            const { width, height } = resizeCanvas(canvas, gl);
            if (width !== bufferWidth || height !== bufferHeight) {
                resizeBuffers(gl, buffers, width, height);
                bufferWidth = width;
                bufferHeight = height;
            }
            if (usesKeyboard) {
                updateKeyboardTexture(gl, keyboardTexture!, keyboard);
            }

            const currentOutputs = new Map<BufferId, RenderTarget>();
            const writeIndices = new Map<BufferId, 0 | 1>();
            for (const compiled of passes) {
                const target = outputTarget(
                    compiled.pass,
                    buffers,
                    writeIndices,
                );
                renderPass({
                    gl,
                    compiled,
                    target,
                    width,
                    height,
                    elapsed,
                    delta: isPlaying ? delta : 0,
                    frame,
                    mouse,
                    keyboardTexture: keyboardTexture!,
                    buffers,
                    currentOutputs,
                });
                if (compiled.pass.id !== 'Image') {
                    if (!target) {
                        throw new Error(
                            `Missing output target for ${compiled.pass.id}.`,
                        );
                    }
                    currentOutputs.set(compiled.pass.id, target);
                }
            }
            for (const [id, writeIndex] of writeIndices) {
                buffers.get(id)!.current = writeIndex;
            }
            frame += 1;
            previous = now;
        },
        dispose() {
            disposePasses(gl, passes);
            disposeBuffers(gl, buffers);
            gl.deleteTexture(keyboardTexture);
        },
    };
}

function compilePasses(
    gl: WebGL2RenderingContext,
    sourcePasses: ShaderPassSource[],
): CompiledPass[] {
    const passes: CompiledPass[] = [];
    try {
        for (const pass of sourcePasses) {
            const program = compileProgram(gl, pass.source);
            passes.push({
                pass,
                program,
                uniforms: getPassUniforms(gl, program),
            });
        }
        return passes;
    } catch (error) {
        disposePasses(gl, passes);
        throw error;
    }
}

function getPassUniforms(
    gl: WebGL2RenderingContext,
    program: WebGLProgram,
): PassUniforms {
    const get = (name: string) => gl.getUniformLocation(program, name);
    return {
        resolution: get('iResolution'),
        time: get('iTime'),
        timeDelta: get('iTimeDelta'),
        frame: get('iFrame'),
        mouse: get('iMouse'),
        date: get('iDate'),
        channelResolution: gl.getUniformLocation(
            program,
            'iChannelResolution[0]',
        ),
        channels: Array.from({ length: CHANNEL_COUNT }, (_, channel) =>
            gl.getUniformLocation(program, `iChannel${channel}`),
        ),
    };
}

function createRenderTarget(gl: WebGL2RenderingContext): RenderTarget {
    const texture = gl.createTexture();
    const framebuffer = gl.createFramebuffer();
    if (!texture || !framebuffer) {
        if (texture) gl.deleteTexture(texture);
        if (framebuffer) gl.deleteFramebuffer(framebuffer);
        throw new Error('Could not create a buffer render target.');
    }
    configureTexture(gl, texture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0,
    );
    return { texture, framebuffer };
}

function createKeyboardTexture(gl: WebGL2RenderingContext): WebGLTexture {
    const texture = gl.createTexture();
    if (!texture) throw new Error('Could not create the keyboard texture.');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA8,
        256,
        3,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
    );
    return texture;
}

function configureTexture(gl: WebGL2RenderingContext, texture: WebGLTexture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
}

function resizeCanvas(canvas: HTMLCanvasElement, gl: WebGL2RenderingContext) {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(rect.width * dpr));
    const height = Math.max(1, Math.floor(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }
    gl.viewport(0, 0, width, height);
    return { width, height };
}

function resizeBuffers(
    gl: WebGL2RenderingContext,
    buffers: Map<BufferId, BufferState>,
    width: number,
    height: number,
) {
    for (const buffer of buffers.values()) {
        for (const target of buffer.targets) {
            gl.bindTexture(gl.TEXTURE_2D, target.texture);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA8,
                width,
                height,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                null,
            );
            gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0,
                gl.TEXTURE_2D,
                target.texture,
                0,
            );
            if (
                gl.checkFramebufferStatus(gl.FRAMEBUFFER) !==
                gl.FRAMEBUFFER_COMPLETE
            ) {
                throw new Error('Could not initialize a buffer render target.');
            }
        }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

function outputTarget(
    pass: ShaderPassSource,
    buffers: Map<BufferId, BufferState>,
    writeIndices: Map<BufferId, 0 | 1>,
): RenderTarget | null {
    if (pass.id === 'Image') return null;
    const buffer = buffers.get(pass.id);
    if (!buffer) throw new Error(`Missing render target for ${pass.id}.`);
    const writeIndex: 0 | 1 = buffer.current === 0 ? 1 : 0;
    writeIndices.set(pass.id, writeIndex);
    return buffer.targets[writeIndex];
}

interface RenderPassOptions {
    gl: WebGL2RenderingContext;
    compiled: CompiledPass;
    target: RenderTarget | null;
    width: number;
    height: number;
    elapsed: number;
    delta: number;
    frame: number;
    mouse: readonly [number, number, number, number];
    keyboardTexture: WebGLTexture;
    buffers: Map<BufferId, BufferState>;
    currentOutputs: Map<BufferId, RenderTarget>;
}

function renderPass(options: RenderPassOptions) {
    const {
        gl,
        compiled,
        target,
        width,
        height,
        elapsed,
        delta,
        frame,
        mouse,
    } = options;
    gl.bindFramebuffer(gl.FRAMEBUFFER, target?.framebuffer ?? null);
    gl.viewport(0, 0, width, height);
    gl.useProgram(compiled.program);
    gl.uniform3f(compiled.uniforms.resolution, width, height, 1);
    gl.uniform1f(compiled.uniforms.time, elapsed);
    gl.uniform1f(compiled.uniforms.timeDelta, delta);
    gl.uniform1i(compiled.uniforms.frame, frame);
    gl.uniform4f(compiled.uniforms.mouse, ...mouse);
    setDateUniform(gl, compiled.uniforms.date);
    bindInputs(options);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function bindInputs(options: RenderPassOptions) {
    const { gl, compiled } = options;
    const channelResolutions = new Float32Array(CHANNEL_COUNT * 3);
    for (let channel = 0; channel < CHANNEL_COUNT; channel += 1) {
        gl.activeTexture(gl.TEXTURE0 + channel);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.uniform1i(compiled.uniforms.channels[channel], channel);
    }

    for (const input of compiled.pass.inputs) {
        const texture = inputTexture(input, options);
        gl.activeTexture(gl.TEXTURE0 + input.channel);
        gl.bindTexture(gl.TEXTURE_2D, texture.texture);
        channelResolutions.set(
            [texture.width, texture.height, 1],
            input.channel * 3,
        );
    }
    gl.uniform3fv(compiled.uniforms.channelResolution, channelResolutions);
    gl.activeTexture(gl.TEXTURE0);
}

interface InputTexture {
    texture: WebGLTexture;
    width: number;
    height: number;
}

function inputTexture(
    input: ShaderInput,
    options: RenderPassOptions,
): InputTexture {
    if (input.source === 'Keyboard') {
        return {
            texture: options.keyboardTexture,
            width: 256,
            height: 3,
        };
    }

    const state = options.buffers.get(input.source);
    if (!state) throw new Error(`Missing input buffer ${input.source}.`);
    const target = input.history
        ? state.targets[state.current]
        : options.currentOutputs.get(input.source);
    if (!target) {
        throw new Error(`Buffer ${input.source} has not rendered this frame.`);
    }
    return {
        texture: target.texture,
        width: options.width,
        height: options.height,
    };
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

function disposePasses(gl: WebGL2RenderingContext, passes: CompiledPass[]) {
    for (const pass of passes) gl.deleteProgram(pass.program);
}

function disposeTarget(gl: WebGL2RenderingContext, target: RenderTarget) {
    gl.deleteTexture(target.texture);
    gl.deleteFramebuffer(target.framebuffer);
}

function disposeBuffers(
    gl: WebGL2RenderingContext,
    buffers: Map<BufferId, BufferState>,
) {
    for (const buffer of buffers.values()) {
        for (const target of buffer.targets) disposeTarget(gl, target);
    }
}
