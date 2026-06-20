export const analyticsSelectStyles = {
    control: (base, state) => ({
        ...base,
        backgroundColor: 'var(--analytics-surface)',
        borderColor: state.isFocused ? 'var(--analytics-primary)' : 'var(--analytics-border)',
        borderRadius: 14,
        boxShadow: state.isFocused ? '0 0 0 4px rgba(37, 99, 235, 0.16)' : '0 1px 2px rgba(15, 23, 42, 0.06)',
        color: 'var(--analytics-text)',
        minHeight: 52,
        paddingLeft: 6,
        paddingRight: 6,
        transition: 'border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease',
        '&:hover': {
            borderColor: 'var(--analytics-text-soft)',
            backgroundColor: 'var(--analytics-surface-soft)',
        },
    }),
    valueContainer: (base) => ({
        ...base,
        padding: '0 8px',
    }),
    input: (base) => ({
        ...base,
        color: 'var(--analytics-text)',
        margin: 0,
        padding: 0,
    }),
    singleValue: (base) => ({
        ...base,
        color: 'var(--analytics-text)',
        fontWeight: 600,
    }),
    placeholder: (base) => ({
        ...base,
        color: 'var(--analytics-text-soft)',
    }),
    indicatorSeparator: () => ({
        display: 'none',
    }),
    dropdownIndicator: (base, state) => ({
        ...base,
        color: state.isFocused ? 'var(--analytics-primary)' : 'var(--analytics-text-soft)',
        '&:hover': {
            color: '#2563eb',
        },
    }),
    clearIndicator: (base) => ({
        ...base,
        color: 'var(--analytics-text-soft)',
        '&:hover': {
            color: 'var(--analytics-text)',
        },
    }),
    menu: (base) => ({
        ...base,
        backgroundColor: 'var(--analytics-surface)',
        border: '1px solid var(--analytics-border)',
        borderRadius: 16,
        boxShadow: '0 20px 40px -24px rgba(15, 23, 42, 0.38)',
        overflow: 'hidden',
        marginTop: 8,
    }),
    menuList: (base) => ({
        ...base,
        padding: 8,
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? 'rgba(37, 99, 235, 0.18)' : state.isFocused ? 'rgba(37, 99, 235, 0.10)' : 'var(--analytics-surface)',
        borderRadius: 10,
        color: state.isSelected ? 'var(--analytics-primary)' : 'var(--analytics-text)',
        cursor: 'pointer',
        fontWeight: state.isSelected ? 700 : 500,
        marginBottom: 4,
        padding: '10px 12px',
    }),
};
