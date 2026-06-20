import React, { useEffect, useState } from 'react';
import GroupSelect from './GroupSelect';
import FiliereSelect from './FiliereSelect';
import DateRangePicker from './DateRangePicker';

const EMPTY_FILTERS = {
    groupId: null,
    filiereId: null,
    dateStart: null,
    dateEnd: null,
};

const FiltersPanel = ({ onFilterChange }) => {
    const [filters, setFilters] = useState(EMPTY_FILTERS);

    const handleFilterChange = (newFilters) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            ...newFilters,
        }));
    };

    useEffect(() => {
        if (typeof onFilterChange === 'function') {
            onFilterChange({
                group_id: filters.groupId,
                filiere_id: filters.filiereId,
                date_start: filters.dateStart,
                date_end: filters.dateEnd,
            });
        }
    }, [filters, onFilterChange]);

    const handleFiliereChange = (filiere) => {
        setFilters((prevFilters) => ({
            ...prevFilters,
            filiereId: filiere,
            groupId: null,
        }));
    };

    return (
        <section className="analytics-panel">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="analytics-eyebrow">Pilotage</p>
                    <h2 className="analytics-panel-title">Filtres analytiques</h2>
                    <p className="analytics-panel-copy">Affinez la vue par filiere, groupe et periode pour lire les tendances plus vite.</p>
                </div>
                <div className="analytics-chip">Mise a jour instantanee</div>
            </div>

            <div className="mt-6 grid gap-5 xl:grid-cols-2">
                <FiliereSelect value={filters.filiereId} onChange={handleFiliereChange} />
                <GroupSelect
                    value={filters.groupId}
                    filiereId={filters.filiereId}
                    onChange={(groupId) => handleFilterChange({ groupId })}
                />
            </div>

            <div className="mt-5">
                <DateRangePicker
                    onChange={(dateRange) => handleFilterChange({ dateStart: dateRange.startDate, dateEnd: dateRange.endDate })}
                />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button className="analytics-button analytics-button-primary" type="button">
                    Appliquer les filtres
                </button>
                <button
                    className="analytics-button analytics-button-secondary"
                    onClick={() => setFilters(EMPTY_FILTERS)}
                    type="button"
                >
                    Effacer
                </button>
            </div>
        </section>
    );
};

export default FiltersPanel;
