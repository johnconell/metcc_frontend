import { useState } from 'react';
import { Archive, CalendarClock, CalendarDays, Pencil, Plus } from 'lucide-react';
import { ManagementToolbar, ManagementButton } from '../../components/management/ManagementToolbar';
import { DataTable } from '../../components/management/DataTable';
import { StatusBadge } from '../../components/management/StatusBadge';
import { FilterDropdown } from '../../components/management/FilterDropdown';
import { Pagination } from '../../components/management/Pagination';
import { useTableState, statusVariant } from './useTableState';
import '../../components/management/management.css';
import './management-pages.css';

const SCHEDULES = [
  { id: 1, date: 'May 28, 2025', time: '08:00 AM', venue: 'Room 101', batch: 'Batch A', course: 'BSIT', status: 'Scheduled', proctor: 'Maria D. Santos' },
  { id: 2, date: 'May 29, 2025', time: '09:30 AM', venue: 'Room 102', batch: 'Batch B', course: 'BSED', status: 'Scheduled', proctor: 'John Mark Rivera' },
  { id: 3, date: 'May 30, 2025', time: '01:00 PM', venue: 'Room 103', batch: 'Batch C', course: 'BSBA', status: 'Ongoing', proctor: 'Ana L. Gonzales' },
  { id: 4, date: 'May 31, 2025', time: '08:00 AM', venue: 'Room 104', batch: 'Batch D', course: 'BSCrim', status: 'Scheduled', proctor: 'Michael P. Tampus' },
  { id: 5, date: 'Jun 1, 2025', time: '10:00 AM', venue: 'Room 105', batch: 'Batch E', course: 'BSN', status: 'Archived', proctor: 'Rosemarie J. Villa' },
  { id: 6, date: 'Jun 2, 2025', time: '02:00 PM', venue: 'Room 106', batch: 'Batch F', course: 'BSHM', status: 'Scheduled', proctor: 'Kent Russel Casino' },
  { id: 7, date: 'Jun 3, 2025', time: '08:00 AM', venue: 'AVR Hall', batch: 'Batch G', course: 'BSIT', status: 'Scheduled', proctor: 'Maria D. Santos' },
];

export default function SchedulesPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const table = useTableState(SCHEDULES, {
    searchKeys: ['date', 'venue', 'batch', 'course', 'proctor', 'status'],
    pageSize: 6,
    filterFn: statusFilter === 'all' ? undefined : (row) => row.status.toLowerCase() === statusFilter,
  });

  const columns = [
    { key: 'date', label: 'Date', sortable: true },
    { key: 'time', label: 'Time', sortable: true },
    { key: 'venue', label: 'Venue', sortable: true },
    { key: 'batch', label: 'Batch', sortable: true },
    { key: 'course', label: 'Course', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge variant={statusVariant(row.status)}>{row.status}</StatusBadge>,
    },
    { key: 'proctor', label: 'Assigned Proctor', sortable: true },
    {
      key: 'actions',
      label: '',
      render: () => (
        <div className="mgmt-table__actions">
          <ManagementButton variant="tertiary" size="sm" aria-label="Edit schedule">
            <Pencil size={14} aria-hidden="true" /> Edit
          </ManagementButton>
          <ManagementButton variant="tertiary" size="sm" aria-label="Archive schedule">
            <Archive size={14} aria-hidden="true" /> Archive
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
          <h1 className="mp-header__title">Examination Schedules</h1>
          <p className="mp-header__lede">
            Plan examination dates, assign venues and proctors, and keep every batch on track.
          </p>
        </div>
        <div className="mp-header__actions">
          <ManagementButton variant="primary">
            <Plus size={16} aria-hidden="true" />
            New Schedule
          </ManagementButton>
        </div>
      </header>

      <div className="mp-highlight" role="note">
        <span className="mp-highlight__icon">
          <CalendarClock size={18} aria-hidden="true" />
        </span>
        <div className="mp-highlight__text">
          <p className="mp-highlight__title">Course Placement Test is ongoing</p>
          <p className="mp-highlight__meta">Room 103 · Batch C · proctored by Ana L. Gonzales · started 1:00 PM</p>
        </div>
        <StatusBadge variant="success">Ongoing</StatusBadge>
      </div>

      <div className="mp-stats" aria-label="Schedule summary">
        <div className="mp-stats__item">
          <div className="mp-stats__value">7</div>
          <div className="mp-stats__label">Exams this cycle</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">5</div>
          <div className="mp-stats__label">Upcoming</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">6</div>
          <div className="mp-stats__label">Venues in use</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">0</div>
          <div className="mp-stats__label">Without a proctor</div>
        </div>
      </div>

      <section className="mp-panel" aria-label="Schedule list">
        <ManagementToolbar
          searchId="schedule-search"
          searchValue={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Search by date, venue, batch, or proctor"
          filters={[
            <FilterDropdown
              key="status"
              id="schedule-status-filter"
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                table.setPage(1);
              }}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'ongoing', label: 'Ongoing' },
                { value: 'archived', label: 'Archived' },
              ]}
            />,
          ]}
        />
        <div style={{ height: 'var(--space-base)' }} aria-hidden="true" />
        <DataTable
          columns={columns}
          rows={table.rows}
          rowKey="id"
          sortKey={table.sortKey}
          sortDir={table.sortDir}
          onSort={table.onSort}
          emptyTitle="No schedules match"
          emptyDescription="Try a different search term or status filter."
          emptyIcon={CalendarDays}
        />
        <Pagination page={table.page} pageSize={table.pageSize} total={table.total} onPageChange={table.setPage} />
      </section>
    </div>
  );
}
