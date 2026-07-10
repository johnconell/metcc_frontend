import './management.css';

export function SearchBar({ id, value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`mgmt-search ${className}`.trim()}>
      <svg className="mgmt-search__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        id={id}
        type="search"
        className="mgmt-search__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
}
