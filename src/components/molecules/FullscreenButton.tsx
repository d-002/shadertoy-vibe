import { IconButton } from '../atoms/IconButton';

interface FullscreenButtonProps {
    onClick: () => void;
}

export function FullscreenButton({ onClick }: FullscreenButtonProps) {
    return (
        <IconButton label="Fullscreen" onClick={() => void onClick()}>
            ⛶
        </IconButton>
    );
}
