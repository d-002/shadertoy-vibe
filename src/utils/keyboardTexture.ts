export interface KeyboardState {
    down: ReadonlySet<number>;
    pressed: ReadonlySet<number>;
    toggled: ReadonlySet<number>;
}

const emptyKeys: ReadonlySet<number> = new Set<number>();
export const EMPTY_KEYBOARD_STATE: KeyboardState = {
    down: emptyKeys,
    pressed: emptyKeys,
    toggled: emptyKeys,
};

const KEY_COUNT = 256;
const ROW_COUNT = 3;
const CHANNEL_COUNT = 4;

export function createKeyboardPixels(state: KeyboardState): Uint8Array {
    const pixels = new Uint8Array(KEY_COUNT * ROW_COUNT * CHANNEL_COUNT);
    for (let key = 0; key < KEY_COUNT; key += 1) {
        pixels[pixelIndex(key, 0)] = state.down.has(key) ? 255 : 0;
        pixels[pixelIndex(key, 1)] = state.pressed.has(key) ? 255 : 0;
        pixels[pixelIndex(key, 2)] = state.toggled.has(key) ? 255 : 0;
    }
    for (let index = 3; index < pixels.length; index += CHANNEL_COUNT) {
        pixels[index] = 255;
    }
    return pixels;
}

export function updateKeyboardTexture(
    gl: WebGL2RenderingContext,
    texture: WebGLTexture,
    state: KeyboardState,
) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        KEY_COUNT,
        ROW_COUNT,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        createKeyboardPixels(state),
    );
}

function pixelIndex(key: number, row: number): number {
    return (row * KEY_COUNT + key) * CHANNEL_COUNT;
}
