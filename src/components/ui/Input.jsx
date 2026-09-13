import { Search } from 'lucide-react';

export function Input({ label, error, className = '', ...props }) {
  const persistentLabel = label || (props.type === 'search' ? 'Search' : '');
  const isSearch = props.type === 'search';

  return (
    <div className={className}>
      {persistentLabel && <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor={props.id}>{persistentLabel}</label>}
      <div className={isSearch ? 'ui-input-search' : undefined}>
        {isSearch && <Search className="ui-input-search__icon" size={16} aria-hidden="true" />}
        <input
          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${error ? 'border-red-500' : 'border-gray-300'}${isSearch ? ' ui-input-search__field' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
