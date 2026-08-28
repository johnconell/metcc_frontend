import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { buildBreadcrumbs } from '../../utils/routeBreadcrumbs';
import './AppBreadcrumbs.css';

export function AppBreadcrumbs({ pathname }) {
  const crumbs = buildBreadcrumbs(pathname);

  // If there are no crumbs or only a single crumb (e.g., at dashboard root), do not render
  if (!crumbs || crumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="app-breadcrumbs" aria-label="Breadcrumb">
      <ol className="app-breadcrumbs__list">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          const isFirst = index === 0;
          const key = `${crumb.to || crumb.label}-${index}`;

          return (
            <li key={key} className="app-breadcrumbs__item">
              {crumb.to && !isLast ? (
                <Link
                  to={crumb.to}
                  className="app-breadcrumbs__link"
                  aria-label={isFirst ? 'Dashboard' : crumb.label}
                >
                  {isFirst && <Home size={14} aria-hidden="true" />}
                  <span>{crumb.label}</span>
                </Link>
              ) : (
                <span className="app-breadcrumbs__current" aria-current="page">
                  {isFirst && <Home size={14} aria-hidden="true" />}
                  <span>{crumb.label}</span>
                </span>
              )}
              {!isLast && (
                <ChevronRight className="app-breadcrumbs__sep" size={13} aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
