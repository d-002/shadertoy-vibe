import { IconButton } from '../atoms/IconButton';

interface PlaybackControlsProps {
    playing: boolean;
    onToggle: () => void;
}

export function PlaybackControls({ playing, onToggle }: PlaybackControlsProps) {
    const label = playing ? 'Pause' : 'Play';
    const status = playing ? 'RENDERING' : 'PAUSED';

    return (
        <div className="playback-controls">
            <IconButton label={label} variant="primary" onClick={onToggle}>
                {playing ? 'Ⅱ' : '▶'}
            </IconButton>
            <span className="control-divider" />
            <span className="status-dot" />
            <span className="status-text">{status}</span>
        </div>
    );
}
