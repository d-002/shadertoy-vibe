import { LocalBadge } from '../atoms/LocalBadge';

export function AppHeader() {
    return (
        <header className="topbar">
            <a className="brand" href="#">
                Shader Room
            </a>
            <LocalBadge />
        </header>
    );
}
