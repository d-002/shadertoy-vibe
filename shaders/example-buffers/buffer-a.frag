void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 previous = texture(iChannel0, uv);
    float colorIndex = texelFetch(iChannel1, ivec2(0, 0), 0).r;
    vec3 ink = colorIndex < 0.25 ? vec3(1., 0., 0.) :
        colorIndex < 0.6 ? vec3(0., 1., 0.) : vec3(0., 0., 1.);
    vec3 color = previous.rgb * 0.96;

    if (max(color.r, max(color.g, color.b)) < 0.015) {
        color = vec3(0.);
    }

    if (iFrame == 0) {
        color = vec3(0.);
    }

    if (iMouse.z > 0.0) {
        vec2 mouseUv = iMouse.xy / iResolution.xy;
        vec2 pixelDelta = (uv - mouseUv) * iResolution.xy;
        float brush = 1.0 - smoothstep(8., 24., length(pixelDelta));
        color = mix(color, ink, brush);
    }

    fragColor = vec4(color, 1.0);
}
