import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  KeyRound,
  Loader2,
  Mail,
  Users,
} from 'lucide-react';
import { scheduleApi, SCHEDULES_CHANGED_EVENT } from '../../api/scheduleApi';
import { ManagementButton } from '../../components/management/ManagementToolbar';
import { StatusBadge } from '../../components/management/StatusBadge';
import { SkeletonCardGrid, SkeletonStats } from '../../components/ui/Skeleton';
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

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatDateLabel(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function SchedulesPage() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [sendingDate, setSendingDate] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await scheduleApi.list();
      setSchedules(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load schedules.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live refresh after student import (same tab + focus).
  useEffect(() => {
    const onChanged = () => {
      void load();
    };
    const onFocus = () => {
      void load();
    };
    window.addEventListener(SCHEDULES_CHANGED_EVENT, onChanged);
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onFocus();
    });
    return () => {
      window.removeEventListener(SCHEDULES_CHANGED_EVENT, onChanged);
      window.removeEventListener('focus', onFocus);
    };
  }, [load]);

  const dateGroups = useMemo(() => {
    const map = new Map();
    schedules.forEach((item) => {
      const key = item.exam_date;
      if (!key) return;
      if (!map.has(key)) {
        map.set(key, {
          date: key,
          label: item.date_label || formatDateLabel(key),
          slots: [],
          examinees: 0,
          keysSent: 0,
          keysTotal: 0,
          withGmail: 0,
        });
      }
      const group = map.get(key);
      group.slots.push(item);
      group.examinees += Number(item.registered_count || item.expected_examinees || 0);
      group.keysSent += Number(item.passkey_sent || 0);
      group.keysTotal += Number(item.passkey_total || item.registered_count || 0);
      group.withGmail += Number(item.passkey_with_gmail || 0);
    });
    return Array.from(map.values())
      .map((group) => ({
        ...group,
        keysFullySent: group.keysTotal > 0 && group.keysSent >= group.keysTotal,
        keysPartiallySent: group.keysSent > 0 && group.keysSent < group.keysTotal,
      }))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [schedules]);

  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    return dateGroups.find((group) => group.date === selectedDate)?.slots
      ?.slice()
      .sort((a, b) => String(a.start_time || a.time_slot).localeCompare(String(b.start_time || b.time_slot)))
      || [];
  }, [dateGroups, selectedDate]);

  const sendKeysForDate = async (examDate, event) => {
    event?.stopPropagation?.();
    const ok = await confirmSendExaminationKey({
      text: `The examination key will be distributed to authorized proctors for ${formatDateLabel(examDate)}.`,
    });
    if (!ok) return;

    setSendingDate(examDate);
    setNotice('');
    setError('');
    showLoading('Sending Examination Key...');
    try {
      await scheduleApi.generatePasskeysByDate(examDate);
      const { data } = await scheduleApi.sendPasskeysByDate(examDate);
      closeLoading();
      setNotice(data.message || `Examination keys sent for ${formatDateLabel(examDate)}.`);
      await toastSuccess('Examination Key Sent Successfully');
      await load();
    } catch (err) {
      closeLoading();
      setError(err.response?.data?.message || 'Unable to send examination keys for this date.');
      await alertFromApiError(err, 'Unable to send examination keys for this date.');
    } finally {
      setSendingDate(null);
    }
  };

  const level = selectedDate ? 'times' : 'dates';

  return (
    <div className="mp-page">
      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">Management</p>
          <h1 className="mp-header__title">Examination / Schedules</h1>
          <p className="mp-header__lede">
            View exam dates, time slots, and examination key status.
          </p>
        </div>
      </header>

      <div className="mp-stats">
        <div className="mp-stats__item">
          <span className="mp-stats__icon" aria-hidden="true">
            <CalendarDays size={18} />
          </span>
          <div className="mp-stats__value">{formatNumber(dateGroups.length)}</div>
          <div className="mp-stats__label">Exam days</div>
        </div>
        <div className="mp-stats__item">
          <span className="mp-stats__icon" aria-hidden="true">
            <Clock3 size={18} />
          </span>
          <div className="mp-stats__value">{formatNumber(schedules.length)}</div>
          <div className="mp-stats__label">Time slots / batches</div>
        </div>
        <div className="mp-stats__item">
          <span className="mp-stats__icon" aria-hidden="true">
            <Users size={18} />
          </span>
          <div className="mp-stats__value">{formatNumber(schedules.reduce((sum, row) => sum + (row.registered_count || 0), 0))}</div>
          <div className="mp-stats__label">Registered examinees</div>
        </div>
      </div>

      <nav className="mp-result-crumb" aria-label="Schedule breadcrumb">
        <button
          type="button"
          className={`mp-result-crumb__link${level === 'dates' ? ' is-current' : ''}`}
          onClick={() => setSelectedDate(null)}
        >
          All dates
        </button>
        {selectedDate && (
          <>
            <span aria-hidden="true">/</span>
            <span className="mp-result-crumb__current">
              {formatDateLabel(selectedDate)}
            </span>
          </>
        )}
      </nav>

      {notice && <div className="mp-alert mp-alert--success" role="status">{notice}</div>}
      {error && <div className="mp-alert mp-alert--error" role="alert">{error}</div>}

      {loading ? (
        <>
          <SkeletonStats count={3} />
          <SkeletonCardGrid count={6} />
        </>
      ) : level === 'dates' ? (
        <section className="mp-panel">
          <div className="mp-panel__head">
            <div>
              <h2 className="mp-panel__title"><CalendarDays size={16} /> Schedule dates</h2>
              <p className="mp-panel__hint">
                Click a date to see time slots. Send Examination Keys emails every student on that day.
              </p>
            </div>
            <ManagementButton type="button" variant="tertiary" size="sm" onClick={load}>
              Refresh
            </ManagementButton>
          </div>
          <div className="mp-info-grid">
            {dateGroups.length === 0 ? (
              <p className="mp-panel__hint">No schedules yet. Import students to create date and time slots.</p>
            ) : dateGroups.map((group) => (
              <article
                key={group.date}
                className={`mp-info-card${group.keysFullySent ? ' mp-info-card--success' : ''}`}
              >
                <button
                  type="button"
                  className="mp-info-card__click"
                  onClick={() => setSelectedDate(group.date)}
                >
                  <div className="mp-info-card__header">
                    <span className="mp-info-card__icon mp-info-card__icon--maroon" aria-hidden="true">
                      <CalendarDays size={18} />
                    </span>
                    <div className="mp-info-card__identity">
                      <h3 className="mp-info-card__title">{group.label}</h3>
                      <p className="mp-info-card__subtitle">
                        {group.slots.length} time slot{group.slots.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <span className="mp-info-card__badge">
                      {group.keysFullySent ? (
                        <StatusBadge variant="success">Keys sent</StatusBadge>
                      ) : group.keysPartiallySent ? (
                        <StatusBadge variant="warning">Partial</StatusBadge>
                      ) : group.withGmail === 0 && group.keysTotal > 0 ? (
                        <StatusBadge variant="error">No Gmail</StatusBadge>
                      ) : (
                        <StatusBadge variant="muted">Not sent</StatusBadge>
                      )}
                    </span>
                  </div>

                  <div className="mp-info-card__section">
                    <div className="mp-info-card__row">
                      <Users className="mp-info-card__row-icon" size={15} aria-hidden="true" />
                      <span className="mp-info-card__row-label">Examinees:</span>
                      <span className="mp-info-card__row-value">{formatNumber(group.examinees)}</span>
                    </div>
                    <div className="mp-info-card__row">
                      <Clock3 className="mp-info-card__row-icon" size={15} aria-hidden="true" />
                      <span className="mp-info-card__row-label">Time slots:</span>
                      <span className="mp-info-card__row-value">{group.slots.length}</span>
                    </div>
                    <div className="mp-info-card__row">
                      <KeyRound className="mp-info-card__row-icon" size={15} aria-hidden="true" />
                      <span className="mp-info-card__row-label">Keys:</span>
                      <span className="mp-info-card__row-value">
                        {formatNumber(group.keysSent)}/{formatNumber(group.keysTotal)}
                      </span>
                    </div>
                  </div>
                </button>

                <div className="mp-info-card__actions">
                  <ManagementButton
                    type="button"
                    size="sm"
                    variant={group.keysFullySent ? 'secondary' : 'primary'}
                    disabled={sendingDate === group.date}
                    onClick={(e) => sendKeysForDate(group.date, e)}
                  >
                    {sendingDate === group.date ? <Loader2 size={14} className="spin" /> : <Mail size={14} />}
                    {sendingDate === group.date
                      ? 'Sending…'
                      : group.keysFullySent
                        ? 'Resend Examination Keys'
                        : 'Send Examination Keys'}
                  </ManagementButton>
                  <div className="mp-info-card__actions-row">
                    <button
                      type="button"
                      className="mp-info-card__link"
                      onClick={() => setSelectedDate(group.date)}
                    >
                      View times →
                    </button>
                    <Link
                      to={`/management/schedules/by-date/${group.date}/passkeys`}
                      className="mp-info-card__link"
                      aria-label={`Monitor examination keys for ${formatDateLabel(group.date)}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <KeyRound size={14} aria-hidden="true" /> Monitor keys
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="mp-panel">
          <div className="mp-panel__head">
            <div>
              <h2 className="mp-panel__title"><Clock3 size={16} /> Time slots · {formatDateLabel(selectedDate)}</h2>
              <p className="mp-panel__hint">
                Keys are sent for the whole day (all slots below). Open a slot to see or reschedule students.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <ManagementButton
                type="button"
                size="sm"
                disabled={sendingDate === selectedDate}
                onClick={(e) => sendKeysForDate(selectedDate, e)}
              >
                {sendingDate === selectedDate ? <Loader2 size={14} className="spin" /> : <Mail size={14} />}
                {sendingDate === selectedDate ? 'Sending…' : 'Send Keys (this day)'}
              </ManagementButton>
              <Link
                to={`/management/schedules/by-date/${selectedDate}/passkeys`}
                className="mp-monitor-link"
                aria-label={`Monitor examination keys for ${formatDateLabel(selectedDate)}`}
              >
                <KeyRound size={14} aria-hidden="true" /> <span>Monitor keys</span>
              </Link>
              <ManagementButton type="button" variant="secondary" size="sm" onClick={() => setSelectedDate(null)}>
                <ArrowLeft size={14} /> All dates
              </ManagementButton>
            </div>
          </div>
          <div className="mp-info-grid">
            {timeSlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                className="mp-info-card"
                onClick={() => navigate(`/management/schedules/${slot.id}`)}
              >
                <div className="mp-info-card__header">
                  <span className="mp-info-card__icon mp-info-card__icon--gold" aria-hidden="true">
                    <Clock3 size={18} />
                  </span>
                  <div className="mp-info-card__identity">
                    <h3 className="mp-info-card__title">{slot.batch_code} · {slot.time_slot}</h3>
                    <p className="mp-info-card__subtitle">{slot.title || 'Entrance Examination'}</p>
                  </div>
                  <span className="mp-info-card__badge">
                    <StatusBadge variant={statusVariant(slot.status)}>{slot.status}</StatusBadge>
                  </span>
                </div>

                <div className="mp-info-card__section">
                  <div className="mp-info-card__row">
                    <Users className="mp-info-card__row-icon" size={15} aria-hidden="true" />
                    <span className="mp-info-card__row-label">Students:</span>
                    <span className="mp-info-card__row-value">{formatNumber(slot.registered_count)}</span>
                  </div>
                  <div className="mp-info-card__row">
                    <CalendarDays className="mp-info-card__row-icon" size={15} aria-hidden="true" />
                    <span className="mp-info-card__row-label">Rooms:</span>
                    <span className="mp-info-card__row-value">{slot.room_count}</span>
                  </div>
                  <div className="mp-info-card__row">
                    <KeyRound className="mp-info-card__row-icon" size={15} aria-hidden="true" />
                    <span className="mp-info-card__row-label">Keys:</span>
                    <span className="mp-info-card__row-value">
                      {slot.passkeys_fully_sent
                        ? 'Sent'
                        : Number(slot.passkey_sent) > 0
                          ? `${formatNumber(slot.passkey_sent)}/${formatNumber(slot.passkey_total)}`
                          : 'Not sent'}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
