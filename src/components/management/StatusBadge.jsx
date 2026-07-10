import './management.css';

const VARIANT_MAP = {
  default: 'mgmt-badge--default',
  success: 'mgmt-badge--success',
  error: 'mgmt-badge--error',
  muted: 'mgmt-badge--muted',
};

export function StatusBadge({ children, variant = 'default' }) {
  return (
    <span className={`mgmt-badge ${VARIANT_MAP[variant] || VARIANT_MAP.default}`}>
      {children}
    </span>
  );
}
