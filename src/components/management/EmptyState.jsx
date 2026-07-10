import './management.css';

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="mgmt-empty" role="status">
      {Icon && <Icon className="mgmt-empty__icon" aria-hidden="true" />}
      <h3 className="mgmt-empty__title">{title}</h3>
      {description && <p className="mgmt-empty__desc">{description}</p>}
    </div>
  );
}
