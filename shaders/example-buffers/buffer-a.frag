void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 previous = texture(iChannel0, uv);
    float cKeyToggle = texelFetch(iChannel1, ivec2(67, 2), 0).r;
    vec3 ink = mix(vec3(0.98, 0.42, 0.24), vec3(0.36, 0.72, 1.0), cKeyToggle);
    vec3 color = previous.rgb * 0.985;

    if (iFrame == 0) {
        color = vec3(0.015, 0.02, 0.035);
    }

    if (iMouse.z > 0.0) {
        vec2 mouseUv = iMouse.xy / iResolution.xy;
        float brush = 1.0 - smoothstep(0.012, 0.035, length(uv - mouseUv));
        color = mix(color, ink, brush);
    }

    fragColor = vec4(color, 1.0);
}
