import type { ShaderInfo } from '../../types/shader';

interface ShaderLibraryItemProps {
    shader: ShaderInfo;
    selected: boolean;
    index: number;
    onSelect: (id: string) => void;
}

export function ShaderLibraryItem({
    shader,
    selected,
    index,
    onSelect,
}: ShaderLibraryItemProps) {
    const className = selected ? 'shader-item active' : 'shader-item';
    const icon = index === 0 ? '◈' : '◇';

    return (
        <button className={className} onClick={() => onSelect(shader.id)}>
            <span className="shader-icon">{icon}</span>
            <span>{shader.name}</span>
            <span className="item-arrow">›</span>
        </button>
    );
}
