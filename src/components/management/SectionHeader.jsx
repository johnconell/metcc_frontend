import './management.css';

export function SectionHeader({ title, description, actions, titleId }) {
  return (
    <header className="mgmt-section-header">
      <div className="mgmt-section-header__text">
        <h2 id={titleId} className="mgmt-title-md">
          {title}
        </h2>
        {description && <p className="mgmt-caption">{description}</p>}
      </div>
      {actions && <div className="mgmt-section-header__actions">{actions}</div>}
    </header>
  );
}
