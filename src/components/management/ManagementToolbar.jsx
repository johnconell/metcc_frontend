import './management.css';
import { SearchBar } from './SearchBar';

const VARIANTS = {
  primary: 'mgmt-btn--primary',
  secondary: 'mgmt-btn--secondary',
  tertiary: 'mgmt-btn--tertiary',
};

export function ManagementButton({
  children,
  variant = 'secondary',
  size = 'default',
  className = '',
  as: Component = 'button',
  ...props
}) {
  const sizeClass = size === 'sm' ? ' mgmt-btn--sm' : '';
  const classes = `mgmt-btn ${VARIANTS[variant] || VARIANTS.secondary}${sizeClass} ${className}`.trim();

  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
}

export function ManagementToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  searchId,
  filters,
  actions,
  bulkActions,
  selectedCount = 0,
}) {
  return (
    <div className="mgmt-toolbar" role="toolbar" aria-label="Table controls">
      {onSearchChange && (
        <div className="mgmt-toolbar__search">
          <SearchBar
            id={searchId}
            value={searchValue}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        </div>
      )}

      {filters && filters.length > 0 && (
        <div className="mgmt-toolbar__filters">{filters}</div>
      )}

      {actions && <div className="mgmt-toolbar__actions">{actions}</div>}

      {bulkActions && selectedCount > 0 && (
        <div className="mgmt-toolbar__bulk">
          <span className="mgmt-toolbar__bulk-label">{selectedCount} selected</span>
          {bulkActions}
        </div>
      )}
    </div>
  );
}
