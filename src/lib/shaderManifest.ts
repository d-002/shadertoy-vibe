import {
    BUFFER_IDS,
    type BufferId,
    type ShaderInput,
    type ShaderInputSource,
    type ShaderManifest,
    type ShaderPass,
    type ShaderPassId,
} from '../types/shader.ts';

const PASS_IDS = [...BUFFER_IDS, 'Image'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isPassId(value: unknown): value is ShaderPassId {
    return typeof value === 'string' && PASS_IDS.includes(value as never);
}

function isBufferId(value: unknown): value is BufferId {
    return typeof value === 'string' && BUFFER_IDS.includes(value as never);
}

function parseInput(value: unknown, passId: string): ShaderInput {
    if (!isRecord(value)) {
        throw new Error(`Inputs for ${passId} must be objects.`);
    }

    const { channel, source, history, file } = value;
    if (
        !Number.isInteger(channel) ||
        Number(channel) < 0 ||
        Number(channel) > 3
    ) {
        throw new Error(
            `Input channels for ${passId} must be integers from 0 to 3.`,
        );
    }
    if (source !== 'Keyboard' && source !== 'Texture' && !isBufferId(source)) {
        throw new Error(
            `Input source for ${passId} must be a buffer, Keyboard, ` +
                'or Texture.',
        );
    }
    if (history !== undefined && typeof history !== 'boolean') {
        throw new Error(`Input history for ${passId} must be true or false.`);
    }
    if (history && !isBufferId(source)) {
        throw new Error('Only buffer inputs can use history.');
    }
    if (source === 'Texture') {
        if (
            typeof file !== 'string' ||
            !/^[\w.-]+\.(png|jpe?g|webp)$/i.test(file) ||
            file === '.' ||
            file === '..'
        ) {
            throw new Error(
                `Texture input for ${passId} must name an image file ` +
                    `in assets/ (PNG, JPEG, or WebP).`,
            );
        }
    } else if (file !== undefined) {
        throw new Error(`Only Texture inputs can specify a file.`);
    }

    return {
        channel: Number(channel),
        source: source as ShaderInputSource,
        ...(history ? { history: true } : {}),
        ...(source === 'Texture' ? { file: file as string } : {}),
    };
}

export function parseShaderManifest(value: unknown): ShaderManifest {
    if (!isRecord(value) || !Array.isArray(value.passes)) {
        throw new Error('shader.json must contain a passes array.');
    }
    if (value.passes.length === 0) {
        throw new Error('A shader manifest must define at least one pass.');
    }

    const passes: ShaderPass[] = value.passes.map((rawPass, index) => {
        if (!isRecord(rawPass) || !isPassId(rawPass.id)) {
            throw new Error(`Pass ${index + 1} has an invalid id.`);
        }
        if (
            typeof rawPass.file !== 'string' ||
            !/^[\w.-]+\.frag$/.test(rawPass.file)
        ) {
            throw new Error(
                `Pass ${rawPass.id} must reference a local .frag file.`,
            );
        }
        const rawInputs = rawPass.inputs ?? [];
        if (!Array.isArray(rawInputs) || rawInputs.length > 4) {
            throw new Error(
                `Pass ${rawPass.id} can define at most four inputs.`,
            );
        }
        const inputs = rawInputs.map((input) =>
            parseInput(input, rawPass.id as string),
        );
        const channels = inputs.map((input) => input.channel);
        if (new Set(channels).size !== channels.length) {
            throw new Error(
                `Pass ${rawPass.id} cannot bind a channel more than once.`,
            );
        }
        return { id: rawPass.id, file: rawPass.file, inputs };
    });

    const ids = passes.map((pass) => pass.id);
    if (new Set(ids).size !== ids.length) {
        throw new Error('Pass ids must be unique.');
    }
    if (
        ids.at(-1) !== 'Image' ||
        ids.filter((id) => id === 'Image').length !== 1
    ) {
        throw new Error(
            'The Image pass must be present exactly once and last.',
        );
    }

    const positions = new Map(ids.map((id, index) => [id, index]));
    passes.forEach((pass, index) => {
        for (const input of pass.inputs) {
            if (input.source === 'Keyboard' || input.source === 'Texture')
                continue;
            const sourceIndex = positions.get(input.source);
            if (sourceIndex === undefined) {
                throw new Error(
                    `Pass ${pass.id} references missing ${input.source}.`,
                );
            }
            if (!input.history && sourceIndex >= index) {
                throw new Error(
                    `Pass ${pass.id} must read earlier buffers; ` +
                        'set history: true for feedback.',
                );
            }
        }
    });

    return { passes };
}
