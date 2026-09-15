import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileText, Trophy, Users } from 'lucide-react';
import { ManagementToolbar, ManagementButton } from '../../components/management/ManagementToolbar';
import { downloadExamResultsExport, examResultApi } from '../../api/examResultApi';
import { DataTable } from '../../components/management/DataTable';
import { FilterDropdown } from '../../components/management/FilterDropdown';
import { SkeletonPageHeader, SkeletonPanel, SkeletonStats } from '../../components/ui/Skeleton';
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

function formatDateLabel(date) {
  if (!date) return 'Unknown date';
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function flattenResultRows(payload) {
  const flat = Array.isArray(payload?.data) ? payload.data : [];
  if (flat.length > 0) return flat;

  const batches = Array.isArray(payload?.batches) ? payload.batches : [];
  return batches.flatMap((batch) =>
    (batch.students || []).map((student) => ({
      ...student,
      exam_date: student.exam_date || batch.exam_date,
      date_label: student.date_label || batch.date_label,
      batch_code: student.batch_code || batch.batch_code,
      batch_label: student.batch_label || batch.batch_label,
    })),
  );
}

export default function ReportsAnalyticsPage() {
  const [dateFilter, setDateFilter] = useState('all');
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: payload } = await examResultApi.list();
      setRows(flattenResultRows(payload));
      setSummary(payload.meta?.summary || null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load examination results.');
      setRows([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const reportRows = useMemo(() => rows.map((row) => {
    const examDate = row.exam_date || row.examination_date || '';
    const outcome = String(row.outcome || row.result_status || row.status || '').toLowerCase();
    return {
      id: row.registration_id || row.id,
      studentName: row.student_name || row.name || '—',
      studentId: row.applicant_code || '—',
      exam: row.batch_label || row.batch_code || row.exam_title || 'Examination',
      score: Number(row.score || 0),
      date: examDate,
      dateLabel: row.date_label || formatDateLabel(examDate),
      outcome,
    };
  }), [rows]);

  const chartData = useMemo(() => {
    const filtered = dateFilter === 'all'
      ? reportRows
      : reportRows.filter((row) => row.date === dateFilter || row.dateLabel === dateFilter);

    const grouped = Object.values(filtered.reduce((groups, row) => {
      const key = row.date || row.dateLabel || 'Unknown date';
      const label = row.dateLabel || formatDateLabel(row.date);
      const item = groups[key] || { key, label, value: 0, passed: 0, sortDate: row.date || '' };
      item.value += 1;
      if (row.outcome === 'passed' || row.outcome === 'pass') {
        item.passed += 1;
      }
      groups[key] = item;
      return groups;
    }, {}));

    return grouped
      .map((item) => ({
        ...item,
        passRate: item.value ? Math.round((item.passed / item.value) * 100) : 0,
      }))
      .sort((a, b) => String(a.sortDate).localeCompare(String(b.sortDate)))
      .slice(-8);
  }, [reportRows, dateFilter]);

  const topPerformers = useMemo(() => {
    const filtered = dateFilter === 'all'
      ? reportRows
      : reportRows.filter((row) => row.date === dateFilter || row.dateLabel === dateFilter);

    return [...filtered]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((row, index) => ({ ...row, rank: index + 1 }));
  }, [reportRows, dateFilter]);

  const reportDates = useMemo(() => {
    const map = new Map();
    reportRows.forEach((row) => {
      if (!row.date && !row.dateLabel) return;
      const value = row.date || row.dateLabel;
      if (!map.has(value)) map.set(value, row.dateLabel || formatDateLabel(row.date));
    });
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
  }, [reportRows]);

  const table = useTableState(topPerformers, {
    searchKeys: ['studentName', 'studentId', 'exam'],
    pageSize: 5,
  });

  const totalExaminees = summary?.total ?? reportRows.length;
  const completedExams = summary?.total ?? reportRows.length;
  const passedCount = summary?.passed ?? reportRows.filter((row) => row.outcome === 'passed' || row.outcome === 'pass').length;
  const passRate = completedExams
    ? Math.round((passedCount / completedExams) * 100)
    : 0;
  const averageScore = summary?.average_score != null
    ? Math.round(Number(summary.average_score))
    : (completedExams
      ? Math.round(reportRows.reduce((sum, row) => sum + row.score, 0) / Math.max(reportRows.length, 1))
      : 0);

  const exportResults = async (scope) => {
    try {
      await downloadExamResultsExport({ scope });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to export examination results.');
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

  if (loading) {
    return (
      <div className="mp-page rp-loading" aria-busy="true" aria-label="Loading reports and analytics">
        <div className="rp-loading__status" role="status" aria-live="polite">
          <span className="rp-loading__dot" aria-hidden="true" />
          Preparing analytics...
        </div>
        <div className="rp-loading__stage rp-loading__stage--header"><SkeletonPageHeader /></div>
        <div className="rp-loading__stage rp-loading__stage--stats"><SkeletonStats count={4} /></div>
        <div className="mp-split rp-loading__stage rp-loading__stage--panels">
          <SkeletonPanel rows={4} />
          <SkeletonPanel rows={5} />
        </div>
        <div className="rp-loading__stage rp-loading__stage--table"><SkeletonPanel rows={5} /></div>
      </div>
    );
  }

  return (
    <div className="mp-page">
      <header className="mp-header">
        <div>
          <h1 className="mp-header__title">Reports &amp; Analytics</h1>
          <p className="mp-header__lede">
            Track performance trends and export examination reports.
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
          <span className="mp-stats__icon" aria-hidden="true"><Users size={18} /></span>
          <div className="mp-stats__value">{Number(totalExaminees).toLocaleString()}</div>
          <div className="mp-stats__label">Total examinees</div>
        </div>
        <div className="mp-stats__item">
          <span className="mp-stats__icon" aria-hidden="true"><FileText size={18} /></span>
          <div className="mp-stats__value">{Number(completedExams).toLocaleString()}</div>
          <div className="mp-stats__label">Completed exams</div>
        </div>
        <div className="mp-stats__item">
          <span className="mp-stats__icon" aria-hidden="true"><Trophy size={18} /></span>
          <div className="mp-stats__value">{passRate}%</div>
          <div className="mp-stats__label">Pass rate</div>
        </div>
        <div className="mp-stats__item">
          <span className="mp-stats__icon" aria-hidden="true"><BarChart3 size={18} /></span>
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
                ...reportDates.map((date) => ({ value: date.value, label: date.label })),
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
          <div className="mp-list-table-wrap">
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
          </div>
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
                ...reportDates.map((date) => ({ value: date.value, label: date.label })),
              ]}
            />,
          ]}
        />
        <div style={{ height: 'var(--space-base)' }} aria-hidden="true" />
        <div className="mp-kv">
          {chartData.length === 0 ? (
            <div className="mp-kv__row">
              <span className="mp-kv__key">No completed exams yet</span>
              <span className="mp-kv__val">—</span>
            </div>
          ) : chartData.map((item) => (
            <div key={item.key || item.label} className="mp-kv__row">
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
