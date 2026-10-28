import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.jsx';

vi.mock('./ShaderCanvas.jsx', () => ({
  ShaderCanvas: ({ source, playing }) => <div data-testid="canvas-mock" data-playing={String(playing)}>{source}</div>,
}));

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (url) => {
    if (url === '/api/shaders') return { ok: true, json: async () => [{ id: 'example', name: 'example' }, { id: 'other', name: 'other' }] };
    return { ok: true, text: async () => `source for ${decodeURIComponent(url.split('/').at(-1))}` };
  }));
});

describe('viewer controls', () => {
  it('loads a discovered shader and toggles playback', async () => {
    render(<App />);
    expect(await screen.findByText('source for example')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  });

  it('loads another shader when selected from the library', async () => {
    render(<App />);
    await screen.findByText('source for example');
    fireEvent.click(screen.getByRole('button', { name: /other/ }));
    await waitFor(() => expect(screen.getByText('source for other')).toBeInTheDocument());
  });
});
