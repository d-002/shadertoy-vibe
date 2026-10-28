import { IconButton } from '../atoms/IconButton';

interface PreviewTimerProps {
    elapsed: number;
    onReset: () => void;
}

export function PreviewTimer({ elapsed, onReset }: PreviewTimerProps) {
    const tenths = Math.floor(elapsed * 10);
    const minutes = Math.floor(tenths / 600);
    const seconds = Math.floor(tenths / 10) % 60;
    const fraction = tenths % 10;

    return (
        <div className="preview-timer">
            <output aria-label="Shader time">
                {String(minutes).padStart(2, '0')}:
                {String(seconds).padStart(2, '0')}.{fraction}
            </output>
            <IconButton label="Reset shader time" onClick={onReset}>
                ↺
            </IconButton>
        </div>
    );
}
