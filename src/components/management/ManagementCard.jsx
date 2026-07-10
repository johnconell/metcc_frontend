import './management.css';

export function ManagementCard({ children, id, className = '' }) {
  return (
    <section id={id} className={`mgmt-feature-card ${className}`.trim()} aria-labelledby={id ? `${id}-title` : undefined}>
      <div className="mgmt-feature-card__body">{children}</div>
    </section>
  );
}
