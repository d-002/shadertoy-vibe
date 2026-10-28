export const BUFFER_IDS = ['BufferA', 'BufferB', 'BufferC', 'BufferD'] as const;

export type BufferId = (typeof BUFFER_IDS)[number];
export type ShaderPassId = BufferId | 'Image';
export enum ShaderInputSource {
    Keyboard = 'Keyboard',
    Texture = 'Texture',
}

export type ShaderChannelSource = BufferId | ShaderInputSource;

export interface ShaderInput {
    channel: number;
    source: ShaderChannelSource;
    history?: boolean;
    file?: string;
}

export interface ShaderPass {
    id: ShaderPassId;
    file: string;
    inputs: ShaderInput[];
}

export interface ShaderPassSource extends ShaderPass {
    source: string;
}

export interface ShaderManifest {
    passes: ShaderPass[];
}

export interface ShaderProject {
    id: string;
    passes: ShaderPassSource[];
}

export interface ShaderInfo {
    id: string;
    name: string;
}
