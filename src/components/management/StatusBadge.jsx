import './management.css';

const VARIANT_MAP = {
  default: 'mgmt-badge--default',
  success: 'mgmt-badge--success',
  error: 'mgmt-badge--error',
  muted: 'mgmt-badge--muted',
  info: 'mgmt-badge--info',
  warning: 'mgmt-badge--warning',
};

export function StatusBadge({ children, variant = 'default' }) {
  return (
    <span className={`mgmt-badge ${VARIANT_MAP[variant] || VARIANT_MAP.default}`}>
      {children}
    </span>
  );
}
