import React, { useState } from 'react';

const DateRangePicker = ({ onChange }) => {
    const today = new Date().toISOString().slice(0, 10);
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    const emitChange = (nextStartDate, nextEndDate) => {
        onChange({
            startDate: nextStartDate ? new Date(nextStartDate) : null,
            endDate: nextEndDate ? new Date(nextEndDate) : null,
        });
    };

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[var(--analytics-text)]">Date de debut</label>
                <input
                    type="date"
                    value={startDate}
                    onChange={(event) => {
                        const nextValue = event.target.value;
                        setStartDate(nextValue);
                        emitChange(nextValue, endDate);
                    }}
                    className="analytics-date-input"
                />
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-[var(--analytics-text)]">Date de fin</label>
                <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(event) => {
                        const nextValue = event.target.value;
                        setEndDate(nextValue);
                        emitChange(startDate, nextValue);
                    }}
                    className="analytics-date-input"
                />
            </div>
        </div>
    );
};

export default DateRangePicker;
