import './skeleton.css';

export function Skeleton({ className = '', style, ...props }) {
  return <span className={`ui-skeleton ${className}`.trim()} style={style} aria-hidden="true" {...props} />;
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`ui-skeleton-stack ${className}`.trim()} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          className="ui-skeleton--line"
          style={{ width: index === lines - 1 ? '68%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCardGrid({ count = 6, className = '' }) {
  return (
    <div className={`mp-cat-grid ${className}`.trim()} aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="mp-cat-card ui-skeleton-card">
          <div className="mp-cat-card__top">
            <Skeleton className="ui-skeleton--icon" />
            <Skeleton className="ui-skeleton--chip" />
          </div>
          <Skeleton className="ui-skeleton--title" />
          <SkeletonText lines={2} />
          <Skeleton className="ui-skeleton--meta" />
          <div className="mp-cat-card__actions">
            <Skeleton className="ui-skeleton--btn" />
            <Skeleton className="ui-skeleton--btn" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ count = 4 }) {
  return (
    <div className="mp-stats" aria-busy="true" aria-label="Loading summary">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="mp-stats__item">
          <Skeleton className="ui-skeleton--stat" />
          <Skeleton className="ui-skeleton--label" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6, cols = 5 }) {
  const template = `minmax(0, 2.2fr) ${Array.from({ length: Math.max(cols - 1, 0) }, () => 'minmax(0, 1fr)').join(' ')}`.trim();

  return (
    <div className="ui-skeleton-table" aria-busy="true" aria-label="Loading table">
      <div className="ui-skeleton-table__head" style={{ gridTemplateColumns: template }}>
        {Array.from({ length: cols }, (_, index) => (
          <Skeleton key={index} className="ui-skeleton--th" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="ui-skeleton-table__row" style={{ gridTemplateColumns: template }}>
          {Array.from({ length: cols }, (_, col) => (
            <Skeleton key={col} className="ui-skeleton--td" style={{ width: col === 0 ? '88%' : '70%' }} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 5 }) {
  return (
    <div className="ui-skeleton-list" aria-busy="true" aria-label="Loading list">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="ui-skeleton-list__row">
          <Skeleton className="ui-skeleton--avatar" />
          <div className="ui-skeleton-list__body">
            <Skeleton className="ui-skeleton--title" style={{ width: '42%', marginTop: 0 }} />
            <Skeleton className="ui-skeleton--line" style={{ width: '70%', marginTop: 8 }} />
          </div>
          <Skeleton className="ui-skeleton--btn" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPanel({ rows = 4 }) {
  return (
    <section className="mp-panel" aria-busy="true" aria-label="Loading">
      <div className="mp-panel__head">
        <div style={{ flex: 1 }}>
          <Skeleton className="ui-skeleton--title" style={{ width: '10rem', marginTop: 0 }} />
          <Skeleton className="ui-skeleton--line" style={{ width: '18rem', marginTop: 10 }} />
        </div>
      </div>
      <SkeletonList rows={rows} />
    </section>
  );
}

export function SkeletonPageHeader() {
  return (
    <header className="mp-header" aria-busy="true">
      <div style={{ flex: 1 }}>
        <Skeleton className="ui-skeleton--eyebrow" />
        <Skeleton className="ui-skeleton--page-title" />
        <Skeleton className="ui-skeleton--lede" />
      </div>
      <div className="mp-header__actions">
        <Skeleton className="ui-skeleton--btn ui-skeleton--btn-lg" />
        <Skeleton className="ui-skeleton--btn ui-skeleton--btn-lg" />
      </div>
    </header>
  );
}
