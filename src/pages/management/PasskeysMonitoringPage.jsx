import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Clock,
  Copy,
  Filter,
  KeyRound,
  Loader2,
  Mail,
  MailCheck,
  RefreshCw,
  RotateCcw,
  Search,
  Users,
  X,
} from 'lucide-react';
import { scheduleApi } from '../../api/scheduleApi';
import { StatusBadge } from '../../components/management/StatusBadge';
import { Pagination } from '../../components/management/Pagination';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { statusVariant } from './useTableState';
import {
  alertFromApiError,
  confirmSendExaminationKey,
  showLoading,
  closeLoading,
  toastSuccess,
} from '../../utils/swal';
import '../../components/management/management.css';
import './management-pages.css';
import './passkeys-monitoring.css';

function emailVariant(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'sent') return 'success';
  if (value === 'failed') return 'error';
  if (value === 'queued') return 'warning';
  return statusVariant(status);
}

function joinVariant(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'taking_exam' || value === 'waiting' || value === 'joined') return 'success';
  if (value === 'finished') return 'info';
  if (value === 'disconnected' || value === 'terminated') return 'error';
  return 'default';
}

function formatLabel(str) {
  if (!str) return '—';
  return String(str)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
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

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

const PER_PAGE = 100;

export default function PasskeysMonitoringPage() {
  const { id, date } = useParams();
  const examDate = date || null;
  const scheduleId = !examDate ? id : null;

  const [schedule, setSchedule] = useState(null);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: PER_PAGE });
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [slotId, setSlotId] = useState('all');
  const [emailStatus, setEmailStatus] = useState('all');
  const [joinStatus, setJoinStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [sending, setSending] = useState(false);
  const [resendingId, setResendingId] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const loadSchedule = useCallback(async () => {
    if (!scheduleId) return;
    try {
      const { data } = await scheduleApi.get(scheduleId);
      setSchedule(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load schedule.');
    }
  }, [scheduleId]);

  const loadPasskeys = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        per_page: PER_PAGE,
        search: search.trim() || undefined,
        email_status: emailStatus === 'all' ? undefined : emailStatus,
        join_status: joinStatus === 'all' ? undefined : joinStatus,
        schedule_id: examDate && slotId !== 'all' ? slotId : undefined,
      };
      const { data } = examDate
        ? await scheduleApi.listPasskeysByDate(examDate, params)
        : await scheduleApi.listPasskeys(scheduleId, params);
      setRows(data.data || []);
      const nextMeta = data.meta || {
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: PER_PAGE,
      };
      setMeta(nextMeta);
      if (Array.isArray(nextMeta.slots)) setSlots(nextMeta.slots);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load examination keys.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [examDate, scheduleId, page, search, emailStatus, joinStatus, slotId]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  useEffect(() => {
    loadPasskeys();
  }, [loadPasskeys]);

  const sendKeys = async () => {
    const ok = await confirmSendExaminationKey();
    if (!ok) return;

    setSending(true);
    setNotice('');
    setError('');
    showLoading('Sending Examination Key...');
    try {
      if (examDate) {
        await scheduleApi.generatePasskeysByDate(examDate);
        const { data } = await scheduleApi.sendPasskeysByDate(examDate);
        closeLoading();
        setNotice(data.message || 'Examination keys sent for this date.');
      } else {
        await scheduleApi.generatePasskeys(scheduleId);
        const { data } = await scheduleApi.sendPasskeys(scheduleId);
        closeLoading();
        setNotice(data.message || 'Examination keys sent.');
      }
      await toastSuccess('Examination Key Sent Successfully');
      await loadPasskeys();
    } catch (err) {
      closeLoading();
      setError(err.response?.data?.message || 'Unable to send examination keys.');
      await alertFromApiError(err, 'Unable to send examination keys.');
    } finally {
      setSending(false);
    }
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const clearSearch = () => {
    setPage(1);
    setSearchInput('');
    setSearch('');
  };

  const resetAllFilters = () => {
    setPage(1);
    setSearchInput('');
    setSearch('');
    setSlotId('all');
    setEmailStatus('all');
    setJoinStatus('all');
  };

  const hasActiveFilters = Boolean(search || slotId !== 'all' || emailStatus !== 'all' || joinStatus !== 'all');

  const copyPasskey = (passkey) => {
    if (!passkey || passkey === '—') return;
    navigator.clipboard.writeText(passkey);
    setCopiedKey(passkey);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === passkey ? null : curr));
    }, 2000);
  };

  const resendOne = async (registrationId) => {
    const ok = await confirmSendExaminationKey({
      title: 'Resend Examination Key?',
      text: 'The examination key will be resent to this student.',
    });
    if (!ok) return;

    setResendingId(registrationId);
    setNotice('');
    setError('');
    showLoading('Sending Examination Key...');
    try {
      const { data } = await scheduleApi.resendPasskey(registrationId);
      closeLoading();
      setNotice(data.message || 'Examination key resent.');
      await toastSuccess('Examination Key Sent Successfully');
      await loadPasskeys();
    } catch (err) {
      closeLoading();
      setError(err.response?.data?.message || 'Unable to resend key.');
      await alertFromApiError(err, 'Unable to resend key.');
    } finally {
      setResendingId(null);
    }
  };

  const backTo = examDate
    ? '/management/schedules'
    : `/management/schedules/${scheduleId}`;

  const title = examDate
    ? `Keys · ${formatDateLabel(examDate)}`
    : (schedule?.batch_label || schedule?.title || 'Passkey Monitoring');

  const sentCount = useMemo(() => {
    return rows.filter((r) => String(r.passkey_email_status).toLowerCase() === 'sent').length;
  }, [rows]);

  return (
    <div className="passkeys-page">
      <Link to={backTo} className="passkeys-back-link">
        <ArrowLeft size={16} /> Back to schedules
      </Link>

      {/* Header Banner */}
      <header className="passkeys-header">
        <div className="passkeys-header__content">
          <p className="passkeys-header__eyebrow">Examination Management</p>
          <h1 className="passkeys-header__title">{title}</h1>
          <p className="passkeys-header__lede">
            {examDate
              ? 'Sending keys covers every time slot on this exam day. Each student receives a unique examination key.'
              : 'Each student receives a unique examination key sent directly to their registered Gmail.'}
          </p>
        </div>
        <div className="passkeys-header__actions">
          <button
            type="button"
            className="passkeys-btn-primary"
            onClick={sendKeys}
            disabled={sending}
          >
            {sending ? <Loader2 size={16} className="spin" /> : <Mail size={16} />}
            {sending ? 'Sending…' : 'Send Examination Keys'}
          </button>
        </div>
      </header>

      {/* Quick Statistics Strip */}
      <section className="passkeys-stats-strip">
        <div className="passkeys-stat-card">
          <div className="passkeys-stat-card__icon passkeys-stat-card__icon--primary">
            <Users size={20} />
          </div>
          <div className="passkeys-stat-card__content">
            <span className="passkeys-stat-card__value">{formatNumber(meta.total)}</span>
            <span className="passkeys-stat-card__label">Total Examinees</span>
          </div>
        </div>

        <div className="passkeys-stat-card">
          <div className="passkeys-stat-card__icon passkeys-stat-card__icon--info">
            <Clock size={20} />
          </div>
          <div className="passkeys-stat-card__content">
            <span className="passkeys-stat-card__value">{slots.length || (schedule ? 1 : '—')}</span>
            <span className="passkeys-stat-card__label">Exam Batches</span>
          </div>
        </div>

        <div className="passkeys-stat-card">
          <div className="passkeys-stat-card__icon passkeys-stat-card__icon--success">
            <MailCheck size={20} />
          </div>
          <div className="passkeys-stat-card__content">
            <span className="passkeys-stat-card__value">{formatNumber(sentCount)}</span>
            <span className="passkeys-stat-card__label">Keys Sent (Page)</span>
          </div>
        </div>

        <div className="passkeys-stat-card">
          <div className="passkeys-stat-card__icon passkeys-stat-card__icon--warning">
            <KeyRound size={20} />
          </div>
          <div className="passkeys-stat-card__content">
            <span className="passkeys-stat-card__value">{formatNumber(meta.total - sentCount)}</span>
            <span className="passkeys-stat-card__label">Pending / Unsent</span>
          </div>
        </div>
      </section>

      {notice && (
        <div className="mp-alert mp-alert--success" role="status">
          {notice}
        </div>
      )}
      {error && (
        <div className="mp-alert mp-alert--error" role="alert">
          {error}
        </div>
      )}

      {/* Main Monitoring Panel */}
      <section className="passkeys-panel">
        {/* Panel Header */}
        <div className="passkeys-panel__top">
          <div className="passkeys-panel__title-group">
            <h2 className="passkeys-panel__title">
              <KeyRound size={18} />
              Examination Keys &amp; Passcode Monitoring
            </h2>
            <span className="passkeys-panel__count-badge">
              {formatNumber(meta.total)} Total
            </span>
          </div>
          <div className="passkeys-panel__top-actions">
            <button
              type="button"
              className="passkeys-btn-action"
              onClick={loadPasskeys}
              disabled={loading}
              title="Refresh list"
            >
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Toolbar & Filters */}
        <div className="passkeys-toolbar-card">
          <div className="passkeys-toolbar-row">
            {/* Search Field */}
            <form className="passkeys-search-form" onSubmit={submitSearch} role="search">
              <div className="passkeys-search-field">
                <Search size={15} className="passkeys-search-field__icon" />
                <input
                  className="passkeys-search-input"
                  type="search"
                  placeholder="Search name, Gmail, passkey, or batch time…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Search keys"
                />
                {searchInput && (
                  <button
                    type="button"
                    className="passkeys-search-clear"
                    onClick={clearSearch}
                    title="Clear search input"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <button type="submit" className="passkeys-btn-action passkeys-btn-action--primary">
                <Search size={14} />
                Search
              </button>
            </form>

            {/* Filter Dropdowns */}
            <div className="passkeys-filter-selects">
              {examDate && slots.length > 0 && (
                <select
                  className="passkeys-select"
                  value={slotId}
                  onChange={(e) => {
                    setPage(1);
                    setSlotId(e.target.value);
                  }}
                  aria-label="Filter by batch"
                >
                  <option value="all">All Batches ({slots.length})</option>
                  {slots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              )}

              <select
                className="passkeys-select"
                value={emailStatus}
                onChange={(e) => {
                  setPage(1);
                  setEmailStatus(e.target.value);
                }}
                aria-label="Filter by email status"
              >
                <option value="all">All Email Statuses</option>
                <option value="pending">Pending</option>
                <option value="queued">Queued</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>

              <select
                className="passkeys-select"
                value={joinStatus}
                onChange={(e) => {
                  setPage(1);
                  setJoinStatus(e.target.value);
                }}
                aria-label="Filter by join status"
              >
                <option value="all">All Join Statuses</option>
                <option value="not_joined">Not Joined</option>
                <option value="joined">Joined</option>
                <option value="waiting">Waiting</option>
                <option value="taking_exam">Taking Exam</option>
                <option value="finished">Finished</option>
                <option value="disconnected">Disconnected</option>
              </select>
            </div>
          </div>

          {/* Active Filter Helper */}
          {hasActiveFilters && (
            <div className="passkeys-active-filters">
              <span>
                Showing {rows.length} of {formatNumber(meta.total)} filtered examinees.
              </span>
              <button
                type="button"
                className="passkeys-reset-btn"
                onClick={resetAllFilters}
              >
                <RotateCcw size={12} />
                Reset all filters
              </button>
            </div>
          )}
        </div>

        {/* Data Table */}
        <div className="passkeys-table-container">
          <table className="passkeys-table">
            <thead>
              <tr>
                <th style={{ width: '22%' }}>Examinee</th>
                <th style={{ width: '18%' }}>Gmail Address</th>
                {examDate ? <th style={{ width: '16%' }}>Time Slot &amp; Batch</th> : null}
                <th style={{ width: '14%' }}>Passkey Code</th>
                <th style={{ width: '10%' }}>Email Status</th>
                <th style={{ width: '10%' }}>Join Status</th>
                <th style={{ width: '10%' }}>Exam Status</th>
                <th style={{ width: '10%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={examDate ? 8 : 7} style={{ padding: 0, border: 'none' }}>
                    <SkeletonTable rows={8} cols={examDate ? 8 : 7} />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={examDate ? 8 : 7}>
                    <div className="passkeys-empty-state">
                      <KeyRound size={32} className="passkeys-empty-state__icon" />
                      <p className="passkeys-empty-state__text">
                        {hasActiveFilters
                          ? 'No passkeys found matching your filters.'
                          : 'No examination keys generated yet.'}
                      </p>
                      <p className="passkeys-empty-state__hint">
                        {hasActiveFilters
                          ? 'Try changing your search query or reset filters.'
                          : 'Click "Send Examination Keys" above to generate and dispatch keys to students.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const hasPasskey = Boolean(row.exam_passkey);
                  const isCopied = copiedKey === row.exam_passkey;

                  return (
                    <tr key={row.registration_id}>
                      {/* Name & ID */}
                      <td>
                        <div className="passkeys-examinee-name">{row.name}</div>
                        <div className="passkeys-examinee-code">{row.applicant_code || '—'}</div>
                      </td>

                      {/* Gmail */}
                      <td>
                        {row.gmail ? (
                          <span className="passkeys-gmail">{row.gmail}</span>
                        ) : (
                          <span className="passkeys-gmail passkeys-gmail--empty">No Gmail</span>
                        )}
                      </td>

                      {/* Time slot */}
                      {examDate ? (
                        <td>
                          <div className="passkeys-slot-time">{row.time_slot || '—'}</div>
                          {row.batch_code && (
                            <span className="passkeys-slot-batch">{row.batch_code}</span>
                          )}
                        </td>
                      ) : null}

                      {/* Passkey code with copy button */}
                      <td>
                        {hasPasskey ? (
                          <span className="passkeys-code-chip" title="Click icon to copy">
                            <code>{row.exam_passkey}</code>
                            <button
                              type="button"
                              className={`passkeys-copy-btn ${isCopied ? 'passkeys-copy-btn--copied' : ''}`}
                              onClick={() => copyPasskey(row.exam_passkey)}
                              title={isCopied ? 'Copied!' : 'Copy passkey'}
                            >
                              {isCopied ? <Check size={13} /> : <Copy size={13} />}
                            </button>
                          </span>
                        ) : (
                          <span className="passkeys-gmail--empty">—</span>
                        )}
                      </td>

                      {/* Email Status */}
                      <td>
                        <StatusBadge variant={emailVariant(row.passkey_email_status)}>
                          {formatLabel(row.passkey_email_status || 'pending')}
                        </StatusBadge>
                        {row.passkey_email_error && (
                          <div className="mp-table__sub" title={row.passkey_email_error}>
                            {row.passkey_email_error}
                          </div>
                        )}
                      </td>

                      {/* Join Status */}
                      <td>
                        <StatusBadge variant={joinVariant(row.join_status)}>
                          {formatLabel(row.join_status || 'not_joined')}
                        </StatusBadge>
                      </td>

                      {/* Exam Status */}
                      <td>
                        <StatusBadge variant={statusVariant(row.result_status)}>
                          {formatLabel(row.result_status || 'pending')}
                        </StatusBadge>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="passkeys-resend-btn"
                          disabled={resendingId === row.registration_id || !row.gmail}
                          onClick={() => resendOne(row.registration_id)}
                          title={row.gmail ? 'Resend examination key to Gmail' : 'No Gmail available'}
                        >
                          {resendingId === row.registration_id ? (
                            <Loader2 size={13} className="spin" />
                          ) : (
                            <Mail size={13} />
                          )}
                          Resend
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          page={page}
          pageSize={meta.per_page || PER_PAGE}
          total={meta.total}
          onPageChange={(p) => setPage(p)}
        />
      </section>
    </div>
  );
}
