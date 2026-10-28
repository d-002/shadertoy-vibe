import { useEffect, useRef } from 'react';
import { createWebGLRenderer } from './utils/webglRenderer.js';

export function ShaderCanvas({ source, playing, onError }) {
    const canvasRef = useRef(null);
    const mouseRef = useRef([0, 0, 0, 0]);
    const playingRef = useRef(playing);
    const rendererRef = useRef(null);
    const drawRef = useRef(null);
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
        let renderer;
        try {
            renderer = createWebGLRenderer(canvas, source);
            rendererRef.current = renderer;
            onError('');
        } catch (error) {
            onError(error.message);
            return undefined;
        }

        const draw = (now) => {
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
            rendererRef.current = null;
            cancelAnimationFrame(rafRef.current);
            rafRef.current = 0;
            renderer.dispose();
        };
    }, [source, onError]);

    const updateMouse = (event, pressed) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = rect.height - (event.clientY - rect.top);
        mouseRef.current = [x, y, pressed ? x : 0, pressed ? y : 0];
        if (!playingRef.current && drawRef.current && !rafRef.current) {
            rafRef.current = requestAnimationFrame(drawRef.current);
        }
    };

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
