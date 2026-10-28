interface ShaderErrorPanelProps {
    message: string;
}

export function ShaderErrorPanel({ message }: ShaderErrorPanelProps) {
    return (
        <div role="alert" className="error-panel">
            <strong>Shader error</strong>
            <pre>{message}</pre>
        </div>
    );
}
