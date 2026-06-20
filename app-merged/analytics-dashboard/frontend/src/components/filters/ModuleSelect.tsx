import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { fetchModules } from '../../services/api';
import { analyticsSelectStyles } from './selectStyles';

const ModuleSelect = ({ onChange }) => {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadModules = async () => {
            try {
                const data = await fetchModules();
                setModules(data.map(module => ({
                    value: module.id,
                    label: module.name
                })));
            } catch (err) {
                setError('Failed to load modules');
            } finally {
                setLoading(false);
            }
        };

        loadModules();
    }, []);

    const handleChange = (selectedOption) => {
        onChange(selectedOption ? selectedOption.value : null);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--analytics-text)]">Module</label>
            <Select
                options={modules}
                onChange={handleChange}
                placeholder="Selectionnez un module..."
                isSearchable
                styles={analyticsSelectStyles}
                classNamePrefix="react-select"
            />
        </div>
    );
};

export default ModuleSelect;
