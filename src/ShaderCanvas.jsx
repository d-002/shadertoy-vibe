import { useEffect, useRef } from 'react';
import { compileProgram } from './lib/shaderSource.js';

export function ShaderCanvas({ source, playing, onError }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef([0, 0, 0, 0]);
  const playingRef = useRef(playing);
  const drawRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    playingRef.current = playing;
    if (playing && drawRef.current && !rafRef.current) rafRef.current = requestAnimationFrame(drawRef.current);
    if (!playing && rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, [playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext('webgl2', { antialias: false, alpha: false });
    if (!gl) {
      onError('WebGL 2 is not available in this browser.');
      return undefined;
    }

    let program;
    try {
      program = compileProgram(gl, source);
      onError('');
    } catch (error) {
      onError(error.message);
      return undefined;
    }

    const uniforms = Object.fromEntries(
      ['iResolution', 'iTime', 'iTimeDelta', 'iFrame', 'iMouse', 'iDate'].map((name) => [name, gl.getUniformLocation(program, name)]),
    );
    let frame = 0;
    let elapsed = 0;
    let previous = 0;

    const draw = (now) => {
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
      gl.uniform1f(uniforms.iTimeDelta, previous ? Math.min((now - previous) / 1000, 0.1) : 0);
      gl.uniform1i(uniforms.iFrame, frame++);
      gl.uniform4f(uniforms.iMouse, ...mouseRef.current);
      const date = new Date();
      gl.uniform4f(uniforms.iDate, date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds());
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (previous && playingRef.current) elapsed += Math.min((now - previous) / 1000, 0.1);
      previous = now;
      if (playingRef.current) rafRef.current = requestAnimationFrame(draw);
    };
    drawRef.current = draw;
    draw(performance.now());
    return () => {
      drawRef.current = null;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      gl.deleteProgram(program);
    };
  }, [source, onError]);

  const updateMouse = (event, pressed) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = rect.height - (event.clientY - rect.top);
    mouseRef.current = [x, y, pressed ? x : 0, pressed ? y : 0];
    if (!playingRef.current && drawRef.current && !rafRef.current) rafRef.current = requestAnimationFrame(drawRef.current);
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
