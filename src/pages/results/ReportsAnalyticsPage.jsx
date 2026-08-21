import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText, Trophy } from 'lucide-react';
import { ManagementToolbar, ManagementButton } from '../../components/management/ManagementToolbar';
import api from '../../api/axios';
import { DataTable } from '../../components/management/DataTable';
import { FilterDropdown } from '../../components/management/FilterDropdown';
import { useTableState } from '../management/useTableState';
import '../../components/management/management.css';
import '../management/management-pages.css';
import './results-pages.css';
function PerformanceBarChart({ data }) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <div className="rp-chart" role="img" aria-label="Dashboard chart showing completed exams by date">
      <div className="rp-chart__bars">
        {data.map((item) => (
          <div key={item.label} className="rp-chart__col">
            <div className="rp-chart__bar-wrap">
              <div
                className="rp-chart__bar"
                style={{ height: `${(item.value / max) * 100}%` }}
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
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: json } = await api.get('/exam-results');
      setRows(json.data || []);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load examination results.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const reportRows = useMemo(() => rows.map((row) => ({
    id: row.registration_id || row.id,
    studentName: row.student_name || row.name || '—',
    studentId: row.applicant_code || '—',
    exam: row.batch_label || row.batch_code || 'Examination',
    score: Number(row.score || 0),
    date: row.exam_date || '',
    outcome: row.outcome || row.result_status,
  })), [rows]);

  const chartData = useMemo(() => Object.values(reportRows.reduce((groups, row) => {
    const label = row.date || 'Unknown date';
    const item = groups[label] || { label, value: 0, passed: 0 };
    item.value += 1;
    if (row.outcome === 'passed') item.passed += 1;
    groups[label] = item;
    return groups;
  }, {})).map((item) => ({ ...item, passRate: item.value ? Math.round((item.passed / item.value) * 100) : 0 })).slice(-8), [reportRows]);

  const topPerformers = useMemo(() => [...reportRows].sort((a, b) => b.score - a.score).slice(0, 5).map((row, index) => ({ ...row, rank: index + 1 })), [reportRows]);
  const reportDates = useMemo(() => [...new Set(chartData.map((item) => item.label))], [chartData]);

  const table = useTableState(topPerformers.filter((row) => dateFilter === 'all' || row.date === dateFilter), {
    searchKeys: ['studentName', 'studentId', 'exam'],
    pageSize: 5,
    filterFn: dateFilter === 'all' ? undefined : () => true,
  });

  const totalExaminees = reportRows.length;
  const completedExams = reportRows.length;
  const passRate = completedExams ? Math.round((reportRows.filter((row) => row.outcome === 'passed').length / completedExams) * 100) : 0;
  const averageScore = completedExams ? Math.round(reportRows.reduce((sum, row) => sum + row.score, 0) / completedExams) : 0;

  const exportResults = async (scope) => {
    try {
      const response = await api.get('/exam-results/export', {
        params: { scope },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `exam-results-${scope}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to export examination results.');
    }
  };

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
          <ManagementButton variant="secondary" onClick={() => exportResults('all')}>
            <FileText size={16} aria-hidden="true" /> Export PDF
          </ManagementButton>
          <ManagementButton variant="secondary" onClick={() => exportResults('all')}>
            <FileSpreadsheet size={16} aria-hidden="true" /> Export Excel
          </ManagementButton>
          <ManagementButton variant="primary" onClick={() => exportResults('all')}>
            <Download size={16} aria-hidden="true" /> Export Reports
          </ManagementButton>
        </div>
      </header>

      {error ? <div className="mp-alert mp-alert--error" role="alert">{error}</div> : null}

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
                ...reportDates.map((date) => ({ value: date, label: date })),
              ]}
            />
          </div>
          <p className="rp-chart__subtitle">Completed exams by date</p>
          <PerformanceBarChart data={chartData} />
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
                ...reportDates.map((date) => ({ value: date, label: date })),
              ]}
            />,
          ]}
        />
        <div style={{ height: 'var(--space-base)' }} aria-hidden="true" />
        <div className="mp-kv">
          {chartData.map((item) => (
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
