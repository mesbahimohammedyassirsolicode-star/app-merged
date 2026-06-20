import React from 'react';
import Select from 'react-select';
import { useQuery } from 'react-query';
import { fetchFilieres } from '../../services/api';
import { analyticsSelectStyles } from './selectStyles';

const ALL_FILIERES_OPTION = {
    value: null,
    label: 'Toutes les filieres',
};

const FiliereSelect = ({ value, onChange }) => {
    const { data: filieres, isLoading, error } = useQuery('filieres', fetchFilieres);

    const options = [
        ALL_FILIERES_OPTION,
        ...((filieres || []).map((filiere) => ({
            value: filiere.id,
            label: filiere.name || filiere.label,
        }))),
    ];

    const selectedOption = options.find((option) => option.value === value) || ALL_FILIERES_OPTION;

    const handleChange = (selectedOption) => {
        onChange(selectedOption ? selectedOption.value : null);
    };

    if (isLoading) {
        return <div className="text-sm text-[var(--analytics-text-soft)]">Chargement des filieres...</div>;
    }

    if (error) {
        return <div className="text-sm text-rose-600">Erreur lors du chargement des filieres</div>;
    }

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--analytics-text)]">Filiere</label>
            <Select
                options={options}
                onChange={handleChange}
                value={selectedOption}
                placeholder="Toutes les filieres"
                isSearchable
                styles={analyticsSelectStyles}
                className="w-full"
                classNamePrefix="react-select"
            />
        </div>
    );
};

export default FiliereSelect;
