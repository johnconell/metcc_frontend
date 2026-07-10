import { CalendarPlus, Eye, Pencil, Plus, UserX, Users } from 'lucide-react';
import { ManagementToolbar, ManagementButton } from '../../components/management/ManagementToolbar';
import { DataTable } from '../../components/management/DataTable';
import { StatusBadge } from '../../components/management/StatusBadge';
import { Pagination } from '../../components/management/Pagination';
import { useTableState, statusVariant } from './useTableState';
import '../../components/management/management.css';
import './management-pages.css';

const PROCTORS = [
  { id: 1, proctorId: 'PRC-001', name: 'Maria D. Santos', email: 'm.santos@tcc.edu.ph', batch: 'Batch A, Batch G', schedule: 'May 28 · Jun 3', availability: 'Available', status: 'Active' },
  { id: 2, proctorId: 'PRC-002', name: 'John Mark Rivera', email: 'j.rivera@tcc.edu.ph', batch: 'Batch B', schedule: 'May 29', availability: 'Available', status: 'Active' },
  { id: 3, proctorId: 'PRC-003', name: 'Ana L. Gonzales', email: 'a.gonzales@tcc.edu.ph', batch: 'Batch C', schedule: 'May 30', availability: 'On duty', status: 'Active' },
  { id: 4, proctorId: 'PRC-004', name: 'Michael P. Tampus', email: 'm.tampus@tcc.edu.ph', batch: 'Batch D', schedule: 'May 31', availability: 'Available', status: 'Active' },
  { id: 5, proctorId: 'PRC-005', name: 'Rosemarie J. Villa', email: 'r.villa@tcc.edu.ph', batch: 'Batch E', schedule: 'Jun 1', availability: 'Unavailable', status: 'Inactive' },
];

export default function ProctorsPage() {
  const table = useTableState(PROCTORS, {
    searchKeys: ['proctorId', 'name', 'email', 'batch', 'schedule', 'availability', 'status'],
    pageSize: 5,
  });

  const availableNow = PROCTORS.filter((p) => p.availability === 'Available').length;
  const onDuty = PROCTORS.filter((p) => p.availability === 'On duty').length;

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
      render: () => (
        <div className="mgmt-table__actions">
          <ManagementButton variant="tertiary" size="sm" aria-label="Assign to batch">
            <CalendarPlus size={14} aria-hidden="true" />
          </ManagementButton>
          <ManagementButton variant="tertiary" size="sm" aria-label="View schedule">
            <Eye size={14} aria-hidden="true" />
          </ManagementButton>
          <ManagementButton variant="tertiary" size="sm" aria-label="Edit proctor">
            <Pencil size={14} aria-hidden="true" />
          </ManagementButton>
          <ManagementButton variant="tertiary" size="sm" aria-label="Deactivate proctor">
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
          <ManagementButton variant="primary">
            <Plus size={16} aria-hidden="true" /> Assign Proctor
          </ManagementButton>
        </div>
      </header>

      <div className="mp-stats" aria-label="Proctor availability summary">
        <div className="mp-stats__item">
          <div className="mp-stats__value">{PROCTORS.length}</div>
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
          <div className="mp-stats__value">7</div>
          <div className="mp-stats__label">Batches covered</div>
        </div>
      </div>

      <section className="mp-panel" aria-label="Proctor roster">
        <ManagementToolbar
          searchId="proctor-search"
          searchValue={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Search by name, ID, or batch"
        />
        <div style={{ height: 'var(--space-base)' }} aria-hidden="true" />
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
        <Pagination page={table.page} pageSize={table.pageSize} total={table.total} onPageChange={table.setPage} />
      </section>
    </div>
  );
}
