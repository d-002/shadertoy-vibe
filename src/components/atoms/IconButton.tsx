import type { MouseEventHandler, ReactNode } from 'react';

interface IconButtonProps {
    label: string;
    title?: string;
    variant?: 'default' | 'primary';
    onClick: MouseEventHandler<HTMLButtonElement>;
    children: ReactNode;
}

export function IconButton({
    label,
    title,
    variant = 'default',
    onClick,
    children,
}: IconButtonProps) {
    const variantClass = variant === 'primary' ? ' primary' : '';

    return (
        <button
            className={`icon-button${variantClass}`}
            aria-label={label}
            title={title ?? label}
            onClick={onClick}
        >
            {children}
        </button>
    );
}
