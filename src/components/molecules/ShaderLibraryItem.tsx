import type { ShaderInfo } from '../../types/shader';

interface ShaderLibraryItemProps {
    shader: ShaderInfo;
    selected: boolean;
    onSelect: (id: string) => void;
}

export function ShaderLibraryItem({
    shader,
    selected,
    onSelect,
}: ShaderLibraryItemProps) {
    const className = selected ? 'shader-item active' : 'shader-item';

    return (
        <button className={className} onClick={() => onSelect(shader.id)}>
            <span>{shader.name}</span>
            <span className="item-arrow">›</span>
        </button>
    );
}
