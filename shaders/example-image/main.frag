void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 screenUv = fragCoord / iResolution.xy;
    vec2 imageResolution = iChannelResolution[0].xy;
    float viewAspect = iResolution.x / iResolution.y;
    float imageAspect = imageResolution.x / imageResolution.y;
    vec2 imageScale = vec2(1.0);

    if (viewAspect > imageAspect) {
        imageScale.x = imageAspect / viewAspect;
    } else {
        imageScale.y = viewAspect / imageAspect;
    }

    vec2 imageUv = (screenUv - 0.5) / imageScale + 0.5;
    bool outsideImage = any(lessThan(imageUv, vec2(0.0))) ||
        any(greaterThan(imageUv, vec2(1.0)));

    fragColor = outsideImage
        ? vec4(0.0, 0.0, 0.0, 1.0)
        : texture(iChannel0, imageUv);
}
