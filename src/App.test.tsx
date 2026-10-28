import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

vi.mock('./components/ShaderCanvas', () => ({
    ShaderCanvas: ({
        project,
        playing,
        resetKey,
    }: {
        project: { passes: { source: string }[] };
        playing: boolean;
        resetKey: number;
    }) => (
        <div
            data-testid="canvas-mock"
            data-playing={String(playing)}
            data-reset-key={resetKey}
        >
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

    it('resets the shader timer and canvas state', async () => {
        render(<App />);
        await screen.findByText('source for example');
        fireEvent.click(
            screen.getByRole('button', { name: 'Reset shader time' }),
        );
        expect(screen.getByTestId('canvas-mock')).toHaveAttribute(
            'data-reset-key',
            '1',
        );
        expect(screen.getByLabelText('Shader time')).toHaveTextContent(
            '00:00.0',
        );
    });

    it('shows project validation errors returned by the API', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(async (url: string) => {
                if (url === '/api/shaders') {
                    return {
                        ok: true,
                        json: async () => [{ id: 'broken', name: 'broken' }],
                    };
                }
                return {
                    ok: false,
                    status: 400,
                    text: async () =>
                        'Texture input for Image ' +
                        'must name an image file in assets/.',
                };
            }),
        );
        render(<App />);
        expect(
            await screen.findByText(
                'Texture input for Image must name an image file in assets/.',
            ),
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
