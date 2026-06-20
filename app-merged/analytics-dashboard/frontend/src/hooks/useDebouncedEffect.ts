import { useEffect, useState } from 'react';

function useDebouncedEffect(callback: () => void, delay: number, dependencies: any[]) {
    const [debouncedCallback, setDebouncedCallback] = useState(() => callback);

    useEffect(() => {
        const handler = setTimeout(() => {
            debouncedCallback();
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [...dependencies, delay]);

    return debouncedCallback;
}

export default useDebouncedEffect;