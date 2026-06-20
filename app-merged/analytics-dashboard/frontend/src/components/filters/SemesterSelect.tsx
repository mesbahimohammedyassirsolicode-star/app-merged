import React from 'react';
import Select from 'react-select';

const semesters = [
    { value: 'sem1', label: 'Semester 1' },
    { value: 'sem2', label: 'Semester 2' },
    { value: 'sem3', label: 'Semester 3' },
    { value: 'sem4', label: 'Semester 4' },
];

interface SemesterSelectProps {
    onChange: (selectedOption: { value: string; label: string } | null) => void;
    value: { value: string; label: string } | null;
}

const SemesterSelect: React.FC<SemesterSelectProps> = ({ onChange, value }) => {
    return (
        <div className="w-full">
            <Select
                options={semesters}
                value={value}
                onChange={onChange}
                placeholder="Select Semester"
                isSearchable
                className="react-select-container"
                classNamePrefix="react-select"
            />
        </div>
    );
};

export default SemesterSelect;