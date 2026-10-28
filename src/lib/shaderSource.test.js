import { describe, expect, it } from 'vitest';
import { wrapFragmentSource } from './shaderSource.js';

describe('fragment shader wrapper', () => {
  it('adds Shadertoy uniforms and invokes mainImage at the fragment coordinate', () => {
    const wrapped = wrapFragmentSource(
      'void mainImage(out vec4 c, in vec2 p) { c = vec4(1.0); }',
    );
    expect(wrapped).toContain('#version 300 es');
    expect(wrapped).toContain('uniform vec3 iResolution;');
    expect(wrapped).toContain('uniform float iTime;');
    expect(wrapped).toContain('mainImage(_shaderColor, gl_FragCoord.xy)');
  });
});
