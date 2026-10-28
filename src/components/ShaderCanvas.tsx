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
import { loadShaderImages } from '../utils/shaderImages';

interface ShaderCanvasProps {
    project: ShaderProject;
    playing: boolean;
    resetKey: number;
    onError: (message: string) => void;
}

export function ShaderCanvas({
    project,
    playing,
    resetKey,
    onError,
}: ShaderCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<WebGLRenderer | null>(null);
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

        let active = true;
        let renderer: WebGLRenderer | undefined;

        const draw = (now: number) => {
            if (!renderer) return;
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

        void loadShaderImages(project)
            .then((images) => {
                if (!active) return;
                renderer = createWebGLRenderer(canvas, project, images);
                rendererRef.current = renderer;
                onError('');
                drawRef.current = draw;
                draw(performance.now());
            })
            .catch((error: unknown) => {
                if (active) onError(errorMessage(error));
            });

        return () => {
            active = false;
            drawRef.current = null;
            cancelAnimationFrame(rafRef.current);
            rafRef.current = 0;
            renderer?.dispose();
            rendererRef.current = null;
        };
    }, [project, onError, clearPressed, keyboardStateRef]);

    useEffect(() => {
        const renderer = rendererRef.current;
        if (!renderer) return;
        renderer.reset();
        schedulePausedDraw();
    }, [resetKey, schedulePausedDraw]);

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
