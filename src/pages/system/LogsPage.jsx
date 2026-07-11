import { useState } from 'react';
import { FileText } from 'lucide-react';
import { ManagementToolbar } from '../../components/management/ManagementToolbar';
import { DataTable } from '../../components/management/DataTable';
import { FilterDropdown } from '../../components/management/FilterDropdown';
import { Pagination } from '../../components/management/Pagination';
import { useTableState } from '../management/useTableState';
import '../../components/management/management.css';
import '../management/management-pages.css';

const ACTIVITY_LOGS = [
  { id: 1, user: 'Kent Russel Casino', action: 'Published examination lobby', dateTime: 'Jun 1, 2025 08:30 AM' },
  { id: 2, user: 'Maria D. Santos', action: 'Updated question bank — General Knowledge', dateTime: 'Jun 1, 2025 08:15 AM' },
  { id: 3, user: 'John Mark Rivera', action: 'Assigned proctor to Batch B schedule', dateTime: 'May 31, 2025 04:45 PM' },
  { id: 4, user: 'Kent Russel Casino', action: 'Exported exam results to PDF', dateTime: 'May 31, 2025 02:20 PM' },
  { id: 5, user: 'Ana L. Gonzales', action: 'Started Course Placement Test', dateTime: 'May 30, 2025 01:00 PM' },
  { id: 6, user: 'Michael P. Tampus', action: 'Imported 48 student records', dateTime: 'May 30, 2025 10:30 AM' },
  { id: 7, user: 'Kent Russel Casino', action: 'Sent result notifications to 287 students', dateTime: 'May 29, 2025 04:15 PM' },
  { id: 8, user: 'Rosemarie J. Villa', action: 'Created new examination schedule', dateTime: 'May 29, 2025 09:00 AM' },
  { id: 9, user: 'Kent Russel Casino', action: 'Updated security settings', dateTime: 'May 28, 2025 03:10 PM' },
  { id: 10, user: 'Maria D. Santos', action: 'Logged in', dateTime: 'May 28, 2025 08:00 AM' },
];

const USERS = [...new Set(ACTIVITY_LOGS.map((l) => l.user))];
const ACTIONS = ['Login', 'Export', 'Import', 'Update', 'Create', 'Send', 'Publish'];

export default function LogsPage() {
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const table = useTableState(ACTIVITY_LOGS, {
    searchKeys: ['user', 'action', 'dateTime'],
    pageSize: 8,
    filterFn: (row) => {
      if (userFilter !== 'all' && row.user !== userFilter) return false;
      if (actionFilter !== 'all') {
        const actionLower = row.action.toLowerCase();
        if (!actionLower.includes(actionFilter.toLowerCase())) return false;
      }
      return true;
    },
  });

  const columns = [
    { key: 'user', label: 'User', sortable: true },
    { key: 'action', label: 'Action', sortable: true },
    { key: 'dateTime', label: 'Date & Time', sortable: true },
  ];

  return (
    <div className="mp-page">
      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">System</p>
          <h1 className="mp-header__title">Activity Logs</h1>
          <p className="mp-header__lede">
            {ACTIVITY_LOGS.length} recorded activities — search and filter by user, action, or date.
          </p>
        </div>
      </header>

      <div className="mp-stats" aria-label="Log summary">
        <div className="mp-stats__item">
          <div className="mp-stats__value">{ACTIVITY_LOGS.length}</div>
          <div className="mp-stats__label">Total entries</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{USERS.length}</div>
          <div className="mp-stats__label">Active users</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">Today</div>
          <div className="mp-stats__label">Latest activity</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">Jun 1</div>
          <div className="mp-stats__label">Last entry date</div>
        </div>
      </div>

      <section className="mp-panel" aria-label="Activity logs">
        <h2 className="mp-panel__title">Activity Logs</h2>
        <ManagementToolbar
          searchId="logs-search"
          searchValue={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Search by user, action, or date"
          filters={[
            <FilterDropdown
              key="user"
              id="logs-user-filter"
              value={userFilter}
              onChange={(value) => {
                setUserFilter(value);
                table.setPage(1);
              }}
              options={[
                { value: 'all', label: 'All users' },
                ...USERS.map((user) => ({ value: user, label: user })),
              ]}
            />,
            <FilterDropdown
              key="action"
              id="logs-action-filter"
              value={actionFilter}
              onChange={(value) => {
                setActionFilter(value);
                table.setPage(1);
              }}
              options={[
                { value: 'all', label: 'All actions' },
                ...ACTIONS.map((action) => ({ value: action, label: action })),
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
          emptyTitle="No logs match"
          emptyDescription="Try a different user, action, or search term."
          emptyIcon={FileText}
        />
        <Pagination page={table.page} pageSize={table.pageSize} total={table.total} onPageChange={table.setPage} />
      </section>
    </div>
  );
}
