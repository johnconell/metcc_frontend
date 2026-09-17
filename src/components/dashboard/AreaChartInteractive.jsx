import { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ChevronDown } from 'lucide-react';
import './area-chart-interactive.css';

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="shadcn-chart-tooltip" role="tooltip">
      <div className="shadcn-chart-tooltip__date">{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="shadcn-chart-tooltip__item">
          <span className="shadcn-chart-tooltip__label">
            <span
              className="shadcn-chart-tooltip__swatch"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span className="shadcn-chart-tooltip__val">
            {Number(entry.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export function AreaChartInteractive({
  data = [],
  title = 'Examination & Applicant Trends',
  subtitle,
}) {
  const [timeRange, setTimeRange] = useState('90d');

  const daysCount = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

  const chartData = useMemo(() => {
    const rawList = Array.isArray(data) ? data : [];
    return rawList.slice(-daysCount);
  }, [data, daysCount]);

  const hasData = chartData.some(
    (d) => Number(d.applicants || 0) > 0 || Number(d.examinees || 0) > 0,
  );

  const rangeLabel = timeRange === '7d' ? 'last 7 days' : timeRange === '30d' ? 'last 30 days' : 'last 3 months';
  const displaySubtitle = subtitle || `Track examination schedules and student applications over the ${rangeLabel}`;

  const currentApplicantsSum = useMemo(
    () => chartData.reduce((sum, d) => sum + Number(d.applicants || 0), 0),
    [chartData],
  );
  const currentExamineesSum = useMemo(
    () => chartData.reduce((sum, d) => sum + Number(d.examinees || 0), 0),
    [chartData],
  );

  return (
    <div className="shadcn-chart-card">
      <div className="shadcn-chart-header">
        <div className="shadcn-chart-header__info">
          <h2 className="shadcn-chart-header__title">{title}</h2>
          <p className="shadcn-chart-header__subtitle">{displaySubtitle}</p>
        </div>

        <div className="shadcn-chart-controls">
          <div className="shadcn-chart-select-wrap">
            <select
              className="shadcn-chart-select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              aria-label="Select date range"
            >
              <option value="90d">Last 3 months</option>
              <option value="30d">Last 30 days</option>
              <option value="7d">Last 7 days</option>
            </select>
            <ChevronDown size={14} className="shadcn-chart-select-icon" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="shadcn-chart-summary-row">
        <div className="shadcn-chart-pill">
          <span className="shadcn-chart-pill__indicator shadcn-chart-pill__indicator--maroon" />
          <span>Applicants:</span>
          <strong>{currentApplicantsSum.toLocaleString()}</strong>
        </div>
        <div className="shadcn-chart-pill">
          <span className="shadcn-chart-pill__indicator shadcn-chart-pill__indicator--gold" />
          <span>Scheduled Examinees:</span>
          <strong>{currentExamineesSum.toLocaleString()}</strong>
        </div>
      </div>

      <div className="shadcn-chart-canvas">
        {!hasData ? (
          <div className="dashboard-empty-cell" style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
            No examination or applicant volume recorded for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 12, right: 10, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillApplicants" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7B1020" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#7B1020" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fillExaminees" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D8901F" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#D8901F" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="text-gray-200 dark:text-[#23242c]"
                opacity={0.65}
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                minTickGap={28}
                tick={{ fontSize: 11, fill: '#888888' }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tick={{ fontSize: 11, fill: '#888888' }}
                tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val)}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="applicants"
                name="Applicants"
                stroke="#7B1020"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#fillApplicants)"
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
              />

              <Area
                type="monotone"
                dataKey="examinees"
                name="Examinees"
                stroke="#D8901F"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#fillExaminees)"
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#ffffff' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="shadcn-chart-legend">
        <span className="shadcn-chart-legend__item">
          <span
            className="shadcn-chart-legend__box"
            style={{ backgroundColor: '#7B1020' }}
          />
          Applicants
        </span>
        <span className="shadcn-chart-legend__item">
          <span
            className="shadcn-chart-legend__box"
            style={{ backgroundColor: '#D8901F' }}
          />
          Examinees
        </span>
      </div>
    </div>
  );
}
