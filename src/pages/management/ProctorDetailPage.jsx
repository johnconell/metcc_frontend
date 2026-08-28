import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock3, DoorOpen, Shield } from 'lucide-react';
import { userApi } from '../../api/userApi';
import { scheduleApi } from '../../api/scheduleApi';
import { roomApi } from '../../api/roomApi';
import { ManagementButton } from '../../components/management/ManagementToolbar';
import { StatusBadge } from '../../components/management/StatusBadge';
import { SkeletonPageHeader, SkeletonStats } from '../../components/ui/Skeleton';
import '../../components/management/management.css';
import './management-pages.css';

function scheduleDate(schedule) {
  return schedule.date_label || schedule.exam_date || 'Date not set';
}

function scheduleTime(schedule) {
  return schedule.time_slot || [schedule.start_time, schedule.end_time].filter(Boolean).join('–') || 'Time not set';
}

export default function ProctorDetailPage() {
  const { id } = useParams();
  const [proctor, setProctor] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [{ data: userResponse }, { data: scheduleResponse }] = await Promise.all([
        userApi.get(id),
        scheduleApi.list({ per_page: 200 }),
      ]);
      const schedules = scheduleResponse.data || [];
      const roomResponses = await Promise.allSettled(
        schedules.map(async (schedule) => {
          const { data } = await roomApi.list(schedule.id);
          return (data.data || [])
            .filter((room) => String(room.proctor_id || '') === String(id))
            .map((room) => ({ room, schedule }));
        }),
      );
      const roomAssignments = roomResponses
        .filter((result) => result.status === 'fulfilled')
        .flatMap((result) => result.value);
      const directAssignments = schedules
        .filter((schedule) => String(schedule.proctor_id || '') === String(id))
        .map((schedule) => ({ room: null, schedule }));
      const assignmentKeys = new Set(roomAssignments.map(({ schedule }) => String(schedule.id)));

      setProctor(userResponse.data?.data || userResponse.data);
      setAssignments([
        ...roomAssignments,
        ...directAssignments.filter(({ schedule }) => !assignmentKeys.has(String(schedule.id))),
      ]);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load this proctor.');
      setProctor(null);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !proctor) {
    return <div className="mp-page"><SkeletonPageHeader /><SkeletonStats count={3} /></div>;
  }

  if (!proctor) {
    return (
      <div className="mp-page">
        <div className="mp-alert mp-alert--error" role="alert">{error || 'Proctor not found.'}</div>
        <Link to="/management/proctors" className="mp-link-back"><ArrowLeft size={16} /> Back to proctors</Link>
      </div>
    );
  }

  const status = proctor.status === 'active' ? 'Active' : 'Inactive';
  const batches = [...new Set(assignments.map(({ schedule }) => schedule.batch_code).filter(Boolean))];

  return (
    <div className="mp-page">
      <Link to="/management/proctors" className="mp-link-back"><ArrowLeft size={16} /> Back to proctors</Link>
      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">Proctor assignment</p>
          <h1 className="mp-header__title">{proctor.name}</h1>
          <p className="mp-header__lede">{proctor.email} · PRC-{String(proctor.id).padStart(3, '0')}</p>
        </div>
        <StatusBadge variant={status === 'Active' ? 'success' : 'muted'}>{status}</StatusBadge>
      </header>

      {error ? <div className="mp-alert mp-alert--error" role="alert">{error}</div> : null}
      <div className="mp-stats" aria-label="Proctor assignment summary">
        <div className="mp-stats__item"><div className="mp-stats__value">{batches.length}</div><div className="mp-stats__label">Assigned batches</div></div>
        <div className="mp-stats__item"><div className="mp-stats__value">{assignments.length}</div><div className="mp-stats__label">Schedule assignments</div></div>
        <div className="mp-stats__item"><div className="mp-stats__value">{new Set(assignments.map(({ room }) => room?.room_name).filter(Boolean)).size}</div><div className="mp-stats__label">Assigned rooms</div></div>
      </div>

      <section className="mp-panel" aria-labelledby="assignment-title">
        <div className="mp-panel__head">
          <div>
            <h2 id="assignment-title" className="mp-panel__title"><CalendarDays size={16} /> Assigned batches and schedule</h2>
            <p className="mp-panel__hint">Each entry shows the examination slot and room assigned to this proctor.</p>
          </div>
          <ManagementButton type="button" variant="tertiary" size="sm" onClick={load}>Refresh</ManagementButton>
        </div>
        {assignments.length === 0 ? (
          <div className="mp-empty-state"><Shield size={24} /><strong>No assignments yet</strong><span>This proctor is currently available for a new examination batch.</span></div>
        ) : (
          <div className="mp-bank-grid">
            {assignments.map(({ room, schedule }) => (
              <Link key={`${schedule.id}-${room?.id || 'schedule'}`} to={`/management/schedules/${schedule.id}`} className="mp-bank-card">
                <div className="mp-bank-card__icon"><Clock3 size={20} /></div>
                <div>
                  <h3 className="mp-bank-card__title">{schedule.batch_code || 'Uncoded batch'}</h3>
                  <p className="mp-bank-card__desc">{schedule.title || 'Entrance Examination'}</p>
                  <div className="mp-bank-card__meta"><span><CalendarDays size={14} /> {scheduleDate(schedule)}</span><span><Clock3 size={14} /> {scheduleTime(schedule)}</span><span><DoorOpen size={14} /> {room?.room_name || 'Room assigned by schedule'}</span></div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}