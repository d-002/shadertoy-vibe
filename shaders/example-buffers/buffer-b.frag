void mainImage(out vec4 fragColor, vec2 fragCoord) {
    float colorIndex =
        iFrame == 0
            ? 0.0
            : texture(iChannel0, vec2(0.5) / iResolution.xy).r;
    float cPressed = texelFetch(iChannel1, ivec2(67, 1), 0).r;

    if (cPressed > 0.5) {
        float colorStep = floor(colorIndex * 3.0 + 0.5);
        colorIndex = mod(colorStep + 1.0, 3.0) / 3.0;
    }

    fragColor = vec4(colorIndex, 0.0, 0.0, 1.0);
}
