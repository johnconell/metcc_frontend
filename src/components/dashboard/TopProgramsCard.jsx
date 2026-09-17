import { useMemo, useState } from 'react';
import { ChevronDown, GraduationCap } from 'lucide-react';
import './top-programs-card.css';

const COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ec4899', '#3b82f6'];

export function TopProgramsCard({ preferredCourses = [] }) {
  const [filterRange, setFilterRange] = useState('all');

  const items = useMemo(() => {
    if (!Array.isArray(preferredCourses) || preferredCourses.length === 0) {
      return [];
    }

    return preferredCourses.slice(0, 4).map((p, idx) => ({
      ...p,
      color: p.color || COLORS[idx % COLORS.length],
    }));
  }, [preferredCourses]);

  return (
    <div className="dashboard-card top-programs-card">
      <div className="dashboard-card__header top-programs-card__header">
        <div>
          <h3 className="dashboard-card__title" style={{ fontSize: '1.05rem' }}>
            Top Preferred Programs
          </h3>
          <p className="dashboard-analytics__lede" style={{ margin: 0 }}>
            Ranked by total applicant choices
          </p>
        </div>

        <div className="passer-chart-select-wrap">
          <select
            className="passer-chart-select"
            value={filterRange}
            onChange={(e) => setFilterRange(e.target.value)}
            aria-label="Filter timeframe"
            disabled
            title="Shows all recorded applicant preferences"
          >
            <option value="all">All cycles</option>
          </select>
          <ChevronDown size={14} className="passer-chart-select-icon" aria-hidden="true" />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="dashboard-empty-cell" style={{ padding: '1.5rem 0' }}>
          No preferred program data yet.
        </div>
      ) : (
        <div className="top-programs-list">
          {items.map((item) => (
            <div key={item.program} className="top-programs-item">
              <div className="top-programs-item__head">
                <div className="top-programs-item__name-group">
                  <span
                    className="top-programs-item__avatar"
                    style={{ backgroundColor: `${item.color}1f`, color: item.color }}
                  >
                    <GraduationCap size={14} />
                  </span>
                  <span className="top-programs-item__name">{item.program}</span>
                </div>
                <div className="top-programs-item__metric">
                  <strong>{Number(item.count || 0).toLocaleString()}</strong>
                  <span className="top-programs-item__pct">({Number(item.percent || 0)}%)</span>
                </div>
              </div>

              <div className="top-programs-item__track" role="presentation" aria-hidden="true">
                <div
                  className="top-programs-item__fill"
                  style={{
                    width: `${Math.max(Number(item.percent || 0) * 2.5, 4)}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
