import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('./components/ShaderCanvas', () => ({
    ShaderCanvas: ({
        project,
        playing,
    }: {
        project: { passes: { source: string }[] };
        playing: boolean;
    }) => (
        <div data-testid="canvas-mock" data-playing={String(playing)}>
            {project.passes[0]?.source}
        </div>
    ),
}));

beforeEach(() => {
    vi.stubGlobal(
        'fetch',
        vi.fn(async (url: string) => {
            if (url === '/api/shaders')
                return {
                    ok: true,
                    json: async () => [
                        { id: 'example', name: 'example' },
                        { id: 'other', name: 'other' },
                    ],
                };
            const shaderId = url.split('/').at(-2) ?? '';
            return {
                ok: true,
                json: async () => ({
                    id: decodeURIComponent(shaderId),
                    passes: [
                        {
                            id: 'Image',
                            file: 'main.frag',
                            inputs: [],
                            source: `source for ${decodeURIComponent(
                                shaderId,
                            )}`,
                        },
                    ],
                }),
            };
        }),
    );
});

describe('viewer controls', () => {
    it('loads a discovered shader and toggles playback', async () => {
        render(<App />);
        expect(
            await screen.findByText('source for example'),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Pause' }),
        ).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
        expect(
            screen.getByRole('button', { name: 'Play' }),
        ).toBeInTheDocument();
    });

    it('loads another shader when selected from the library', async () => {
        render(<App />);
        await screen.findByText('source for example');
        fireEvent.click(screen.getByRole('button', { name: /other/ }));
        await waitFor(() =>
            expect(screen.getByText('source for other')).toBeInTheDocument(),
        );
    });
});
