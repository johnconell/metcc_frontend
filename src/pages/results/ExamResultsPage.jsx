import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Eye,
  Loader2,
  ScrollText,
  Search,
  UserX,
  Users,
  XCircle,
  BarChart3,
} from 'lucide-react';
import { examResultApi } from '../../api/examResultApi';
import { usePreferences } from '../../preferences/PreferencesContext';
import { ManagementToolbar, ManagementButton } from '../../components/management/ManagementToolbar';
import { DataTable } from '../../components/management/DataTable';
import { StatusBadge } from '../../components/management/StatusBadge';
import { Pagination } from '../../components/management/Pagination';
import { useTableState, statusVariant } from '../management/useTableState';
import '../../components/management/management.css';
import '../management/management-pages.css';

function outcomeVariant(outcome) {
  const value = String(outcome || '').toLowerCase();
  if (value === 'passed' || value === 'pass') return 'success';
  if (value === 'failed' || value === 'fail' || value === 'absent') return 'error';
  if (value === 'pending') return 'muted';
  return statusVariant(outcome);
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatDateLabel(date) {
  if (!date) return '—';
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const EMPTY_SUMMARY = {
  total: 0,
  passed: 0,
  failed: 0,
  absent: 0,
  pending: 0,
  average_score: 0,
};

export default function ExamResultsPage() {
  const { t } = usePreferences();
  const [viewMode, setViewMode] = useState('students');
  const [rows, setRows] = useState([]);
  const [filtersMeta, setFiltersMeta] = useState({ dates: [], batches: [] });
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dateFilter, setDateFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [attendanceBucket, setAttendanceBucket] = useState('all'); // all | took | didnt
  const [lookup, setLookup] = useState('');

  const loadResults = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (dateFilter !== 'all') params.date = dateFilter;
      if (batchFilter !== 'all') params.schedule_id = batchFilter;
      if (outcomeFilter !== 'all') params.outcome = outcomeFilter;
      if (lookup.trim()) params.search = lookup.trim();

      const { data } = await examResultApi.list(params);
      const mapped = (data.data || []).map((item) => ({
        id: item.id,
        studentName: item.student_name,
        applicantCode: item.applicant_code,
        email: item.email,
        batchLabel: item.batch_label,
        batchCode: item.batch_code,
        timeSlot: item.time_slot,
        examDate: item.date_label,
        examDateRaw: item.exam_date,
        scheduleId: item.schedule_id,
        score: item.display_score,
        scoreValue: item.score,
        outcome: item.outcome,
        outcomeLabel: item.outcome_label,
        attendance: item.attendance_status,
        coursePreference: item.course_preference || '—',
      }));

      setRows(mapped);
      setSummary(data.meta?.summary || EMPTY_SUMMARY);
      setFiltersMeta(data.meta?.filters || { dates: [], batches: [] });
    } catch (err) {
      setError(err.response?.data?.message || t('unableLoadResults'));
    } finally {
      setLoading(false);
    }
  }, [dateFilter, batchFilter, outcomeFilter, lookup, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadResults();
    }, lookup ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [loadResults, lookup]);

  const batchOptions = useMemo(() => {
    const batches = filtersMeta.batches || [];
    return dateFilter === 'all'
      ? batches
      : batches.filter((batch) => batch.exam_date === dateFilter);
  }, [filtersMeta.batches, dateFilter]);

  useEffect(() => {
    if (batchFilter === 'all') return;
    const stillValid = batchOptions.some((batch) => String(batch.id) === String(batchFilter));
    if (!stillValid) setBatchFilter('all');
  }, [batchOptions, batchFilter]);

  const dateCards = useMemo(() => {
    const batches = filtersMeta.batches || [];
    const dates = filtersMeta.dates || [];
    return dates.map((date) => {
      const dayBatches = batches.filter((batch) => batch.exam_date === date);
      return {
        date,
        label: formatDateLabel(date),
        batchCount: dayBatches.length,
        batches: dayBatches,
      };
    });
  }, [filtersMeta]);

  const dayAttendance = useMemo(() => {
    const took = rows.filter((row) =>
      ['passed', 'failed'].includes(row.outcome) || row.attendance === 'present',
    ).length;
    const didnt = rows.filter((row) =>
      row.outcome === 'absent'
      || row.attendance === 'absent'
      || (row.outcome === 'pending' && row.attendance !== 'present'),
    ).length;
    return { took, didnt };
  }, [rows]);

  const selectedBatch = useMemo(
    () => batchOptions.find((batch) => String(batch.id) === String(batchFilter)) || null,
    [batchOptions, batchFilter],
  );

  const table = useTableState(rows, {
    searchKeys: ['studentName', 'applicantCode', 'email', 'batchLabel', 'timeSlot', 'outcomeLabel'],
    pageSize: 10,
    filterFn: attendanceBucket === 'all'
      ? undefined
      : (row) => {
          const took = ['passed', 'failed'].includes(row.outcome)
            || row.attendance === 'present';
          const didnt = row.outcome === 'absent' || row.attendance === 'absent'
            || (row.outcome === 'pending' && row.attendance !== 'present');
          return attendanceBucket === 'took' ? took : didnt;
        },
  });

  const switchView = (mode) => {
    setViewMode(mode);
    table.setPage(1);
    if (mode === 'by-date') {
      setLookup('');
      setDateFilter('all');
      setBatchFilter('all');
      setAttendanceBucket('all');
    }
  };

  const openDate = (date) => {
    setDateFilter(date);
    setBatchFilter('all');
    table.setPage(1);
  };

  const openBatch = (batchId) => {
    setBatchFilter(String(batchId));
    table.setPage(1);
  };

  const backToDates = () => {
    setDateFilter('all');
    setBatchFilter('all');
    table.setPage(1);
  };

  const backToBatches = () => {
    setBatchFilter('all');
    table.setPage(1);
  };

  const outcomeLabel = (outcome) => {
    if (outcome === 'passed') return t('outcomePass');
    if (outcome === 'failed') return t('outcomeFail');
    if (outcome === 'absent') return t('outcomeAbsent');
    if (outcome === 'pending') return t('outcomePending');
    return outcome;
  };

  const columns = [
    {
      key: 'studentName',
      label: t('colExaminee'),
      sortable: true,
      render: (row) => (
        <div>
          <div className="mp-result-name">{row.studentName}</div>
          <div className="mp-table__sub">{row.applicantCode} · {row.email}</div>
        </div>
      ),
    },
    {
      key: 'batchLabel',
      label: t('colDayBatch'),
      sortable: true,
      render: (row) => (
        <Link to={`/management/schedules/${row.scheduleId}`} className="mp-batch-link">
          <strong>{row.batchLabel}</strong>
          <span>{row.timeSlot}</span>
        </Link>
      ),
    },
    {
      key: 'scoreValue',
      label: t('colScore'),
      sortable: true,
      render: (row) => (
        <span className={`mp-score${row.outcome === 'absent' ? ' mp-score--muted' : ''}`}>
          {row.score}
        </span>
      ),
    },
    {
      key: 'outcomeLabel',
      label: t('colResult'),
      sortable: true,
      render: (row) => (
        <StatusBadge variant={outcomeVariant(row.outcome)}>{outcomeLabel(row.outcome)}</StatusBadge>
      ),
    },
    {
      key: 'attendance',
      label: t('colAttendance'),
      sortable: true,
      render: (row) => (
        <StatusBadge variant={statusVariant(row.attendance)}>{row.attendance}</StatusBadge>
      ),
    },
    {
      key: 'coursePreference',
      label: t('colCoursePref'),
      sortable: true,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="mgmt-table__actions">
          <Link to={`/management/schedules/${row.scheduleId}`}>
            <ManagementButton variant="tertiary" size="sm" aria-label={`${t('openBatch')} ${row.studentName}`}>
              <Eye size={14} aria-hidden="true" /> {t('openBatch')}
            </ManagementButton>
          </Link>
        </div>
      ),
    },
  ];

  const showingBrowseDates = viewMode === 'by-date' && dateFilter === 'all';
  const showingDayStudents = viewMode === 'by-date' && dateFilter !== 'all';
  const showingStudentList = viewMode === 'students' || showingDayStudents;

  const dayHeading = selectedBatch
    ? `${formatDateLabel(dateFilter)}, ${selectedBatch.batch_code}`
    : formatDateLabel(dateFilter);

  const stats = [
    { key: 'total', label: t('statInView'), value: formatNumber(summary.total), icon: Users, tone: 'neutral' },
    { key: 'passed', label: t('statPassed'), value: formatNumber(summary.passed), icon: CheckCircle2, tone: 'success' },
    { key: 'failed', label: t('statFailed'), value: formatNumber(summary.failed), icon: XCircle, tone: 'danger' },
    { key: 'absent', label: t('statAbsent'), value: formatNumber(summary.absent), icon: UserX, tone: 'warn' },
    { key: 'pending', label: t('statPending'), value: formatNumber(summary.pending), icon: CircleDashed, tone: 'muted' },
    { key: 'average', label: t('statAverageScore'), value: summary.average_score || 0, icon: BarChart3, tone: 'accent' },
  ];

  return (
    <div className="mp-page">
      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">{t('resultsEyebrow')}</p>
          <h1 className="mp-header__title">{t('examResultsTitle')}</h1>
          <p className="mp-header__lede">{t('examResultsLede')}</p>
        </div>
      </header>

      <div className="mp-stats mp-stats--cards" aria-label="Result summary">
        {stats.map(({ key, label, value, icon: Icon, tone }) => (
          <div key={key} className={`mp-stats__item mp-stats__item--${tone}`}>
            <div className="mp-stats__icon" aria-hidden="true">
              <Icon size={18} />
            </div>
            <div className="mp-stats__copy">
              <div className="mp-stats__value">{value}</div>
              <div className="mp-stats__label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mp-view-toggle mp-view-toggle--prominent" role="tablist" aria-label="Result view">
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'students'}
          className={`mp-view-toggle__btn${viewMode === 'students' ? ' is-active' : ''}`}
          onClick={() => switchView('students')}
        >
          <Users size={16} aria-hidden="true" />
          {t('viewStudents')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={viewMode === 'by-date'}
          className={`mp-view-toggle__btn${viewMode === 'by-date' ? ' is-active' : ''}`}
          onClick={() => switchView('by-date')}
        >
          <CalendarDays size={16} aria-hidden="true" />
          {t('viewDateBatch')}
        </button>
      </div>

      {viewMode === 'students' && (
        <section className="mp-panel" aria-label="Result filters">
          <div className="mp-panel__head">
            <div>
              <h2 className="mp-panel__title"><Search size={16} /> {t('findTitle')}</h2>
              <p className="mp-panel__hint">{t('findHint')}</p>
            </div>
          </div>

          <div className="mp-result-filters">
            <label className="mp-field">
              <span className="mp-field__label">{t('examDay')}</span>
              <select
                className="mp-field__input"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setBatchFilter('all');
                  table.setPage(1);
                }}
              >
                <option value="all">{t('allDays')}</option>
                {(filtersMeta.dates || []).map((date) => (
                  <option key={date} value={date}>{formatDateLabel(date)}</option>
                ))}
              </select>
            </label>

            <label className="mp-field">
              <span className="mp-field__label">{t('batchTimeSlot')}</span>
              <select
                className="mp-field__input"
                value={batchFilter}
                onChange={(e) => {
                  setBatchFilter(e.target.value);
                  table.setPage(1);
                }}
              >
                <option value="all">{t('allBatches')}</option>
                {batchOptions.map((batch) => (
                  <option key={batch.id} value={batch.id}>{batch.label}</option>
                ))}
              </select>
            </label>

            <label className="mp-field">
              <span className="mp-field__label">{t('resultLabel')}</span>
              <select
                className="mp-field__input"
                value={outcomeFilter}
                onChange={(e) => {
                  setOutcomeFilter(e.target.value);
                  table.setPage(1);
                }}
              >
                <option value="all">{t('allOutcomes')}</option>
                <option value="passed">{t('outcomePass')}</option>
                <option value="failed">{t('outcomeFail')}</option>
                <option value="absent">{t('outcomeAbsent')}</option>
                <option value="pending">{t('outcomePending')}</option>
              </select>
            </label>

            <label className="mp-field mp-field--grow">
              <span className="mp-field__label">{t('searchExaminee')}</span>
              <input
                className="mp-field__input"
                type="search"
                value={lookup}
                onChange={(e) => {
                  setLookup(e.target.value);
                  table.setPage(1);
                }}
                placeholder={t('searchExamineePlaceholder')}
              />
            </label>
          </div>
        </section>
      )}

      {viewMode === 'by-date' && (
        <section className="mp-panel" aria-label="Browse by date and batch">
          <div className="mp-panel__head">
            <div>
              <h2 className="mp-panel__title"><CalendarDays size={16} /> {t('browseTitle')}</h2>
              <p className="mp-panel__hint">{t('browseHint')}</p>
            </div>
            <label className="mp-field mp-field--inline">
              <span className="mp-field__label">{t('resultLabel')}</span>
              <select
                className="mp-field__input mp-field__input--sm"
                value={outcomeFilter}
                onChange={(e) => {
                  setOutcomeFilter(e.target.value);
                  table.setPage(1);
                }}
              >
                <option value="all">{t('allOutcomes')}</option>
                <option value="passed">{t('outcomePass')}</option>
                <option value="failed">{t('outcomeFail')}</option>
                <option value="absent">{t('outcomeAbsent')}</option>
                <option value="pending">{t('outcomePending')}</option>
              </select>
            </label>
          </div>

          {dateFilter !== 'all' && (
            <nav className="mp-result-crumb" aria-label="Date batch breadcrumb">
              <button type="button" className="mp-result-crumb__link" onClick={backToDates}>
                {t('allDates')}
              </button>
              <span aria-hidden="true">/</span>
              <button
                type="button"
                className={`mp-result-crumb__link${batchFilter === 'all' ? ' is-current' : ''}`}
                onClick={backToBatches}
              >
                {formatDateLabel(dateFilter)}
              </button>
              {selectedBatch && (
                <>
                  <span aria-hidden="true">/</span>
                  <span className="mp-result-crumb__current">
                    {selectedBatch.batch_code} · {selectedBatch.time_slot}
                  </span>
                </>
              )}
            </nav>
          )}

          {showingBrowseDates && (
            <div className="mp-date-grid">
              {dateCards.length === 0 ? (
                <p className="mp-panel__hint">{t('noExamDates')}</p>
              ) : dateCards.map((card) => (
                <button
                  key={card.date}
                  type="button"
                  className="mp-date-card"
                  onClick={() => openDate(card.date)}
                >
                  <span className="mp-date-card__label">{card.label}</span>
                  <span className="mp-date-card__meta">
                    {card.batchCount === 1
                      ? t('batchCountOne')
                      : t('batchCountMany', { count: card.batchCount })}
                  </span>
                  <span className="mp-date-card__cta">{t('viewStudentsCta')}</span>
                </button>
              ))}
            </div>
          )}

          {showingDayStudents && (
            <>
              <div className="mp-batch-pills" role="group" aria-label="Attendance for selected day">
                <button
                  type="button"
                  className={`mp-batch-pill${attendanceBucket === 'all' ? ' is-active' : ''}`}
                  onClick={() => { setAttendanceBucket('all'); table.setPage(1); }}
                >
                  All ({formatNumber(rows.length)})
                </button>
                <button
                  type="button"
                  className={`mp-batch-pill${attendanceBucket === 'took' ? ' is-active' : ''}`}
                  onClick={() => { setAttendanceBucket('took'); table.setPage(1); }}
                >
                  Took the exam ({formatNumber(dayAttendance.took)})
                </button>
                <button
                  type="button"
                  className={`mp-batch-pill${attendanceBucket === 'didnt' ? ' is-active' : ''}`}
                  onClick={() => { setAttendanceBucket('didnt'); table.setPage(1); }}
                >
                  Did not take ({formatNumber(dayAttendance.didnt)})
                </button>
              </div>
              <div className="mp-batch-pills" role="group" aria-label="Batches for selected day">
              <button
                type="button"
                className={`mp-batch-pill${batchFilter === 'all' ? ' is-active' : ''}`}
                onClick={backToBatches}
              >
                {t('allBatchesThisDay')}
              </button>
              {batchOptions.map((batch) => (
                <button
                  key={batch.id}
                  type="button"
                  className={`mp-batch-pill${String(batchFilter) === String(batch.id) ? ' is-active' : ''}`}
                  onClick={() => openBatch(batch.id)}
                >
                  {batch.batch_code} · {batch.time_slot}
                </button>
              ))}
              </div>
            </>
          )}
        </section>
      )}

      {error && <div className="mp-alert mp-alert--error" role="alert">{error}</div>}

      {showingBrowseDates ? null : (
        <section className="mp-panel" aria-label="Result list">
          <div className="mp-panel__head">
            <div>
              <h2 className="mp-panel__title">
                {viewMode === 'by-date'
                  ? t('studentsForDay', { day: dayHeading })
                  : t('studentsHeading')}
              </h2>
              <p className="mp-panel__hint">
                {viewMode === 'by-date' ? t('studentsHintDay') : t('studentsHintAll')}
              </p>
            </div>
            {viewMode === 'by-date' && (
              <ManagementButton type="button" variant="secondary" size="sm" onClick={backToDates}>
                <ArrowLeft size={14} aria-hidden="true" /> {t('allDates')}
              </ManagementButton>
            )}
          </div>

          {showingStudentList && (
            <>
              <ManagementToolbar
                searchId="result-local-search"
                searchValue={table.search}
                onSearchChange={table.setSearch}
                searchPlaceholder={t('filterVisibleRows')}
              />

              {loading ? (
                <div className="mp-loading mp-loading--compact">
                  <Loader2 size={18} className="mp-loading__icon" />
                  {t('loadingResults')}
                </div>
              ) : (
                <>
                  <DataTable
                    columns={columns}
                    rows={table.rows}
                    rowKey="id"
                    sortKey={table.sortKey}
                    sortDir={table.sortDir}
                    onSort={table.onSort}
                    emptyTitle={t('noStudentsFound')}
                    emptyDescription={t('noStudentsHint')}
                    emptyIcon={ScrollText}
                  />
                  <Pagination
                    page={table.page}
                    pageSize={table.pageSize}
                    total={table.total}
                    onPageChange={table.setPage}
                  />
                </>
              )}
            </>
          )}
        </section>
      )}

      {showingBrowseDates && loading && (
        <div className="mp-loading mp-loading--compact">
          <Loader2 size={18} className="mp-loading__icon" />
          {t('loadingExamDays')}
        </div>
      )}
    </div>
  );
}
