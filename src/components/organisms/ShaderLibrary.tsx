import type { ShaderInfo } from '../../types/shader';
import { ShaderLibraryItem } from '../molecules/ShaderLibraryItem';

interface ShaderLibraryProps {
    shaders: ShaderInfo[];
    selectedId: string;
    onSelect: (id: string) => void;
}

export function ShaderLibrary({
    shaders,
    selectedId,
    onSelect,
}: ShaderLibraryProps) {
    return (
        <aside className="sidebar" aria-label="Shaders">
            <div className="sidebar-heading">
                <span>LIBRARY</span>
                <span className="count">{shaders.length}</span>
            </div>
            {shaders.map((shader) => (
                <ShaderLibraryItem
                    key={shader.id}
                    shader={shader}
                    selected={selectedId === shader.id}
                    onSelect={onSelect}
                />
            ))}
            {shaders.length === 0 && (
                <p className="empty-state">
                    Add a folder with a <code>main.frag</code> file inside{' '}
                    <code>shaders/</code>.
                </p>
            )}
        </aside>
    );
}
