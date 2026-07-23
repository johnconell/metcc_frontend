import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Loader2,
  Search,
  Users,
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

function formatDateLabel(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');

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

  useEffect(() => {
    if (!selectedScheduleId) {
      setDetail(null);
      return undefined;
    }

    let cancelled = false;
    async function loadDetail() {
      setDetailLoading(true);
      try {
        const { data } = await scheduleApi.get(selectedScheduleId);
        if (!cancelled) setDetail(data.data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Unable to load students for this time slot.');
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }
    loadDetail();
    return () => { cancelled = true; };
  }, [selectedScheduleId]);

  const dateGroups = useMemo(() => {
    const map = new Map();
    schedules.forEach((item) => {
      const key = item.exam_date;
      if (!map.has(key)) {
        map.set(key, {
          date: key,
          label: item.date_label || formatDateLabel(key),
          slots: [],
          examinees: 0,
        });
      }
      const group = map.get(key);
      group.slots.push(item);
      group.examinees += Number(item.registered_count || item.expected_examinees || 0);
    });
    return Array.from(map.values()).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [schedules]);

  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];
    return dateGroups.find((group) => group.date === selectedDate)?.slots
      ?.slice()
      .sort((a, b) => String(a.start_time || a.time_slot).localeCompare(String(b.start_time || b.time_slot)))
      || [];
  }, [dateGroups, selectedDate]);

  const selectedSlot = timeSlots.find((slot) => String(slot.id) === String(selectedScheduleId));

  const filteredStudents = useMemo(() => {
    const students = detail?.students || [];
    const q = studentSearch.trim().toLowerCase();
    if (!q) return students;
    return students.filter((student) =>
      [student.name, student.applicant_code, student.email]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [detail, studentSearch]);

  const level = selectedScheduleId ? 'students' : selectedDate ? 'times' : 'dates';

  return (
    <div className="mp-page">
      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">Management</p>
          <h1 className="mp-header__title">Examination / Schedules</h1>
          <p className="mp-header__lede">
            Built for large entrance exam volume. Browse by date, then time slot, then the students assigned to that hour.
          </p>
        </div>
      </header>

      <div className="mp-stats">
        <div className="mp-stats__item">
          <div className="mp-stats__value">{formatNumber(dateGroups.length)}</div>
          <div className="mp-stats__label">Exam days</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{formatNumber(schedules.length)}</div>
          <div className="mp-stats__label">Time slots / batches</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{formatNumber(schedules.reduce((sum, row) => sum + (row.registered_count || 0), 0))}</div>
          <div className="mp-stats__label">Registered examinees</div>
        </div>
      </div>

      <nav className="mp-result-crumb" aria-label="Schedule breadcrumb">
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
              className={`mp-result-crumb__link${level === 'times' ? ' is-current' : ''}`}
              onClick={() => {
                setSelectedScheduleId(null);
                setStudentSearch('');
              }}
            >
              {formatDateLabel(selectedDate)}
            </button>
          </>
        )}
        {selectedSlot && (
          <>
            <span aria-hidden="true">/</span>
            <span className="mp-result-crumb__current">
              {selectedSlot.batch_code} · {selectedSlot.time_slot}
            </span>
          </>
        )}
      </nav>

      {error && <div className="mp-alert mp-alert--error" role="alert">{error}</div>}

      {loading ? (
        <div className="mp-loading">
          <Loader2 size={18} className="mp-loading__icon" />
          Loading schedules...
        </div>
      ) : level === 'dates' ? (
        <section className="mp-panel">
          <div className="mp-panel__head">
            <div>
              <h2 className="mp-panel__title"><CalendarDays size={16} /> Schedule dates</h2>
              <p className="mp-panel__hint">Click a date to see all time slots / batches for that day.</p>
            </div>
          </div>
          <div className="mp-date-grid">
            {dateGroups.map((group) => (
              <button
                key={group.date}
                type="button"
                className="mp-date-card"
                onClick={() => setSelectedDate(group.date)}
              >
                <span className="mp-date-card__label">{group.label}</span>
                <span className="mp-date-card__meta">
                  {group.slots.length} time slot{group.slots.length === 1 ? '' : 's'} · {formatNumber(group.examinees)} examinees
                </span>
                <span className="mp-date-card__cta">View times</span>
              </button>
            ))}
          </div>
        </section>
      ) : level === 'times' ? (
        <section className="mp-panel">
          <div className="mp-panel__head">
            <div>
              <h2 className="mp-panel__title"><Clock3 size={16} /> Time slots · {formatDateLabel(selectedDate)}</h2>
              <p className="mp-panel__hint">Click a time/batch to see the students scheduled for that hour.</p>
            </div>
            <ManagementButton type="button" variant="secondary" size="sm" onClick={() => setSelectedDate(null)}>
              <ArrowLeft size={14} /> All dates
            </ManagementButton>
          </div>
          <div className="mp-bank-grid">
            {timeSlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                className="mp-bank-card"
                onClick={() => setSelectedScheduleId(slot.id)}
              >
                <div className="mp-bank-card__icon"><Clock3 size={20} /></div>
                <div className="mp-bank-card__body">
                  <h3 className="mp-bank-card__title">{slot.batch_code} · {slot.time_slot}</h3>
                  <p className="mp-bank-card__desc">{slot.title || 'Entrance Examination'}</p>
                  <div className="mp-bank-card__meta">
                    <span>{formatNumber(slot.registered_count)} students</span>
                    <span>{slot.room_count} rooms</span>
                    <StatusBadge variant={statusVariant(slot.status)}>{slot.status}</StatusBadge>
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
                <Users size={16} /> Students · {selectedSlot?.batch_code} · {selectedSlot?.time_slot}
              </h2>
              <p className="mp-panel__hint">
                {formatNumber(detail?.registered_count || filteredStudents.length)} examinees in this time slot.
                Search within the batch for fast lookup in large applicant lists.
              </p>
            </div>
            <div className="mp-header__actions">
              <ManagementButton type="button" variant="secondary" size="sm" onClick={() => setSelectedScheduleId(null)}>
                <ArrowLeft size={14} /> Time slots
              </ManagementButton>
              <Link to={`/management/schedules/${selectedScheduleId}`}>
                <ManagementButton type="button" variant="primary" size="sm">
                  Open full batch
                </ManagementButton>
              </Link>
            </div>
          </div>

          <div className="mp-result-filters" style={{ marginBottom: 12 }}>
            <label className="mp-field mp-field--grow">
              <span className="mp-field__label"><Search size={14} /> Search students in this time</span>
              <input
                className="mp-field__input"
                type="search"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Name, applicant code, or email..."
              />
            </label>
          </div>

          {detailLoading ? (
            <div className="mp-loading mp-loading--compact">
              <Loader2 size={18} className="mp-loading__icon" />
              Loading students...
            </div>
          ) : (
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
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="mp-table__empty">No students found in this time slot.</td>
                    </tr>
                  ) : filteredStudents.map((student) => (
                    <tr key={student.registration_id}>
                      <td>{student.applicant_code}</td>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.course_preference || '—'}</td>
                      <td><StatusBadge variant={statusVariant(student.attendance_status)}>{student.attendance_status}</StatusBadge></td>
                      <td><StatusBadge variant={statusVariant(student.result_status)}>{student.result_status}</StatusBadge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
