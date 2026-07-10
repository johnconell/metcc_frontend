import './management.css';

export function FilterDropdown({ id, label, value, onChange, options, className = '' }) {
  return (
    <div className={`mgmt-filter ${className}`.trim()}>
      {label && (
        <label htmlFor={id} className="mgmt-filter__label">
          {label}
        </label>
      )}
      <select
        id={id}
        className="mgmt-filter__select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label || 'Filter'}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
