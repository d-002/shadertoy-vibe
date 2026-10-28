import { ShaderInputSource, type ShaderProject } from '../types/shader';

export async function loadShaderImages(
    project: ShaderProject,
): Promise<Map<string, HTMLImageElement>> {
    const files = new Set(
        project.passes.flatMap((pass) =>
            pass.inputs.flatMap((input) =>
                input.source === ShaderInputSource.Texture && input.file
                    ? [input.file]
                    : [],
            ),
        ),
    );
    const images = new Map<string, HTMLImageElement>();
    await Promise.all(
        [...files].map(
            (file) =>
                new Promise<void>((resolve, reject) => {
                    const image = new Image();
                    image.onload = () => {
                        images.set(file, image);
                        resolve();
                    };
                    image.onerror = () =>
                        reject(
                            new Error(`Could not load image asset ${file}.`),
                        );
                    image.src = `/api/assets/${encodeURIComponent(file)}`;
                }),
        ),
    );
    return images;
}
