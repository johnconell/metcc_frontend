import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { ChevronDown, PieChart as PieIcon } from 'lucide-react';
import './program-distribution-card.css';

const PALETTE = [
  '#7B1020',
  '#D8901F',
  '#0d9488',
  '#6366f1',
  '#e11d48',
  '#8b5cf6',
  '#3b82f6',
  '#10b981',
];

function CustomPieTooltip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  const { program, count, percent } = item.payload;

  return (
    <div className="program-pie-tooltip" role="tooltip">
      <div className="program-pie-tooltip__title">{program}</div>
      <div className="program-pie-tooltip__row">
        <span>Applicants:</span>
        <strong>{Number(count).toLocaleString()}</strong>
      </div>
      <div className="program-pie-tooltip__row">
        <span>Share:</span>
        <strong style={{ color: item.payload.color }}>{percent}%</strong>
      </div>
    </div>
  );
}

export function ProgramDistributionCard({ preferredCourses = [] }) {
  const [filterRange, setFilterRange] = useState('all');

  const items = useMemo(() => {
    if (!Array.isArray(preferredCourses) || preferredCourses.length === 0) {
      return [];
    }

    return preferredCourses.slice(0, 5).map((course, idx) => ({
      ...course,
      color: PALETTE[idx % PALETTE.length],
    }));
  }, [preferredCourses]);

  return (
    <div className="dashboard-card program-dist-card">
      <div className="dashboard-card__header program-dist-card__header">
        <div className="dashboard-card__title-group">
          <div className="dashboard-card__title-icon">
            <PieIcon size={17} />
          </div>
          <div>
            <h3 className="dashboard-card__title" style={{ fontSize: '1.05rem' }}>
              Program Distribution
            </h3>
            <p className="dashboard-analytics__lede" style={{ margin: 0 }}>
              Preferred courses by applicant choice
            </p>
          </div>
        </div>

        <div className="passer-chart-select-wrap">
          <select
            className="passer-chart-select"
            value={filterRange}
            onChange={(e) => setFilterRange(e.target.value)}
            aria-label="Filter category timeframe"
            disabled
            title="Shows all recorded applicant preferences"
          >
            <option value="all">All cycles</option>
          </select>
          <ChevronDown size={14} className="passer-chart-select-icon" aria-hidden="true" />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="dashboard-empty-cell" style={{ padding: '2rem 0' }}>
          No program distribution data yet.
        </div>
      ) : (
        <div className="program-dist-content">
          <div className="program-dist-chart">
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie
                  data={items}
                  cx="50%"
                  cy="50%"
                  innerRadius={44}
                  outerRadius={68}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="program"
                  animationDuration={600}
                >
                  {items.map((entry) => (
                    <Cell key={entry.program} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="program-dist-legend" role="list">
            {items.map((item) => (
              <div key={item.program} className="program-dist-legend__row" role="listitem">
                <div className="program-dist-legend__info">
                  <span
                    className="program-dist-legend__dot"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <span className="program-dist-legend__name" title={item.program}>
                    {item.program}
                  </span>
                </div>
                <span className="program-dist-legend__percent">
                  {item.percent}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
