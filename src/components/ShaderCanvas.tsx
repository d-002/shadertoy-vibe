import { useCallback, useEffect, useRef, type PointerEvent } from 'react';
import type { ShaderProject } from '../types/shader';
import { useKeyboardInput } from '../hooks/useKeyboardInput';
import {
    updateMouseUniform,
    type MouseAction,
    type MousePointerState,
} from '../utils/mouseState';
import {
    createWebGLRenderer,
    type WebGLRenderer,
} from '../utils/webglRenderer';

interface ShaderCanvasProps {
    project: ShaderProject;
    playing: boolean;
    onError: (message: string) => void;
}

export function ShaderCanvas({ project, playing, onError }: ShaderCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef<[number, number, number, number]>([0, 0, 0, 0]);
    const pointerRef = useRef<MousePointerState>({
        down: false,
        hasClick: false,
        clickX: 0,
        clickY: 0,
    });
    const playingRef = useRef(playing);
    const drawRef = useRef<((now: number) => void) | null>(null);
    const rafRef = useRef(0);
    const schedulePausedDraw = useCallback(() => {
        if (!playingRef.current && drawRef.current && !rafRef.current) {
            rafRef.current = requestAnimationFrame(drawRef.current);
        }
    }, []);
    const { stateRef: keyboardStateRef, clearPressed } =
        useKeyboardInput(schedulePausedDraw);

    useEffect(() => {
        playingRef.current = playing;
        if (playing && drawRef.current && !rafRef.current) {
            rafRef.current = requestAnimationFrame(drawRef.current);
        }
        if (!playing && rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = 0;
        }
    }, [playing]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;

        let renderer: WebGLRenderer;
        try {
            renderer = createWebGLRenderer(canvas, project);
            onError('');
        } catch (error) {
            onError(errorMessage(error));
            return undefined;
        }

        const draw = (now: number) => {
            rafRef.current = 0;
            renderer.render(
                now,
                mouseRef.current,
                playingRef.current,
                keyboardStateRef.current,
            );
            clearPressed();
            if (playingRef.current) {
                rafRef.current = requestAnimationFrame(draw);
            }
        };
        drawRef.current = draw;
        draw(performance.now());

        return () => {
            drawRef.current = null;
            cancelAnimationFrame(rafRef.current);
            rafRef.current = 0;
            renderer.dispose();
        };
    }, [project, onError, clearPressed, keyboardStateRef]);

    const updateMouse = (
        event: PointerEvent<HTMLCanvasElement>,
        action: MouseAction,
    ) => {
        const canvas = event.currentTarget;
        mouseRef.current = updateMouseUniform(
            pointerRef.current,
            action,
            event.clientX,
            event.clientY,
            canvas.getBoundingClientRect(),
            canvas.width,
            canvas.height,
        );
        schedulePausedDraw();
    };

    return (
        <canvas
            ref={canvasRef}
            className="shader-canvas"
            aria-label="Shader output"
            onPointerMove={(event) => updateMouse(event, 'move')}
            onPointerDown={(event) => updateMouse(event, 'down')}
            onPointerUp={(event) => updateMouse(event, 'up')}
            onPointerLeave={(event) => {
                if (pointerRef.current.down) updateMouse(event, 'up');
            }}
        />
    );
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
