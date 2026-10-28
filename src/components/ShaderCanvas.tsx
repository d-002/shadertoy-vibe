import { useEffect, useRef, type PointerEvent } from 'react';
import {
    createWebGLRenderer,
    type WebGLRenderer,
} from '../utils/webglRenderer';

type MouseState = [number, number, number, number];

interface ShaderCanvasProps {
    source: string;
    playing: boolean;
    onError: (message: string) => void;
}

export function ShaderCanvas({ source, playing, onError }: ShaderCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef<MouseState>([0, 0, 0, 0]);
    const playingRef = useRef(playing);
    const drawRef = useRef<((now: number) => void) | null>(null);
    const rafRef = useRef(0);

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
            renderer = createWebGLRenderer(canvas, source);
            onError('');
        } catch (error) {
            onError(errorMessage(error));
            return undefined;
        }

        const draw = (now: number) => {
            rafRef.current = 0;
            renderer.render(now, mouseRef.current, playingRef.current);
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
    }, [source, onError]);

    const updateMouse = (
        event: PointerEvent<HTMLCanvasElement>,
        pressed: boolean,
    ) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = rect.height - (event.clientY - rect.top);
        mouseRef.current = [x, y, pressed ? x : 0, pressed ? y : 0];
        schedulePausedDraw();
    };

    function schedulePausedDraw() {
        if (!playingRef.current && drawRef.current && !rafRef.current) {
            rafRef.current = requestAnimationFrame(drawRef.current);
        }
    }

    return (
        <canvas
            ref={canvasRef}
            className="shader-canvas"
            aria-label="Shader output"
            onPointerMove={(event) => updateMouse(event, event.buttons !== 0)}
            onPointerDown={(event) => updateMouse(event, true)}
            onPointerUp={(event) => updateMouse(event, false)}
            onPointerLeave={(event) => updateMouse(event, false)}
        />
    );
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}
