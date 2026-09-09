import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Loader2,
  Mail,
  ScrollText,
  Search,
  Users,
  XCircle,
} from 'lucide-react';
import { downloadExamResultsExport, examResultApi } from '../../api/examResultApi';
import { ManagementButton } from '../../components/management/ManagementToolbar';
import { StatusBadge } from '../../components/management/StatusBadge';
import { SkeletonCardGrid, SkeletonStats, SkeletonTable } from '../../components/ui/Skeleton';
import { statusVariant } from '../management/useTableState';
import {
  alertFromApiError,
  confirmAction,
  showLoading,
  closeLoading,
  toastSuccess,
} from '../../utils/swal';
import '../../components/management/management.css';
import '../management/management-pages.css';
import './results-pages.css';

function outcomeVariant(outcome) {
  const value = String(outcome || '').toLowerCase();
  if (value === 'passed' || value === 'pass') return 'success';
  if (value === 'failed' || value === 'fail') return 'error';
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
  average_score: 0,
  email_sent: 0,
  email_not_sent: 0,
};

export default function ExamResultsPage() {
  const [batches, setBatches] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyBatch, setBusyBatch] = useState(null);

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState('all');
  const [exporting, setExporting] = useState(false);

  const loadResults = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await examResultApi.list();
      setBatches(data.batches || []);
      setSummary(data.meta?.summary || EMPTY_SUMMARY);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load examination results.');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const dateGroups = useMemo(() => {
    const map = new Map();
    batches.forEach((batch) => {
      const key = batch.exam_date;
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, {
          date: key,
          label: batch.date_label || formatDateLabel(key),
          slots: [],
          examinees: 0,
          passed: 0,
          failed: 0,
        });
      }
      const group = map.get(key);
      group.slots.push(batch);
      group.examinees += Number(batch.total || 0);
      group.passed += Number(batch.passed || 0);
      group.failed += Number(batch.failed || 0);
    });
    return Array.from(map.values()).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [batches]);

  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    return (dateGroups.find((g) => g.date === selectedDate)?.slots || [])
      .slice()
      .sort((a, b) => String(a.time_slot || '').localeCompare(String(b.time_slot || '')));
  }, [dateGroups, selectedDate]);

  const selectedBatch = useMemo(
    () => timeSlots.find((b) => String(b.schedule_id) === String(selectedScheduleId)) || null,
    [timeSlots, selectedScheduleId],
  );

  const filteredStudents = useMemo(() => {
    const students = selectedBatch?.students || [];
    const q = studentSearch.trim().toLowerCase();
    return students.filter((row) => {
      if (outcomeFilter !== 'all' && row.outcome !== outcomeFilter) return false;
      if (!q) return true;
      return [row.student_name, row.applicant_code, row.gmail, row.email, row.program_desire]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [selectedBatch, studentSearch, outcomeFilter]);

  const level = selectedScheduleId ? 'students' : selectedDate ? 'batches' : 'dates';

  const sendBatchScores = async (batch) => {
    const key = batch.schedule_id || batch.batch_code;
    if (!key) return;
    const ok = await confirmAction({
      title: 'Are you sure?',
      text: `Send scores to Gmail for all students in ${batch.batch_code}? This action cannot be undone.`,
    });
    if (!ok) return;

    setBusyBatch(String(key));
    setNotice('');
    showLoading('Sending Scores...');
    try {
      const { data } = await examResultApi.sendBatchEmail(key);
      closeLoading();
      setNotice(data.message || `Queued emails for ${batch.batch_code}.`);
      await toastSuccess(data.message || 'Scores Sent Successfully');
      await loadResults();
    } catch (err) {
      closeLoading();
      setNotice(err.response?.data?.message || 'Failed to send batch emails.');
      await alertFromApiError(err, 'Failed to send batch emails.');
    } finally {
      setBusyBatch(null);
    }
  };

  const exportResults = async (scope) => {
    setExporting(true);
    setError('');
    setNotice('');
    try {
      const params = { scope };
      if (scope === 'date') {
        if (!selectedDate) {
          setError('Select an examination date before exporting by date.');
          return;
        }
        params.date = selectedDate;
      }
      if (scope === 'batch') {
        if (!selectedScheduleId) {
          setError('Open a batch before exporting by batch.');
          return;
        }
        params.schedule_id = selectedScheduleId;
      }
      await downloadExamResultsExport(params);
      setNotice(
        scope === 'all'
          ? 'Exported all examination results.'
          : scope === 'date'
            ? `Exported results for ${selectedDate}.`
            : 'Exported results for the selected batch.',
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to export examination results.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="mp-page">
      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">Results</p>
          <h1 className="mp-header__title">Examination Results</h1>
          <p className="mp-header__lede">
            Review exam scores by date, batch, and student.
          </p>
        </div>
        <div className="mp-header__actions">
          <ManagementButton
            type="button"
            variant="secondary"
            disabled={exporting || loading}
            onClick={() => exportResults('all')}
          >
            {exporting ? <Loader2 size={16} className="mp-loading__icon" /> : <Download size={16} />}
            Export All
          </ManagementButton>
          <ManagementButton
            type="button"
            variant="secondary"
            disabled={exporting || loading || !selectedDate}
            onClick={() => exportResults('date')}
          >
            <Download size={16} /> Export Date
          </ManagementButton>
          <ManagementButton
            type="button"
            variant="secondary"
            disabled={exporting || loading || !selectedScheduleId}
            onClick={() => exportResults('batch')}
          >
            <Download size={16} /> Export Batch
          </ManagementButton>
        </div>
      </header>

      <div className="mp-stats">
        <div className="mp-stats__item">
          <span className="mp-stats__icon" aria-hidden="true"><CalendarDays size={18} /></span>
          <div className="mp-stats__value">{formatNumber(dateGroups.length)}</div>
          <div className="mp-stats__label">Exam days</div>
        </div>
        <div className="mp-stats__item">
          <span className="mp-stats__icon" aria-hidden="true"><ScrollText size={18} /></span>
          <div className="mp-stats__value">{formatNumber(batches.length)}</div>
          <div className="mp-stats__label">Batches with results</div>
        </div>
        <div className="mp-stats__item">
          <span className="mp-stats__icon" aria-hidden="true"><Users size={18} /></span>
          <div className="mp-stats__value">{formatNumber(summary.total)}</div>
          <div className="mp-stats__label">Completed examinees</div>
        </div>
        <div className="mp-stats__item">
          <span className="mp-stats__icon" aria-hidden="true"><CheckCircle2 size={18} /></span>
          <div className="mp-stats__value">{formatNumber(summary.passed)}</div>
          <div className="mp-stats__label">Passed</div>
        </div>
        <div className="mp-stats__item">
          <span className="mp-stats__icon" aria-hidden="true"><XCircle size={18} /></span>
          <div className="mp-stats__value">{formatNumber(summary.failed)}</div>
          <div className="mp-stats__label">Failed</div>
        </div>
      </div>

      <nav className="mp-result-crumb" aria-label="Results breadcrumb">
        <button
          type="button"
          className={`mp-result-crumb__link${level === 'dates' ? ' is-current' : ''}`}
          onClick={() => {
            setSelectedDate(null);
            setSelectedScheduleId(null);
            setStudentSearch('');
          }}
        >
          All dates
        </button>
        {selectedDate && (
          <>
            <span aria-hidden="true">/</span>
            <button
              type="button"
              className={`mp-result-crumb__link${level === 'batches' ? ' is-current' : ''}`}
              onClick={() => {
                setSelectedScheduleId(null);
                setStudentSearch('');
              }}
            >
              {formatDateLabel(selectedDate)}
            </button>
          </>
        )}
        {selectedBatch && (
          <>
            <span aria-hidden="true">/</span>
            <span className="mp-result-crumb__current">
              {selectedBatch.batch_code} · {selectedBatch.time_slot}
            </span>
          </>
        )}
      </nav>

      {error && <div className="mp-alert mp-alert--error" role="alert">{error}</div>}
      {notice && <div className="mp-panel__hint" role="status">{notice}</div>}

      {loading ? (
        <>
          <SkeletonStats count={4} />
          <SkeletonCardGrid count={6} />
          <SkeletonTable rows={6} cols={5} />
        </>
      ) : level === 'dates' ? (
        <section className="mp-panel">
          <div className="mp-panel__head">
            <div>
              <h2 className="mp-panel__title"><CalendarDays size={16} /> Result dates</h2>
              <p className="mp-panel__hint">Click a date to see batches with completed examinations.</p>
            </div>
          </div>
          <div className="mp-date-grid">
            {dateGroups.length === 0 ? (
              <div className="mp-empty">
                <ScrollText size={28} />
                <h2>No completed examinations</h2>
                <p>Students appear here only after they submit an exam with a score.</p>
              </div>
            ) : dateGroups.map((group) => (
              <button
                key={group.date}
                type="button"
                className="mp-date-card"
                onClick={() => setSelectedDate(group.date)}
              >
                <span className="mp-date-card__label">{group.label}</span>
                <span className="mp-date-card__meta">
                  {group.slots.length} batch{group.slots.length === 1 ? '' : 'es'}
                  {' · '}
                  {formatNumber(group.examinees)} examinees
                  {' · '}
                  {formatNumber(group.passed)} passed / {formatNumber(group.failed)} failed
                </span>
                <span className="mp-date-card__cta">View batches</span>
              </button>
            ))}
          </div>
        </section>
      ) : level === 'batches' ? (
        <section className="mp-panel">
          <div className="mp-panel__head">
            <div>
              <h2 className="mp-panel__title">
                <Clock3 size={16} /> Batches · {formatDateLabel(selectedDate)}
              </h2>
              <p className="mp-panel__hint">Click a batch to open completed student results.</p>
            </div>
            <ManagementButton type="button" variant="secondary" size="sm" onClick={() => setSelectedDate(null)}>
              <ArrowLeft size={14} /> All dates
            </ManagementButton>
          </div>
          <div className="mp-bank-grid">
            {timeSlots.map((slot) => (
              <button
                key={slot.schedule_id || `${slot.batch_code}-${slot.time_slot}`}
                type="button"
                className="mp-bank-card"
                onClick={() => setSelectedScheduleId(slot.schedule_id)}
              >
                <div className="mp-bank-card__icon"><Users size={20} /></div>
                <div className="mp-bank-card__body">
                  <h3 className="mp-bank-card__title">{slot.batch_code} · {slot.time_slot}</h3>
                  <p className="mp-bank-card__desc">
                    {formatNumber(slot.total)} completed
                    {' · '}
                    {formatNumber(slot.passed)} passed / {formatNumber(slot.failed)} failed
                  </p>
                  <div className="mp-bank-card__meta">
                    <span>{formatNumber(slot.sent_count)} scores sent</span>
                    <span>{formatNumber(slot.not_sent_count)} not sent</span>
                    <StatusBadge variant="success">Completed</StatusBadge>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="mp-panel">
          <div className="mp-panel__head">
            <div>
              <h2 className="mp-panel__title">
                <Users size={16} /> Results · {selectedBatch?.batch_code} · {selectedBatch?.time_slot}
              </h2>
              <p className="mp-panel__hint">
                {formatNumber(filteredStudents.length)} examinee{filteredStudents.length === 1 ? '' : 's'}
                {' · '}
                {formatNumber(selectedBatch?.sent_count || 0)} sent / {formatNumber(selectedBatch?.not_sent_count || 0)} not sent
              </p>
            </div>
            <div className="mp-header__actions">
              <ManagementButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedScheduleId(null);
                  setStudentSearch('');
                }}
              >
                <ArrowLeft size={14} /> Batches
              </ManagementButton>
              <ManagementButton
                type="button"
                variant="primary"
                size="sm"
                disabled={busyBatch === String(selectedBatch?.schedule_id || '') || !selectedBatch?.total}
                onClick={() => selectedBatch && sendBatchScores(selectedBatch)}
              >
                {busyBatch === String(selectedBatch?.schedule_id || '') ? (
                  <Loader2 size={14} className="mp-loading__icon" />
                ) : (
                  <Mail size={14} />
                )}
                Send Scores to Gmail
              </ManagementButton>
            </div>
          </div>

          <div className="mp-result-filters" style={{ marginBottom: 12 }}>
            <label className="mp-field mp-field--grow">
              <span className="mp-field__label"><Search size={14} /> Search students</span>
              <input
                className="mp-field__input"
                type="search"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Name, ID, or Gmail…"
              />
            </label>
            <label className="mp-field">
              <span className="mp-field__label">Status</span>
              <select
                className="mp-field__input"
                value={outcomeFilter}
                onChange={(e) => setOutcomeFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
            </label>
          </div>

          <div className="mp-table-wrap results-batch__table">
            <table className="mp-table">
              <thead>
                <tr>
                  <th>Applicant Name</th>
                  <th>Program</th>
                  <th>Room</th>
                  <th>Score</th>
                  <th>Grade Point</th>
                  <th>Status</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="mp-table__empty">No students found in this batch.</td>
                  </tr>
                ) : filteredStudents.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="mp-result-name">{row.student_name}</div>
                      <div className="mp-table__sub">{row.applicant_code}</div>
                    </td>
                    <td>{row.program_desire || row.course_preference || '—'}</td>
                    <td>{row.room_name || '—'}</td>
                    <td><span className="mp-score">{row.display_score}</span></td>
                    <td>{row.display_grade_point || row.grade_point || '—'}</td>
                    <td>
                      <StatusBadge variant={outcomeVariant(row.outcome)}>
                        {row.outcome_label || row.outcome}
                      </StatusBadge>
                    </td>
                    <td>
                      {row.email_sent ? (
                        <span className="results-email-badge results-email-badge--sent">
                          <CheckCircle2 size={14} /> Score Sent
                        </span>
                      ) : (
                        <span className="results-email-badge results-email-badge--pending">
                          <XCircle size={14} /> Not Sent
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
