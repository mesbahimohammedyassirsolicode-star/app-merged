import React from 'react';
import Select from 'react-select';
import { useQuery } from 'react-query';
import { fetchGroups } from '../../services/api';
import { analyticsSelectStyles } from './selectStyles';

const ALL_GROUPS_OPTION = {
    value: null,
    label: 'Tous les groupes',
};

const GroupSelect = ({ onChange, value, filiereId }) => {
    const { data: groups, isLoading, error } = useQuery('groups', fetchGroups);

    const filteredGroups = (groups || []).filter((group) => {
        if (!filiereId) {
            return true;
        }

        return (
            group.filiereId === filiereId ||
            group.filiere_id === filiereId ||
            group.filiere?.id === filiereId ||
            group.module?.filiereId === filiereId ||
            group.module?.filiere_id === filiereId ||
            group.module?.filiere?.id === filiereId
        );
    });

    const options = [
        ALL_GROUPS_OPTION,
        ...filteredGroups.map((group) => ({
            value: group.id,
            label: group.name || group.label,
        })),
    ];

    const handleChange = (selectedOption) => {
        onChange(selectedOption ? selectedOption.value : null);
    };

    if (isLoading) {
        return <div className="text-sm text-[var(--analytics-text-soft)]">Chargement des groupes...</div>;
    }

    if (error) {
        return <div className="text-sm text-rose-600">Erreur lors du chargement des groupes</div>;
    }

    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-[var(--analytics-text)]">Groupe</label>
            <Select
                options={options}
                onChange={handleChange}
                value={options.find((option) => option.value === value) || ALL_GROUPS_OPTION}
                placeholder="Tous les groupes"
                isSearchable
                styles={analyticsSelectStyles}
                className="react-select-container"
                classNamePrefix="react-select"
            />
        </div>
    );
};

export default GroupSelect;
