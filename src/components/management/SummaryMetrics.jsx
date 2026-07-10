import './management.css';

export function SummaryMetrics({ metrics }) {
  return (
    <div className="mgmt-metrics" role="list" aria-label="Summary metrics">
      {metrics.map((metric) => (
        <div key={metric.label} className="mgmt-metric" role="listitem">
          <div className="mgmt-metric__label">{metric.label}</div>
          <div className="mgmt-metric__value">{metric.value}</div>
        </div>
      ))}
    </div>
  );
}
