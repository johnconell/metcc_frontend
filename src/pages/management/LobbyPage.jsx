import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DoorOpen,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { scheduleApi } from '../../api/scheduleApi';
import { roomApi } from '../../api/roomApi';
import { userApi } from '../../api/userApi';
import { ManagementButton } from '../../components/management/ManagementToolbar';
import { StatusBadge } from '../../components/management/StatusBadge';
import { statusVariant } from './useTableState';
import '../../components/management/management.css';
import './management-pages.css';

const EMPTY_FORM = { room_name: '', capacity: 40, proctor_id: '' };

export default function LobbyPage() {
  const [schedules, setSchedules] = useState([]);
  const [proctors, setProctors] = useState([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const selectedSchedule = useMemo(
    () => schedules.find((s) => String(s.id) === String(selectedScheduleId)) || null,
    [schedules, selectedScheduleId],
  );

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [{ data: scheduleRes }, { data: userRes }] = await Promise.all([
        scheduleApi.list(),
        userApi.list({ role: 'proctor', per_page: 200 }).catch(() => ({ data: { data: [] } })),
      ]);
      const list = scheduleRes.data || [];
      setSchedules(list);
      const users = userRes.data?.data || userRes.data || [];
      setProctors(
        (Array.isArray(users) ? users : []).filter((u) => {
          const slug = u.role?.slug || u.role_slug || '';
          return slug === 'proctor' || slug === 'admin' || !slug;
        }),
      );
      setSelectedScheduleId((current) => current || (list[0] ? String(list[0].id) : ''));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load examination schedules.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRooms = useCallback(async (scheduleId) => {
    if (!scheduleId) {
      setRooms([]);
      return;
    }
    setRoomsLoading(true);
    try {
      const { data } = await roomApi.list(scheduleId);
      setRooms(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load rooms.');
      setRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    if (selectedScheduleId) {
      loadRooms(selectedScheduleId);
    }
  }, [selectedScheduleId, loadRooms]);

  const openCreate = () => {
    setEditingRoom(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (room) => {
    setEditingRoom(room);
    setForm({
      room_name: room.room_name || '',
      capacity: room.capacity || 40,
      proctor_id: room.proctor?.id || room.proctor_id || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (busy) return;
    setModalOpen(false);
    setEditingRoom(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const saveRoom = async (event) => {
    event.preventDefault();
    if (!selectedScheduleId) return;
    if (!form.room_name.trim()) {
      setFormError('Room name is required.');
      return;
    }
    setBusy(true);
    setFormError('');
    setNotice('');
    try {
      const payload = {
        room_name: form.room_name.trim(),
        capacity: Number(form.capacity) || 40,
        proctor_id: form.proctor_id ? Number(form.proctor_id) : null,
      };
      if (editingRoom) {
        await roomApi.update(editingRoom.id, payload);
        setNotice(`Updated ${payload.room_name}.`);
      } else {
        await roomApi.create(selectedScheduleId, payload);
        setNotice(`Created ${payload.room_name}.`);
      }
      closeModal();
      await loadRooms(selectedScheduleId);
      await loadSchedules();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Unable to save room.');
    } finally {
      setBusy(false);
    }
  };

  const deleteRoom = async (room) => {
    if (!window.confirm(`Delete ${room.room_name}? This cannot be undone.`)) return;
    setBusy(true);
    setNotice('');
    try {
      await roomApi.remove(room.id);
      setNotice(`${room.room_name} deleted.`);
      await loadRooms(selectedScheduleId);
      await loadSchedules();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete room.');
    } finally {
      setBusy(false);
    }
  };

  const seedDefaults = async () => {
    if (!selectedScheduleId) return;
    setBusy(true);
    setNotice('');
    try {
      const { data } = await roomApi.seedDefaults(selectedScheduleId);
      setRooms(data.data || []);
      setNotice(data.message || 'Default rooms ready for this schedule.');
      await loadSchedules();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to seed default rooms.');
    } finally {
      setBusy(false);
    }
  };

  const seedDefaultsAll = async () => {
    setBusy(true);
    setNotice('');
    setError('');
    try {
      const { data } = await roomApi.seedDefaultsAll();
      setNotice(data.message || 'Default rooms applied to all schedules.');
      if (selectedScheduleId) {
        await loadRooms(selectedScheduleId);
      }
      await loadSchedules();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to apply rooms to all schedules.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mp-page">
      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">Management</p>
          <h1 className="mp-header__title">Examination Lobby</h1>
          <p className="mp-header__lede">
            Create and manage examination rooms for each time slot. Rooms sync to the mobile
            proctor app for QR codes and lobbies.
          </p>
        </div>
        <div className="mp-header__actions">
          <ManagementButton type="button" variant="secondary" onClick={loadSchedules} disabled={loading}>
            <RefreshCw size={16} /> Refresh
          </ManagementButton>
          <ManagementButton
            type="button"
            variant="primary"
            onClick={openCreate}
            disabled={!selectedScheduleId || busy}
          >
            <Plus size={16} /> Add Room
          </ManagementButton>
        </div>
      </header>

      {error ? <div className="mp-alert mp-alert--error" role="alert">{error}</div> : null}
      {notice ? <div className="mp-alert mp-alert--success" role="status">{notice}</div> : null}

      {loading ? (
        <div className="mp-panel mp-empty">
          <Loader2 className="mp-loading__icon" size={22} /> Loading schedules…
        </div>
      ) : (
        <div className="mp-split">
          <section className="mp-panel" aria-label="Schedules">
            <h2 className="mp-panel__title">Time Slots</h2>
            <p className="mp-panel__hint">
              Select a schedule to manage its rooms. Students assigned to a slot may use any room
              under that slot.
            </p>
            <div className="mp-table-wrap">
              <table className="mp-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Batch</th>
                    <th>Time</th>
                    <th>Rooms</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="mp-table__empty">No examination schedules yet.</td>
                    </tr>
                  ) : (
                    schedules.map((slot) => (
                      <tr
                        key={slot.id}
                        className={
                          String(slot.id) === String(selectedScheduleId) ? 'mp-table__row--active' : ''
                        }
                        style={{ cursor: 'pointer' }}
                        onClick={() => setSelectedScheduleId(String(slot.id))}
                      >
                        <td>{slot.date_label}</td>
                        <td>{slot.batch_code}</td>
                        <td>{slot.time_slot}</td>
                        <td>{slot.room_count ?? 0}</td>
                        <td>
                          <StatusBadge variant={statusVariant(slot.status)}>{slot.status}</StatusBadge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="mp-side-stack">
            <section className="mp-panel" aria-label="Rooms">
              <div className="mp-header" style={{ marginBottom: 12, padding: 0 }}>
                <div>
                  <h2 className="mp-panel__title">
                    <DoorOpen size={16} /> Rooms
                    {selectedSchedule ? ` · ${selectedSchedule.batch_code}` : ''}
                  </h2>
                  <p className="mp-panel__hint">
                    {selectedSchedule
                      ? `${selectedSchedule.date_label} · ${selectedSchedule.time_slot}`
                      : 'Select a time slot'}
                  </p>
                </div>
              </div>

              <div className="mp-header__actions" style={{ marginBottom: 12, justifyContent: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <ManagementButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={seedDefaults}
                  disabled={!selectedScheduleId || busy}
                >
                  Seed Room 01–03
                </ManagementButton>
                <ManagementButton
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={seedDefaultsAll}
                  disabled={busy}
                >
                  Apply rooms to all schedules
                </ManagementButton>
                {selectedScheduleId ? (
                  <Link
                    className="mp-batch-link"
                    to={`/management/schedules/${selectedScheduleId}`}
                    style={{ alignSelf: 'center' }}
                  >
                    Open schedule detail
                  </Link>
                ) : null}
              </div>

              {roomsLoading ? (
                <p className="mp-panel__hint"><Loader2 size={14} className="mp-loading__icon" /> Loading rooms…</p>
              ) : (
                <ul className="mp-simple-list">
                  {rooms.length === 0 ? (
                    <li>
                      <strong>No rooms yet</strong>
                      <span>Add a room or seed Room 01–03. Mobile proctors will see these immediately.</span>
                    </li>
                  ) : (
                    rooms.map((room) => (
                      <li key={room.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <div>
                          <strong>{room.room_name}</strong>
                          <span>
                            Capacity {room.capacity}
                            {room.proctor?.name ? ` · Proctor: ${room.proctor.name}` : ' · No proctor assigned'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <ManagementButton type="button" variant="secondary" size="sm" onClick={() => openEdit(room)}>
                            <Pencil size={14} />
                          </ManagementButton>
                          <ManagementButton
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => deleteRoom(room)}
                            disabled={busy}
                          >
                            <Trash2 size={14} />
                          </ManagementButton>
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </section>
          </aside>
        </div>
      )}

      {modalOpen ? (
        <div className="mp-modal-overlay" role="presentation" onClick={closeModal}>
          <div
            className="mp-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mp-modal__header">
              <div>
                <h2 className="mp-modal__title">{editingRoom ? 'Edit room' : 'Add examination room'}</h2>
                <p className="mp-modal__subtitle">
                  Rooms appear in the mobile proctor app for this time slot.
                </p>
              </div>
              <button type="button" className="mp-modal__close" onClick={closeModal} aria-label="Close">
                <X size={18} />
              </button>
            </div>

            {formError ? <div className="mp-alert mp-alert--error" role="alert">{formError}</div> : null}

            <form className="mp-form" onSubmit={saveRoom}>
              <label className="mp-field">
                <span className="mp-field__label">Room name</span>
                <input
                  className="mp-field__input"
                  value={form.room_name}
                  onChange={(e) => setForm((f) => ({ ...f, room_name: e.target.value }))}
                  placeholder="Room 01"
                  required
                />
              </label>
              <label className="mp-field">
                <span className="mp-field__label">Capacity</span>
                <input
                  className="mp-field__input"
                  type="number"
                  min={1}
                  max={500}
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                  required
                />
              </label>
              <label className="mp-field">
                <span className="mp-field__label">Assigned proctor (optional)</span>
                <select
                  className="mp-field__input"
                  value={form.proctor_id}
                  onChange={(e) => setForm((f) => ({ ...f, proctor_id: e.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {proctors.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.email})</option>
                  ))}
                </select>
              </label>
              <div className="mp-modal__actions">
                <ManagementButton type="button" variant="secondary" onClick={closeModal} disabled={busy}>
                  Cancel
                </ManagementButton>
                <ManagementButton type="submit" variant="primary" disabled={busy}>
                  {busy ? <Loader2 size={14} className="mp-loading__icon" /> : null}
                  {editingRoom ? 'Save changes' : 'Create room'}
                </ManagementButton>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
