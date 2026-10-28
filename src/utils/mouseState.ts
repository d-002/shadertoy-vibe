export type MouseUniform = [number, number, number, number];
export type MouseAction = 'move' | 'down' | 'up';

export interface MousePointerState {
    down: boolean;
    hasClick: boolean;
    clickX: number;
    clickY: number;
}

interface MouseRect {
    left: number;
    top: number;
    width: number;
    height: number;
}

export function updateMouseUniform(
    state: MousePointerState,
    action: MouseAction,
    clientX: number,
    clientY: number,
    rect: MouseRect,
    canvasWidth: number,
    canvasHeight: number,
): MouseUniform {
    const scaleX = canvasWidth / Math.max(rect.width, 1);
    const scaleY = canvasHeight / Math.max(rect.height, 1);
    const x = (clientX - rect.left) * scaleX;
    const y = (rect.height - (clientY - rect.top)) * scaleY;

    if (action === 'down') {
        state.down = true;
        state.hasClick = true;
        state.clickX = x;
        state.clickY = y;
    }
    if (action === 'up') state.down = false;

    const sign = state.down ? 1 : -1;
    return [
        x,
        y,
        state.hasClick ? state.clickX * sign : 0,
        state.hasClick ? state.clickY * sign : 0,
    ];
}
