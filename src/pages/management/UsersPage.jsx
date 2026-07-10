import { Download, KeyRound, Shield, UserPlus, Users } from 'lucide-react';
import { ManagementToolbar, ManagementButton } from '../../components/management/ManagementToolbar';
import { DataTable } from '../../components/management/DataTable';
import { StatusBadge } from '../../components/management/StatusBadge';
import { Pagination } from '../../components/management/Pagination';
import { useTableState, statusVariant } from './useTableState';
import '../../components/management/management.css';
import './management-pages.css';

const TOTAL_USERS = 248;

const ROLE_BREAKDOWN = [
  { role: 'Students', count: 186 },
  { role: 'Faculty', count: 38 },
  { role: 'Admins', count: 12 },
  { role: 'Proctors', count: 12 },
];

const LOGIN_ACTIVITY = [
  { id: 1, user: 'Kent Russel Casino', role: 'Administrator', time: 'Today, 08:30 AM', status: 'Active' },
  { id: 2, user: 'Maria D. Santos', role: 'Proctor', time: 'Today, 08:12 AM', status: 'Active' },
  { id: 3, user: 'Juan Dela Cruz', role: 'Student', time: 'Yesterday, 04:45 PM', status: 'Active' },
  { id: 4, user: 'Ana L. Gonzales', role: 'Faculty', time: 'Yesterday, 02:20 PM', status: 'Inactive' },
  { id: 5, user: 'Camille Torres', role: 'Student', time: 'May 27, 09:02 AM', status: 'Pending' },
];

export default function UsersPage() {
  const table = useTableState(LOGIN_ACTIVITY, {
    searchKeys: ['user', 'role', 'time', 'status'],
    pageSize: 5,
  });

  const columns = [
    { key: 'user', label: 'User', sortable: true },
    { key: 'role', label: 'Role', sortable: true },
    { key: 'time', label: 'Last Login', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge variant={statusVariant(row.status)}>{row.status}</StatusBadge>,
    },
  ];

  return (
    <div className="mp-page">
      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">Management</p>
          <h1 className="mp-header__title">User Management</h1>
          <p className="mp-header__lede">
            {TOTAL_USERS} accounts across students, faculty, proctors, and administrators.
          </p>
        </div>
        <div className="mp-header__actions">
          <ManagementButton variant="secondary">
            <Download size={16} aria-hidden="true" /> Export
          </ManagementButton>
          <ManagementButton variant="primary">
            <UserPlus size={16} aria-hidden="true" /> Add User
          </ManagementButton>
        </div>
      </header>

      <div className="mp-stats" aria-label="Account status summary">
        <div className="mp-stats__item">
          <div className="mp-stats__value">231</div>
          <div className="mp-stats__label">Active accounts</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">14</div>
          <div className="mp-stats__label">Inactive</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">3</div>
          <div className="mp-stats__label">Pending approval</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">27</div>
          <div className="mp-stats__label">Logins today</div>
        </div>
      </div>

      <div className="mp-split">
        <section className="mp-panel" aria-label="Recent login activity">
          <h2 className="mp-panel__title">Recent Login Activity</h2>
          <div className="mp-panel__body">
            <ManagementToolbar
              searchId="user-search"
              searchValue={table.search}
              onSearchChange={table.setSearch}
              searchPlaceholder="Search users"
            />
            <DataTable
              columns={columns}
              rows={table.rows}
              rowKey="id"
              sortKey={table.sortKey}
              sortDir={table.sortDir}
              onSort={table.onSort}
              emptyTitle="No login activity"
              emptyIcon={Users}
            />
            <Pagination
              page={table.page}
              pageSize={table.pageSize}
              total={table.total}
              onPageChange={table.setPage}
            />
          </div>
        </section>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <aside className="mp-panel" aria-label="Users by role">
            <h2 className="mp-panel__title">By Role</h2>
            <div className="mp-bars">
              {ROLE_BREAKDOWN.map((item, index) => (
                <div key={item.role} className="mp-bar">
                  <span>{item.role}</span>
                  <div className="mp-bar__track">
                    <div
                      className={`mp-bar__fill${index === 0 ? ' mp-bar__fill--ink' : ''}`}
                      style={{ width: `${Math.round((item.count / TOTAL_USERS) * 100)}%` }}
                    />
                  </div>
                  <span className="mp-bar__value">{item.count}</span>
                </div>
              ))}
            </div>
          </aside>

          <aside className="mp-panel" aria-label="Account tools">
            <h2 className="mp-panel__title">Account Tools</h2>
            <div className="mp-panel__body">
              <ManagementButton variant="secondary" style={{ justifyContent: 'flex-start' }}>
                <Shield size={16} aria-hidden="true" /> Roles &amp; Permissions
              </ManagementButton>
              <ManagementButton variant="secondary" style={{ justifyContent: 'flex-start' }}>
                <KeyRound size={16} aria-hidden="true" /> Reset a Password
              </ManagementButton>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
