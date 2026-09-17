import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import './examinee-trend-card.css';

function MiniTrendTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  const val = payload[0].value;

  return (
    <div className="mini-trend-tooltip" role="tooltip">
      <div className="mini-trend-tooltip__label">{label}</div>
      <div className="mini-trend-tooltip__val">
        {Number(val).toLocaleString()} <span className="mini-trend-tooltip__sub">examinees</span>
      </div>
    </div>
  );
}

export function ExamineeTrendCard({ points = [], dailyTrends = [] }) {
  const [filterRange, setFilterRange] = useState('30d');

  const chartData = useMemo(() => {
    const days = filterRange === '7d' ? 7 : 30;

    if (Array.isArray(dailyTrends) && dailyTrends.length > 0) {
      return dailyTrends.slice(-days).map((p) => ({
        label: p.label || '',
        value: Number(p.examinees || 0),
      }));
    }

    if (Array.isArray(points) && points.length > 0) {
      return points.slice(-days).map((p) => ({
        label: p.label || '',
        value: Number(p.value || 0),
      }));
    }

    return [];
  }, [points, dailyTrends, filterRange]);

  const totalSum = useMemo(
    () => chartData.reduce((acc, cur) => acc + Number(cur.value || 0), 0),
    [chartData],
  );

  const hasData = chartData.some((d) => Number(d.value || 0) > 0);

  return (
    <div className="dashboard-card examinee-trend-card">
      <div className="dashboard-card__header examinee-trend-card__header">
        <div>
          <h3 className="dashboard-card__title" style={{ fontSize: '1.05rem' }}>
            Volume Trend
          </h3>
          <p className="dashboard-analytics__lede" style={{ margin: 0 }}>
            Daily examinee flow & turnout
          </p>
        </div>

        <div className="passer-chart-select-wrap">
          <select
            className="passer-chart-select"
            value={filterRange}
            onChange={(e) => setFilterRange(e.target.value)}
            aria-label="Filter volume timeframe"
          >
            <option value="30d">Last 30 days</option>
            <option value="7d">Last 7 days</option>
          </select>
          <ChevronDown size={14} className="passer-chart-select-icon" aria-hidden="true" />
        </div>
      </div>

      <div className="examinee-trend-summary">
        <span className="examinee-trend-summary__label">Recorded turnout</span>
        <div className="examinee-trend-summary__num-row">
          <strong className="examinee-trend-summary__val">
            {Number(totalSum).toLocaleString()}
          </strong>
        </div>
      </div>

      <div className="examinee-trend-chart-wrap">
        {!hasData ? (
          <div className="dashboard-empty-cell" style={{ display: 'grid', placeItems: 'center', height: 120 }}>
            No examinee volume recorded yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={chartData} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="examineeTrendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                tick={{ fontSize: 10.5, fill: 'var(--trend-tick-color, #8e8883)' }}
              />
              <Tooltip content={<MiniTrendTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#6366f1"
                strokeWidth={2.4}
                fill="url(#examineeTrendGrad)"
                dot={false}
                activeDot={{ r: 4.5, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
