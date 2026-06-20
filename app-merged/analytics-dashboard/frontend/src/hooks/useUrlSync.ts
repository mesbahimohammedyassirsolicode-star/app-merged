import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useUrlSync = (filters, setFilters) => {
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const newFilters = {
            module: params.get('module') || '',
            group: params.get('group') || '',
            filiere: params.get('filiere') || '',
            semester: params.get('semester') || '',
            dateStart: params.get('dateStart') || '',
            dateEnd: params.get('dateEnd') || '',
        };
        setFilters(newFilters);
    }, [location.search, setFilters]);

    useEffect(() => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) {
                params.set(key, value);
            }
        });
        const newUrl = `${location.pathname}?${params.toString()}`;
        window.history.replaceState({}, '', newUrl);
    }, [filters, location.pathname]);

};

export default useUrlSync;