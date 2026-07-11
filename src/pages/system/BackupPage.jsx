import { useState } from 'react';
import { Clock, Database, Download, HardDrive, RotateCcw } from 'lucide-react';
import { ManagementToolbar, ManagementButton } from '../../components/management/ManagementToolbar';
import { DataTable } from '../../components/management/DataTable';
import { StatusBadge } from '../../components/management/StatusBadge';
import { Pagination } from '../../components/management/Pagination';
import { useTableState, statusVariant } from '../management/useTableState';
import '../../components/management/management.css';
import '../management/management-pages.css';
import './system-pages.css';

const BACKUP_HISTORY = [
  { id: 1, name: 'backup-2025-06-01-full', size: '248 MB', createdAt: 'Jun 1, 2025 02:00 AM', type: 'Automatic', status: 'Completed' },
  { id: 2, name: 'backup-2025-05-31-manual', size: '246 MB', createdAt: 'May 31, 2025 04:30 PM', type: 'Manual', status: 'Completed' },
  { id: 3, name: 'backup-2025-05-30-full', size: '244 MB', createdAt: 'May 30, 2025 02:00 AM', type: 'Automatic', status: 'Completed' },
  { id: 4, name: 'backup-2025-05-29-full', size: '241 MB', createdAt: 'May 29, 2025 02:00 AM', type: 'Automatic', status: 'Completed' },
  { id: 5, name: 'backup-2025-05-28-manual', size: '239 MB', createdAt: 'May 28, 2025 11:15 AM', type: 'Manual', status: 'Completed' },
  { id: 6, name: 'backup-2025-05-27-full', size: '237 MB', createdAt: 'May 27, 2025 02:00 AM', type: 'Automatic', status: 'Failed' },
];

export default function BackupPage() {
  const [autoBackup, setAutoBackup] = useState(true);

  const table = useTableState(BACKUP_HISTORY, {
    searchKeys: ['name', 'createdAt', 'type', 'status'],
    pageSize: 5,
  });

  const completedCount = BACKUP_HISTORY.filter((b) => b.status === 'Completed').length;

  const columns = [
    { key: 'name', label: 'Backup Name', sortable: true },
    { key: 'size', label: 'Size', sortable: true },
    { key: 'createdAt', label: 'Created At', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge variant={statusVariant(row.status)}>{row.status}</StatusBadge>,
    },
    {
      key: 'actions',
      label: '',
      render: () => (
        <div className="mgmt-table__actions">
          <ManagementButton variant="tertiary" size="sm" aria-label="Download backup">
            <Download size={14} aria-hidden="true" /> Download
          </ManagementButton>
          <ManagementButton variant="tertiary" size="sm" aria-label="Restore backup">
            <RotateCcw size={14} aria-hidden="true" /> Restore
          </ManagementButton>
        </div>
      ),
    },
  ];

  return (
    <div className="mp-page">
      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">System</p>
          <h1 className="mp-header__title">Backup</h1>
          <p className="mp-header__lede">
            Create, restore, and download system backups. {completedCount} successful backups on record.
          </p>
        </div>
        <div className="mp-header__actions">
          <ManagementButton variant="primary">
            <Database size={16} aria-hidden="true" /> Create Backup
          </ManagementButton>
        </div>
      </header>

      <div className="mp-split">
        <section className="mp-panel" aria-label="Automatic backup settings">
          <h2 className="mp-panel__title">Automatic Backup</h2>
          <div className="sp-form">
            <label className="sp-form__toggle">
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={(e) => setAutoBackup(e.target.checked)}
              />
              <span>Enable automatic daily backup at 2:00 AM</span>
            </label>
            <label className="sp-form__label" htmlFor="backup-retention">Retention Period (days)</label>
            <input id="backup-retention" type="number" className="sp-form__input" defaultValue="30" />
            <label className="sp-form__label" htmlFor="backup-location">Backup Location</label>
            <input id="backup-location" type="text" className="sp-form__input" defaultValue="/storage/backups/" readOnly />
          </div>
          <div className="mp-highlight" role="note" style={{ marginTop: 'var(--space-base)' }}>
            <span className="mp-highlight__icon">
              <Clock size={18} aria-hidden="true" />
            </span>
            <div className="mp-highlight__text">
              <p className="mp-highlight__title">Next scheduled backup</p>
              <p className="mp-highlight__meta">Jun 2, 2025 at 2:00 AM · Full database backup</p>
            </div>
            <StatusBadge variant={autoBackup ? 'success' : 'muted'}>
              {autoBackup ? 'Enabled' : 'Disabled'}
            </StatusBadge>
          </div>
        </section>

        <section className="mp-panel" aria-label="Quick actions">
          <h2 className="mp-panel__title">Quick Actions</h2>
          <div className="mp-panel__body">
            <ManagementButton variant="primary" className="sp-action-btn">
              <Database size={16} aria-hidden="true" /> Create Backup
            </ManagementButton>
            <ManagementButton variant="secondary" className="sp-action-btn">
              <RotateCcw size={16} aria-hidden="true" /> Restore Backup
            </ManagementButton>
            <ManagementButton variant="secondary" className="sp-action-btn">
              <Download size={16} aria-hidden="true" /> Download Latest Backup
            </ManagementButton>
          </div>
        </section>
      </div>

      <section className="mp-panel" aria-label="Backup history">
        <h2 className="mp-panel__title">Backup History</h2>
        <ManagementToolbar
          searchId="backup-search"
          searchValue={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Search backup history"
        />
        <div style={{ height: 'var(--space-base)' }} aria-hidden="true" />
        <DataTable
          columns={columns}
          rows={table.rows}
          rowKey="id"
          sortKey={table.sortKey}
          sortDir={table.sortDir}
          onSort={table.onSort}
          emptyTitle="No backups found"
          emptyDescription="Create your first backup to get started."
          emptyIcon={HardDrive}
        />
        <Pagination page={table.page} pageSize={table.pageSize} total={table.total} onPageChange={table.setPage} />
      </section>
    </div>
  );
}
