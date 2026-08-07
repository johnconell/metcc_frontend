import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { scheduleApi } from '../../api/scheduleApi';
import { ManagementButton } from '../../components/management/ManagementToolbar';
import { StatusBadge } from '../../components/management/StatusBadge';
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

function emailVariant(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'sent') return 'success';
  if (value === 'failed') return 'error';
  if (value === 'queued') return 'warning';
  return statusVariant(status);
}

function joinVariant(status) {
  const value = String(status || '').toLowerCase();
  if (value === 'taking_exam' || value === 'waiting') return 'success';
  if (value === 'finished') return 'info';
  if (value === 'disconnected' || value === 'terminated') return 'error';
  return 'neutral';
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
  // `searchInput` is what the admin types; `search` is what was actually submitted.
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [slotId, setSlotId] = useState('all');
  const [emailStatus, setEmailStatus] = useState('all');
  const [joinStatus, setJoinStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [sending, setSending] = useState(false);
  const [resendingId, setResendingId] = useState(null);

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
    : (schedule?.batch_label || schedule?.title || 'Passkey monitoring');

  return (
    <div className="mp-page">
      <Link to={backTo} className="mp-link-back">
        <ArrowLeft size={16} /> Back to schedules
      </Link>

      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">Examination Keys</p>
          <h1 className="mp-header__title">{title}</h1>
          <p className="mp-header__lede">
            {examDate
              ? 'Sending keys covers every time slot on this exam day. Each student still gets their own unique key.'
              : 'Each student receives a unique examination key by Gmail.'}
          </p>
        </div>
        <ManagementButton type="button" onClick={sendKeys} disabled={sending}>
          {sending ? <Loader2 size={16} className="spin" /> : <Mail size={16} />}
          {sending ? 'Sending…' : 'Send Examination Keys'}
        </ManagementButton>
      </header>

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

      <section className="mp-panel">
        <div className="mp-panel__head">
          <div>
            <h2 className="mp-panel__title">
              <KeyRound size={16} /> Keys ({formatNumber(meta.total)})
            </h2>
            <p className="mp-panel__hint">
              {search || slotId !== 'all'
                ? `Showing ${formatNumber(rows.length)} of ${formatNumber(meta.total)} matching keys.`
                : 'Search by name, Gmail, key, or batch time (e.g. 10:30-11:30).'}
            </p>
          </div>
          <div className="mp-keys-toolbar">
            <form className="mp-keys-search" onSubmit={submitSearch} role="search">
              <div className="mp-keys-search__field">
                <Search size={14} className="mp-keys-search__icon" />
                <input
                  className="mp-field__input mp-field__input--sm mp-keys-search__input"
                  type="search"
                  placeholder="Search name, Gmail, key, or batch (10:30-11:30)…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  aria-label="Search keys by name, Gmail, key, or batch"
                />
              </div>
              <ManagementButton type="submit" size="sm">
                <Search size={14} /> Search
              </ManagementButton>
              {(search || searchInput) && (
                <ManagementButton
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onClick={clearSearch}
                >
                  <X size={14} /> Clear
                </ManagementButton>
              )}
            </form>
            {examDate && slots.length > 0 && (
              <select
                className="mp-field__input mp-field__input--sm"
                value={slotId}
                onChange={(e) => {
                  setPage(1);
                  setSlotId(e.target.value);
                }}
                aria-label="Filter by batch or time slot"
              >
                <option value="all">All batches ({slots.length})</option>
                {slots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.label}
                  </option>
                ))}
              </select>
            )}
            <select
              className="mp-field__input mp-field__input--sm"
              value={emailStatus}
              onChange={(e) => {
                setPage(1);
                setEmailStatus(e.target.value);
              }}
              aria-label="Filter email status"
            >
              <option value="all">All email statuses</option>
              <option value="pending">Pending</option>
              <option value="queued">Queued</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </select>
            <select
              className="mp-field__input mp-field__input--sm"
              value={joinStatus}
              onChange={(e) => {
                setPage(1);
                setJoinStatus(e.target.value);
              }}
              aria-label="Filter join status"
            >
              <option value="all">All join statuses</option>
              <option value="not_joined">Not joined</option>
              <option value="joined">Joined</option>
              <option value="waiting">Waiting</option>
              <option value="taking_exam">Taking exam</option>
              <option value="finished">Finished</option>
              <option value="disconnected">Disconnected</option>
            </select>
            <ManagementButton type="button" variant="tertiary" size="sm" onClick={loadPasskeys}>
              <RefreshCw size={14} /> Refresh
            </ManagementButton>
          </div>
        </div>

        <div className="mp-table-wrap mp-table-wrap--scroll">
          <table className="mp-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Gmail</th>
                {examDate ? <th>Time slot</th> : null}
                <th>Passkey</th>
                <th>Email status</th>
                <th>Join status</th>
                <th>Exam status</th>
                <th />
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
                  <td colSpan={examDate ? 8 : 7} className="mp-table__empty">
                    No keys yet. Click Send Examination Keys to generate and email them.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const keySent = String(row.passkey_email_status || '').toLowerCase() === 'sent'
                    || row.passkey_email_sent;
                  return (
                  <tr
                    key={row.registration_id}
                    className={keySent ? 'mp-table__row--keys-sent' : undefined}
                  >
                    <td>
                      <div>{row.name}</div>
                      <div className="mp-table__sub">{row.applicant_code}</div>
                    </td>
                    <td>{row.gmail || '—'}</td>
                    {examDate ? (
                      <td>
                        <div>{row.time_slot || '—'}</div>
                        <div className="mp-table__sub">{row.batch_code}</div>
                      </td>
                    ) : null}
                    <td>
                      <code style={{ letterSpacing: '0.08em', fontWeight: 700 }}>
                        {row.exam_passkey || '—'}
                      </code>
                    </td>
                    <td>
                      <StatusBadge variant={emailVariant(row.passkey_email_status)}>
                        {row.passkey_email_status || 'pending'}
                      </StatusBadge>
                      {row.passkey_email_error && (
                        <div className="mp-table__sub">{row.passkey_email_error}</div>
                      )}
                    </td>
                    <td>
                      <StatusBadge variant={joinVariant(row.join_status)}>
                        {row.join_status || 'not_joined'}
                      </StatusBadge>
                    </td>
                    <td>
                      <StatusBadge variant={statusVariant(row.result_status)}>
                        {row.result_status || 'pending'}
                      </StatusBadge>
                    </td>
                    <td>
                      <ManagementButton
                        type="button"
                        variant="tertiary"
                        size="sm"
                        disabled={resendingId === row.registration_id || !row.gmail}
                        onClick={() => resendOne(row.registration_id)}
                      >
                        {resendingId === row.registration_id ? (
                          <Loader2 size={14} className="spin" />
                        ) : (
                          <Mail size={14} />
                        )}
                        Resend
                      </ManagementButton>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {meta.last_page > 1 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <ManagementButton
              type="button"
              variant="tertiary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </ManagementButton>
            <span className="mp-table__sub" style={{ alignSelf: 'center' }}>
              Page {meta.current_page} of {meta.last_page}
            </span>
            <ManagementButton
              type="button"
              variant="tertiary"
              size="sm"
              disabled={page >= meta.last_page}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </ManagementButton>
          </div>
        )}
      </section>
    </div>
  );
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}
