import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarClock,
  CalendarDays,
  Clock3,
  Loader2,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { scheduleApi } from '../../api/scheduleApi';
import { ManagementButton } from '../../components/management/ManagementToolbar';
import { StatusBadge } from '../../components/management/StatusBadge';
import { statusVariant } from './useTableState';
import '../../components/management/management.css';
import './management-pages.css';

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatWhen(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

export default function ScheduleDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const [rescheduleStudent, setRescheduleStudent] = useState(null);
  const [targetScheduleId, setTargetScheduleId] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: response } = await scheduleApi.get(id);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load batch details.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredStudents = useMemo(() => {
    const students = data?.students || [];
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((student) =>
      [student.name, student.applicant_code, student.email, student.course_preference, student.reschedule_reason]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [data, studentSearch]);

  const openReschedule = (student) => {
    setRescheduleStudent(student);
    setTargetScheduleId('');
    setReason('');
    setFormError('');
    setSuccess('');
  };

  const closeReschedule = () => {
    if (saving) return;
    setRescheduleStudent(null);
    setTargetScheduleId('');
    setReason('');
    setFormError('');
  };

  const submitReschedule = async (event) => {
    event.preventDefault();
    if (!rescheduleStudent) return;

    if (!targetScheduleId) {
      setFormError('Choose the new day / batch.');
      return;
    }
    if (reason.trim().length < 5) {
      setFormError('Enter a clear reason (at least 5 characters).');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const { data: response } = await scheduleApi.reschedule(rescheduleStudent.registration_id, {
        target_schedule_id: Number(targetScheduleId),
        reason: reason.trim(),
      });
      setSuccess(
        response.message
          || `${rescheduleStudent.name} was moved to ${response.data?.to_batch_label || 'the new batch'}.`,
      );
      setRescheduleStudent(null);
      setTargetScheduleId('');
      setReason('');
      await load();
    } catch (err) {
      const errors = err.response?.data?.errors;
      const firstError = errors
        ? Object.values(errors).flat()[0]
        : null;
      setFormError(firstError || err.response?.data?.message || 'Unable to reschedule this examinee.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="mp-page">
        <div className="mp-loading" aria-live="polite">
          <Loader2 size={18} className="mp-loading__icon" />
          Loading batch details...
        </div>
      </div>
    );
  }

  if ((error && !data) || !data) {
    return (
      <div className="mp-page">
        <div className="mp-alert mp-alert--error" role="alert">{error || 'Batch not found.'}</div>
        <Link to="/management/schedules" className="mp-link-back">
          <ArrowLeft size={16} /> Back to schedules
        </Link>
      </div>
    );
  }

  const movedAway = data.moved_away || [];
  const targets = data.reschedule_targets || [];

  return (
    <div className="mp-page">
      <Link to="/management/schedules" className="mp-link-back">
        <ArrowLeft size={16} /> Back to schedules
      </Link>

      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">Examination Batch</p>
          <h1 className="mp-header__title">{data.batch_label || `${data.date_label}, ${data.batch_code}`}</h1>
          <p className="mp-header__lede">
            {data.title} · {data.time_slot} · General entrance examination (not course-specific).
            Students are assigned by time slot and may use any available classroom.
          </p>
        </div>
        <StatusBadge variant={statusVariant(data.status)}>{data.status}</StatusBadge>
      </header>

      {success && (
        <div className="mp-alert mp-alert--success" role="status">{success}</div>
      )}
      {error && data && (
        <div className="mp-alert mp-alert--error" role="alert">{error}</div>
      )}

      <div className="mp-stats">
        <div className="mp-stats__item">
          <div className="mp-stats__value">{formatNumber(data.registered_count)}</div>
          <div className="mp-stats__label">Students in this time slot</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{formatNumber(data.expected_examinees)}</div>
          <div className="mp-stats__label">Expected examinees</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{formatNumber(data.room_count)}</div>
          <div className="mp-stats__label">Available classrooms</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{formatNumber(movedAway.length)}</div>
          <div className="mp-stats__label">Rescheduled away</div>
        </div>
      </div>

      <p className="mp-note" role="note">
        {data.note}
      </p>

      <div className="mp-split">
        <section className="mp-panel" aria-labelledby="students-title">
          <div className="mp-panel__head">
            <div>
              <h2 id="students-title" className="mp-panel__title">
                <Users size={16} /> Students ({filteredStudents.length})
              </h2>
              <p className="mp-panel__hint">
                Examinees for {data.time_slot}. Use Reschedule if someone cannot take the exam this day.
              </p>
            </div>
            <input
              className="mp-field__input mp-field__input--sm"
              type="search"
              placeholder="Search student..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              aria-label="Search students"
            />
          </div>

          <div className="mp-table-wrap">
            <table className="mp-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Course Pref.</th>
                  <th>Attendance</th>
                  <th>Result</th>
                  <th>Notes</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="mp-table__empty">No students in this batch time slot.</td>
                  </tr>
                ) : filteredStudents.map((student) => (
                  <tr key={student.registration_id}>
                    <td>{student.applicant_code}</td>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{student.course_preference || '—'}</td>
                    <td>
                      <StatusBadge variant={statusVariant(student.attendance_status)}>
                        {student.attendance_status}
                      </StatusBadge>
                    </td>
                    <td>
                      <StatusBadge variant={statusVariant(student.result_status)}>
                        {student.result_status}
                      </StatusBadge>
                    </td>
                    <td>
                      {student.was_rescheduled ? (
                        <div className="mp-reschedule-note">
                          <span>From {student.previous_batch_label || 'another batch'}</span>
                          {student.reschedule_reason && (
                            <span className="mp-table__sub">{student.reschedule_reason}</span>
                          )}
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {student.can_reschedule ? (
                        <ManagementButton
                          type="button"
                          variant="tertiary"
                          size="sm"
                          onClick={() => openReschedule(student)}
                        >
                          <CalendarClock size={14} aria-hidden="true" /> Reschedule
                        </ManagementButton>
                      ) : (
                        <span className="mp-table__sub">Locked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {movedAway.length > 0 && (
            <div className="mp-moved-away">
              <h3 className="mp-moved-away__title">Moved to another day / batch</h3>
              <p className="mp-panel__hint">
                Examinees who could not take this schedule and were rescheduled with a recorded reason.
              </p>
              <div className="mp-table-wrap">
                <table className="mp-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Moved to</th>
                      <th>Reason</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movedAway.map((row) => (
                      <tr key={`moved-${row.registration_id}`}>
                        <td>{row.applicant_code}</td>
                        <td>{row.name}</td>
                        <td>
                          <Link
                            to={`/management/schedules/${row.moved_to_schedule_id}`}
                            className="mp-batch-link"
                          >
                            <strong>{row.moved_to_batch_label}</strong>
                          </Link>
                        </td>
                        <td>{row.reason || '—'}</td>
                        <td>{formatWhen(row.rescheduled_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        <aside className="mp-side-stack">
          <section className="mp-panel" aria-labelledby="slot-title">
            <h2 id="slot-title" className="mp-panel__title"><Clock3 size={16} /> Time Slot</h2>
            <dl className="mp-dl">
              <div><dt>Date</dt><dd>{data.date_label}</dd></div>
              <div><dt>Batch</dt><dd>{data.batch_code}</dd></div>
              <div><dt>Time</dt><dd>{data.time_slot}</dd></div>
              <div><dt>Exam type</dt><dd>General Entrance Examination</dd></div>
            </dl>
          </section>

          <section className="mp-panel" aria-labelledby="rooms-title">
            <h2 id="rooms-title" className="mp-panel__title"><CalendarDays size={16} /> Available Classrooms</h2>
            <p className="mp-panel__hint">Open rooms for this hour — students can use any of them.</p>
            <ul className="mp-simple-list">
              {(data.available_rooms || []).map((room) => (
                <li key={room.id}>
                  <strong>{room.room_name}</strong>
                  <span>Capacity {room.capacity}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mp-panel" aria-labelledby="proctors-title">
            <h2 id="proctors-title" className="mp-panel__title"><Shield size={16} /> Proctors Available</h2>
            <p className="mp-panel__hint">One distinct proctor per open classroom for this time slot.</p>
            <ul className="mp-simple-list">
              {(data.available_rooms || []).map((room) => (
                <li key={`proctor-${room.id}`}>
                  <strong>{room.proctor?.name || 'Unassigned'}</strong>
                  <span>{room.room_name}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>

      {rescheduleStudent && (
        <div className="mp-modal-overlay" role="presentation" onClick={closeReschedule}>
          <div
            className="mp-modal mp-reschedule-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reschedule-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mp-modal__header">
              <div>
                <h2 id="reschedule-title" className="mp-modal__title">Reschedule examinee</h2>
                <p className="mp-modal__subtitle">
                  Move {rescheduleStudent.name} ({rescheduleStudent.applicant_code}) to another day or batch
                  and record why they cannot take this exam.
                </p>
              </div>
              <button type="button" className="mp-modal__close" onClick={closeReschedule} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="mp-alert mp-alert--error" role="alert">{formError}</div>
            )}

            <form className="mp-form" onSubmit={submitReschedule}>
              <label className="mp-field">
                <span className="mp-field__label">New day / batch</span>
                <select
                  className="mp-field__input"
                  value={targetScheduleId}
                  onChange={(e) => setTargetScheduleId(e.target.value)}
                  required
                >
                  <option value="">Select target batch...</option>
                  {targets.map((target) => (
                    <option key={target.id} value={target.id}>{target.label}</option>
                  ))}
                </select>
              </label>

              <label className="mp-field">
                <span className="mp-field__label">Reason for not taking this day</span>
                <textarea
                  className="mp-field__input mp-field__textarea"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Example: Medical appointment / family emergency / conflict with work..."
                  required
                  minLength={5}
                />
              </label>

              <div className="mp-modal__actions mp-form__actions">
                <ManagementButton type="button" variant="secondary" onClick={closeReschedule} disabled={saving}>
                  Cancel
                </ManagementButton>
                <ManagementButton type="submit" variant="primary" disabled={saving || targets.length === 0}>
                  {saving ? 'Saving...' : 'Confirm reschedule'}
                </ManagementButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
