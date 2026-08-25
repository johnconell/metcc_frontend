import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarPlus, Eye, Pencil, Plus, RefreshCw, UserX, Users, X } from 'lucide-react';
import { userApi } from '../../api/userApi';
import { scheduleApi } from '../../api/scheduleApi';
import { roomApi } from '../../api/roomApi';
import { ManagementToolbar, ManagementButton } from '../../components/management/ManagementToolbar';
import { DataTable } from '../../components/management/DataTable';
import { StatusBadge } from '../../components/management/StatusBadge';
import { Pagination } from '../../components/management/Pagination';
import { useTableState, statusVariant } from './useTableState';
import '../../components/management/management.css';
import './management-pages.css';

export default function ProctorsPage() {
  const [proctors, setProctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [assignment, setAssignment] = useState({ proctorId: '', scheduleId: '', roomId: '' });
  const [editForm, setEditForm] = useState({ name: '', email: '' });

  const loadProctors = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [{ data }, { data: scheduleResponse }] = await Promise.all([
        userApi.list({ role: 'proctor', per_page: 200 }),
        scheduleApi.list({ per_page: 200 }),
      ]);
      const scheduleRows = scheduleResponse.data || [];
      const roomResponses = await Promise.all(
        scheduleRows.map(async (schedule) => {
          const { data: roomResponse } = await roomApi.list(schedule.id);
          return (roomResponse.data || []).map((room) => ({ room, schedule }));
        }),
      );
      const assignments = roomResponses.flat();

      setProctors((data.data || []).map((user) => {
        const userId = String(user.id);
        const roomsForUser = assignments.filter(({ room, schedule }) => (
          String(room.proctor_id || '') === userId || String(schedule.proctor_id || '') === userId
        ));
        const schedulesForUser = scheduleRows.filter((schedule) => String(schedule.proctor_id || '') === userId);
        const batches = [...new Set([
          ...roomsForUser.map(({ schedule }) => schedule.batch_code),
          ...schedulesForUser.map((schedule) => schedule.batch_code),
        ].filter(Boolean))];
        const scheduleLabels = [...new Set([
          ...roomsForUser.map(({ schedule }) => schedule.date_label || schedule.time_slot),
          ...schedulesForUser.map((schedule) => schedule.date_label || schedule.time_slot),
        ].filter(Boolean))];

        return {
        id: user.id,
        proctorId: `PRC-${String(user.id).padStart(3, '0')}`,
        name: user.name,
        email: user.email,
        batch: batches.join(', ') || '—',
        schedule: scheduleLabels.join(' · ') || '—',
        availability: user.status === 'inactive' ? 'Unavailable' : batches.length ? 'On duty' : 'Available',
        status: user.status === 'active' ? 'Active' : 'Inactive',
        assignedRooms: roomsForUser.map(({ room, schedule }) => ({ ...room, schedule })),
        };
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load proctors.');
      setProctors([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSchedules = useCallback(async () => {
    const { data } = await scheduleApi.list({ per_page: 200 });
    return data.data || [];
  }, []);

  const loadRooms = useCallback(async (scheduleId) => {
    if (!scheduleId) {
      setRooms([]);
      return;
    }
    const { data } = await roomApi.list(scheduleId);
    setRooms(data.data || []);
  }, []);

  const openAssign = async (row = null) => {
    setBusy(true);
    try {
      const list = await loadSchedules();
      setSchedules(list);
      const first = list[0];
      setAssignment({
        proctorId: row ? String(row.id) : '',
        scheduleId: first ? String(first.id) : '',
        roomId: '',
      });
      await loadRooms(first?.id);
      setModal({ type: 'assign', row });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load examination rooms.');
    } finally {
      setBusy(false);
    }
  };

  const saveAssignment = async (event) => {
    event.preventDefault();
    const proctor = modal?.row || proctors.find((item) => String(item.id) === String(assignment.proctorId));
    if (!assignment.roomId || !proctor) return;
    setBusy(true);
    try {
      await roomApi.update(assignment.roomId, { proctor_id: Number(proctor.id) });
      setModal(null);
      await loadProctors();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to assign proctor.');
    } finally {
      setBusy(false);
    }
  };

  const openView = async (row) => {
    setBusy(true);
    try {
      const list = await loadSchedules();
      const assigned = [];
      for (const schedule of list) {
        const { data } = await roomApi.list(schedule.id);
        (data.data || []).filter((room) => String(room.proctor_id) === String(row.id)).forEach((room) => {
          assigned.push({ ...room, schedule });
        });
      }
      setModal({ type: 'view', row, assigned });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load proctor assignments.');
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (row) => {
    setEditForm({ name: row.name || '', email: row.email || '' });
    setModal({ type: 'edit', row });
  };

  const saveEdit = async (event) => {
    event.preventDefault();
    if (!modal?.row) return;
    setBusy(true);
    try {
      await userApi.update(modal.row.id, editForm);
      setModal(null);
      await loadProctors();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update proctor.');
    } finally {
      setBusy(false);
    }
  };

  const toggleStatus = async (row) => {
    setBusy(true);
    try {
      await userApi.updateStatus(row.id, row.status === 'Active' ? 'inactive' : 'active');
      await loadProctors();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update proctor status.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    loadProctors();
  }, [loadProctors]);

  const table = useTableState(proctors, {
    searchKeys: ['proctorId', 'name', 'email', 'batch', 'schedule', 'availability', 'status'],
    pageSize: 5,
  });

  const availableNow = proctors.filter((p) => p.availability === 'Available').length;
  const onDuty = proctors.filter((p) => p.availability === 'On duty').length;

  const availabilityVariant = (value) => {
    if (value === 'On duty') return 'default';
    return statusVariant(value);
  };

  const columns = [
    { key: 'proctorId', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email' },
    { key: 'batch', label: 'Assigned Batches', sortable: true },
    { key: 'schedule', label: 'Schedule', sortable: true },
    {
      key: 'availability',
      label: 'Availability',
      sortable: true,
      render: (row) => (
        <StatusBadge variant={availabilityVariant(row.availability)}>{row.availability}</StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="mgmt-table__actions">
          <ManagementButton variant="tertiary" size="sm" aria-label="Assign to batch" onClick={() => openAssign(row)} disabled={busy}>
            <CalendarPlus size={14} aria-hidden="true" />
          </ManagementButton>
          <ManagementButton variant="tertiary" size="sm" aria-label="View schedule" onClick={() => openView(row)} disabled={busy}>
            <Eye size={14} aria-hidden="true" />
          </ManagementButton>
          <ManagementButton variant="tertiary" size="sm" aria-label="Edit proctor" onClick={() => openEdit(row)} disabled={busy}>
            <Pencil size={14} aria-hidden="true" />
          </ManagementButton>
          <ManagementButton variant="tertiary" size="sm" aria-label={row.status === 'Active' ? 'Deactivate proctor' : 'Activate proctor'} onClick={() => toggleStatus(row)} disabled={busy}>
            <UserX size={14} aria-hidden="true" />
          </ManagementButton>
        </div>
      ),
    },
  ];

  return (
    <div className="mp-page">
      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">Management</p>
          <h1 className="mp-header__title">Proctors</h1>
          <p className="mp-header__lede">
            Assign proctors to examination batches and keep an eye on who is free, on duty, or off-roster.
          </p>
        </div>
        <div className="mp-header__actions">
          <ManagementButton variant="secondary" onClick={loadProctors} disabled={loading}>
            <RefreshCw size={16} aria-hidden="true" /> Refresh
          </ManagementButton>
          <ManagementButton variant="primary" onClick={() => openAssign()} disabled={busy || !proctors.length}>
            <Plus size={16} aria-hidden="true" /> Assign Proctor
          </ManagementButton>
        </div>
      </header>

      <div className="mp-stats" aria-label="Proctor availability summary">
        <div className="mp-stats__item">
          <div className="mp-stats__value">{proctors.length}</div>
          <div className="mp-stats__label">On the roster</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{availableNow}</div>
          <div className="mp-stats__label">Available now</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{onDuty}</div>
          <div className="mp-stats__label">Currently on duty</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{new Set(proctors.flatMap((proctor) => proctor.batch === '—' ? [] : proctor.batch.split(', '))).size}</div>
          <div className="mp-stats__label">Batches covered</div>
        </div>
      </div>

      <section className="mp-panel" aria-label="Proctor roster">
        {error ? <div className="mp-alert mp-alert--error" role="alert">{error}</div> : null}
        <ManagementToolbar
          searchId="proctor-search"
          searchValue={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Search by name, ID, or batch"
        />
        <div style={{ height: 'var(--space-base)' }} aria-hidden="true" />
        {loading ? <p className="mp-panel__hint">Loading proctors...</p> : (
          <DataTable
            columns={columns}
            rows={table.rows}
            rowKey="id"
            sortKey={table.sortKey}
            sortDir={table.sortDir}
            onSort={table.onSort}
            emptyTitle="No proctors found"
            emptyIcon={Users}
          />
        )}
        <Pagination page={table.page} pageSize={table.pageSize} total={table.total} onPageChange={table.setPage} />
      </section>

      {modal ? (
        <div className="mp-modal-overlay" role="presentation" onClick={() => !busy && setModal(null)}>
          <div className="mp-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="mp-modal__header">
              <div>
                <h2 className="mp-modal__title">
                  {modal.type === 'assign' ? 'Assign proctor' : modal.type === 'view' ? 'Proctor assignments' : 'Edit proctor'}
                </h2>
                <p className="mp-modal__subtitle">
                  {modal.row ? `${modal.row.name} · ${modal.row.email}` : 'Choose a proctor, schedule, and room.'}
                </p>
              </div>
              <button type="button" className="mp-modal__close" onClick={() => setModal(null)} aria-label="Close"><X size={18} /></button>
            </div>

            {modal.type === 'assign' ? (
              <form className="mp-form" onSubmit={saveAssignment}>
                {!modal.row ? (
                  <label className="mp-field">
                    <span className="mp-field__label">Proctor</span>
                    <select className="mp-field__input" value={assignment.proctorId} onChange={(event) => setAssignment((current) => ({ ...current, proctorId: event.target.value }))} required>
                      <option value="">Select proctor</option>
                      {proctors.map((proctor) => <option key={proctor.id} value={proctor.id}>{proctor.name} · {proctor.email}</option>)}
                    </select>
                  </label>
                ) : null}
                <label className="mp-field">
                  <span className="mp-field__label">Examination schedule</span>
                  <select className="mp-field__input" value={assignment.scheduleId} onChange={async (event) => { const value = event.target.value; setAssignment((current) => ({ ...current, scheduleId: value, roomId: '' })); await loadRooms(value); }} required>
                    <option value="">Select schedule</option>
                    {schedules.map((schedule) => <option key={schedule.id} value={schedule.id}>{schedule.date_label || schedule.exam_date || 'No date'} · {schedule.batch_code || 'No batch'} · {schedule.time_slot || [schedule.start_time, schedule.end_time].filter(Boolean).join('–') || 'No time'}</option>)}
                  </select>
                </label>
                <label className="mp-field">
                  <span className="mp-field__label">Room</span>
                  <select className="mp-field__input" value={assignment.roomId} onChange={(event) => setAssignment((current) => ({ ...current, roomId: event.target.value }))} required>
                    <option value="">Select room</option>
                    {rooms.map((room) => <option key={room.id} value={room.id}>{room.room_name} · {room.capacity} seats</option>)}
                  </select>
                </label>
                <div className="mp-modal__actions"><ManagementButton type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</ManagementButton><ManagementButton type="submit" variant="primary" disabled={busy}>Assign</ManagementButton></div>
              </form>
            ) : modal.type === 'view' ? (
              <div className="mp-form">
                {modal.assigned.length ? modal.assigned.map((item) => <div key={item.id} className="mp-panel__hint">{item.schedule.date_label || item.schedule.exam_date || 'No date'} · {item.schedule.batch_code || 'No batch'}<br /><strong>{item.room_name}</strong> · {item.schedule.time_slot || [item.schedule.start_time, item.schedule.end_time].filter(Boolean).join('–') || 'No time'}</div>) : <p className="mp-panel__hint">No rooms are assigned to this proctor.</p>}
                <div className="mp-modal__actions"><ManagementButton type="button" variant="secondary" onClick={() => setModal(null)}>Close</ManagementButton></div>
              </div>
            ) : (
              <form className="mp-form" onSubmit={saveEdit}>
                <label className="mp-field"><span className="mp-field__label">Name</span><input className="mp-field__input" value={editForm.name} onChange={(event) => setEditForm({ ...editForm, name: event.target.value })} required /></label>
                <label className="mp-field"><span className="mp-field__label">Email</span><input className="mp-field__input" type="email" value={editForm.email} onChange={(event) => setEditForm({ ...editForm, email: event.target.value })} required /></label>
                <div className="mp-modal__actions"><ManagementButton type="button" variant="secondary" onClick={() => setModal(null)}>Cancel</ManagementButton><ManagementButton type="submit" variant="primary" disabled={busy}>Save changes</ManagementButton></div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}