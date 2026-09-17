import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './passer-gauge-card.css';

export function PasserGaugeCard({
  totalPassers = 0,
  totalTested = 0,
  thisYearPassers = 0,
  thisYearTested = 0,
  thisYearLabel = String(new Date().getFullYear()),
}) {
  const [filterRange, setFilterRange] = useState('cycle');

  const qualified = filterRange === 'cycle'
    ? Number(thisYearPassers || 0)
    : Number(totalPassers || 0);

  const tested = filterRange === 'cycle'
    ? Number(thisYearTested || 0)
    : Number(totalTested || 0);

  const passRate = tested > 0 ? Math.round((qualified / tested) * 100) : 0;

  const totalTicks = 45;
  const activeTicks = Math.round((passRate / 100) * totalTicks);

  return (
    <div className="dashboard-card passer-gauge-card">
      <div className="dashboard-card__header passer-gauge-card__header">
        <div>
          <h3 className="dashboard-card__title" style={{ fontSize: '1.05rem' }}>
            Qualification Rate
          </h3>
          <p className="dashboard-analytics__lede" style={{ margin: 0 }}>
            Passer qualification benchmark
          </p>
        </div>

        <div className="passer-chart-select-wrap">
          <select
            className="passer-chart-select"
            value={filterRange}
            onChange={(e) => setFilterRange(e.target.value)}
            aria-label="Filter timeframe"
          >
            <option value="cycle">This cycle ({thisYearLabel})</option>
            <option value="all">All cycles</option>
          </select>
          <ChevronDown size={14} className="passer-chart-select-icon" aria-hidden="true" />
        </div>
      </div>

      <div className="passer-gauge-body">
        <svg
          viewBox="0 0 240 135"
          className="passer-gauge-svg"
          role="img"
          aria-label={`Qualification rate: ${passRate}%`}
        >
          {Array.from({ length: totalTicks }).map((_, i) => {
            const angle = Math.PI - (i / (totalTicks - 1)) * Math.PI;
            const rInner = 80;
            const rOuter = 100;
            const cx = 120;
            const cy = 118;

            const x1 = cx + rInner * Math.cos(angle);
            const y1 = cy - rInner * Math.sin(angle);
            const x2 = cx + rOuter * Math.cos(angle);
            const y2 = cy - rOuter * Math.sin(angle);

            const isActive = i < activeTicks;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isActive ? '#7B1020' : 'var(--gauge-track-color, #e5e0db)'}
                strokeWidth={2.6}
                strokeLinecap="round"
                className="passer-gauge-tick"
                style={isActive ? { stroke: 'var(--gauge-active-color, #7B1020)' } : {}}
              />
            );
          })}

          <text
            x="120"
            y="94"
            textAnchor="middle"
            className="passer-gauge-center-val"
          >
            {passRate}%
          </text>
          <text
            x="120"
            y="112"
            textAnchor="middle"
            className="passer-gauge-center-sub"
          >
            Overall Pass Rate
          </text>
        </svg>
      </div>

      <div className="passer-gauge-footer">
        <div className="passer-gauge-stat passer-gauge-stat--left">
          <span className="passer-gauge-stat__label">Qualified Passers</span>
          <strong className="passer-gauge-stat__val passer-gauge-stat__val--maroon">
            {qualified.toLocaleString()}
          </strong>
        </div>

        <div className="passer-gauge-stat passer-gauge-stat--right">
          <span className="passer-gauge-stat__label">Total Tested</span>
          <strong className="passer-gauge-stat__val passer-gauge-stat__val--gold">
            {tested.toLocaleString()}
          </strong>
        </div>
      </div>
    </div>
  );
}
