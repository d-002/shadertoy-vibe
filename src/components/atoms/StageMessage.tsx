import type { ReactNode } from 'react';

interface StageMessageProps {
    children: ReactNode;
}

export function StageMessage({ children }: StageMessageProps) {
    return <div className="stage-message">{children}</div>;
}
