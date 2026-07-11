import { useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText, Trophy } from 'lucide-react';
import { ManagementToolbar, ManagementButton } from '../../components/management/ManagementToolbar';
import { DataTable } from '../../components/management/DataTable';
import { FilterDropdown } from '../../components/management/FilterDropdown';
import { useTableState } from '../management/useTableState';
import '../../components/management/management.css';
import '../management/management-pages.css';
import './results-pages.css';

const CHART_DATA = [
  { label: 'May 28', value: 42, passRate: 78 },
  { label: 'May 29', value: 38, passRate: 82 },
  { label: 'May 30', value: 51, passRate: 71 },
  { label: 'May 31', value: 45, passRate: 84 },
  { label: 'Jun 1', value: 33, passRate: 76 },
  { label: 'Jun 2', value: 29, passRate: 79 },
];

const TOP_PERFORMERS = [
  { id: 1, studentName: 'Ana Patricia Lim', studentId: '2025-004', exam: 'College Admission Test', score: 91, rank: 1 },
  { id: 2, studentName: 'Juan Dela Cruz', studentId: '2025-001', exam: 'College Admission Test', score: 87, rank: 2 },
  { id: 3, studentName: 'Camille Torres', studentId: '2025-008', exam: 'Course Placement Test', score: 83, rank: 3 },
  { id: 4, studentName: 'Rafael Bautista', studentId: '2025-007', exam: 'Scholarship Examination', score: 78, rank: 4 },
  { id: 5, studentName: 'Maria Clara Reyes', studentId: '2025-002', exam: 'Scholarship Examination', score: 72, rank: 5 },
];

const REPORT_DATES = [...new Set(CHART_DATA.map((d) => d.label))];
const CHART_MAX = Math.max(...CHART_DATA.map((d) => d.value));

function PerformanceBarChart() {
  return (
    <div className="rp-chart" role="img" aria-label="Dashboard chart showing completed exams by date">
      <div className="rp-chart__bars">
        {CHART_DATA.map((item) => (
          <div key={item.label} className="rp-chart__col">
            <div className="rp-chart__bar-wrap">
              <div
                className="rp-chart__bar"
                style={{ height: `${(item.value / CHART_MAX) * 100}%` }}
                title={`${item.value} completed exams`}
              />
            </div>
            <span className="rp-chart__label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ReportsAnalyticsPage() {
  const [dateFilter, setDateFilter] = useState('all');

  const table = useTableState(TOP_PERFORMERS, {
    searchKeys: ['studentName', 'studentId', 'exam'],
    pageSize: 5,
    filterFn: dateFilter === 'all' ? undefined : () => true,
  });

  const totalExaminees = 2483;
  const completedExams = 2196;
  const passRate = 78;
  const averageScore = 72;

  const columns = [
    { key: 'rank', label: 'Rank', sortable: true },
    { key: 'studentName', label: 'Student', sortable: true },
    { key: 'studentId', label: 'Student ID', sortable: true },
    { key: 'exam', label: 'Examination', sortable: true },
    {
      key: 'score',
      label: 'Score',
      sortable: true,
      render: (row) => <span>{row.score}%</span>,
    },
  ];

  return (
    <div className="mp-page">
      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">Results &amp; Reports</p>
          <h1 className="mp-header__title">Reports &amp; Analytics</h1>
          <p className="mp-header__lede">
            Dashboard charts, performance metrics, and exportable reports for examination cycles.
          </p>
        </div>
        <div className="mp-header__actions">
          <ManagementButton variant="secondary">
            <FileText size={16} aria-hidden="true" /> Export PDF
          </ManagementButton>
          <ManagementButton variant="secondary">
            <FileSpreadsheet size={16} aria-hidden="true" /> Export Excel
          </ManagementButton>
          <ManagementButton variant="primary">
            <Download size={16} aria-hidden="true" /> Export Reports
          </ManagementButton>
        </div>
      </header>

      <div className="mp-stats" aria-label="Analytics summary">
        <div className="mp-stats__item">
          <div className="mp-stats__value">{totalExaminees.toLocaleString()}</div>
          <div className="mp-stats__label">Total examinees</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{completedExams.toLocaleString()}</div>
          <div className="mp-stats__label">Completed exams</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{passRate}%</div>
          <div className="mp-stats__label">Pass rate</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{averageScore}%</div>
          <div className="mp-stats__label">Average score</div>
        </div>
      </div>

      <div className="mp-split">
        <section className="mp-panel" aria-label="Dashboard charts">
          <div className="mp-panel__title-row">
            <h2 className="mp-panel__title">Dashboard Charts</h2>
            <FilterDropdown
              id="reports-date-filter"
              value={dateFilter}
              onChange={setDateFilter}
              options={[
                { value: 'all', label: 'All dates' },
                ...REPORT_DATES.map((date) => ({ value: date, label: date })),
              ]}
            />
          </div>
          <p className="rp-chart__subtitle">Completed exams by date</p>
          <PerformanceBarChart />
          <div className="rp-chart__legend">
            <span className="rp-chart__legend-item">
              <span className="rp-chart__legend-swatch" aria-hidden="true" />
              Completed exams
            </span>
            <span className="rp-chart__legend-item rp-chart__legend-item--muted">
              <BarChart3 size={14} aria-hidden="true" />
              Reports by date
            </span>
          </div>
        </section>

        <section className="mp-panel" aria-label="Top performers">
          <h2 className="mp-panel__title">
            <Trophy size={18} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 6 }} />
            Top Performers
          </h2>
          <DataTable
            columns={columns}
            rows={table.rows}
            rowKey="id"
            sortKey={table.sortKey}
            sortDir={table.sortDir}
            onSort={table.onSort}
            emptyTitle="No performers listed"
            emptyDescription="Results will appear once exams are completed."
            emptyIcon={Trophy}
          />
        </section>
      </div>

      <section className="mp-panel" aria-label="Reports by date">
        <ManagementToolbar
          searchId="reports-search"
          searchValue={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Search reports by date or exam"
          filters={[
            <FilterDropdown
              key="date"
              id="reports-range-filter"
              value={dateFilter}
              onChange={(value) => {
                setDateFilter(value);
                table.setPage(1);
              }}
              options={[
                { value: 'all', label: 'All dates' },
                ...REPORT_DATES.map((date) => ({ value: date, label: date })),
              ]}
            />,
          ]}
        />
        <div style={{ height: 'var(--space-base)' }} aria-hidden="true" />
        <div className="mp-kv">
          {CHART_DATA.map((item) => (
            <div key={item.label} className="mp-kv__row">
              <span className="mp-kv__key">{item.label}</span>
              <span className="mp-kv__val">
                {item.value} completed · {item.passRate}% pass rate
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
