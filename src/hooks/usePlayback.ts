import { useCallback, useState } from 'react';

export function usePlayback() {
    const [playing, setPlaying] = useState(true);

    const toggle = useCallback(() => {
        setPlaying((current) => !current);
    }, []);

    return { playing, toggle };
}
