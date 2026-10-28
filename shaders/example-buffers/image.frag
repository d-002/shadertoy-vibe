void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec3 bufferColor = texture(iChannel0, uv).rgb;
    float vignette = 1.0 - smoothstep(0.25, 0.95, length(uv - 0.5));
    fragColor = vec4(bufferColor * vignette, 1.0);
}
