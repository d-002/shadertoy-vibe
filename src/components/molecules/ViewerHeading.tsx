interface ViewerHeadingProps {
    shaderName: string;
}

export function ViewerHeading({ shaderName }: ViewerHeadingProps) {
    return (
        <div className="shader-heading">
            <div>
                <div className="eyebrow">NOW PLAYING</div>
                <h1>{shaderName || 'No shader selected'}</h1>
            </div>
            <div className="shader-meta">
                GLSL ES 3.00 <span>·</span> WebGL 2
            </div>
        </div>
    );
}
