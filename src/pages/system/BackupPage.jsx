import { useState } from 'react';
import { Clock, Database, Download, HardDrive, History, RotateCcw, Settings2, Zap } from 'lucide-react';
import { ManagementToolbar, ManagementButton } from '../../components/management/ManagementToolbar';
import { DataTable } from '../../components/management/DataTable';
import { StatusBadge } from '../../components/management/StatusBadge';
import { Pagination } from '../../components/management/Pagination';
import { useTableState, statusVariant } from '../management/useTableState';
import { confirmAction, toastSuccess, toastInfo } from '../../utils/swal';
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

  const handleCreateBackup = async () => {
    const ok = await confirmAction({
      title: 'Are you sure?',
      text: 'Create a new system backup?',
    });
    if (!ok) return;
    await toastSuccess('Backup Created Successfully');
  };

  const handleRestore = async (name) => {
    const ok = await confirmAction({
      title: 'Are you sure?',
      text: `Restore backup${name ? ` "${name}"` : ''}? This action cannot be undone.`,
    });
    if (!ok) return;
    await toastSuccess('Backup Restored Successfully');
  };

  const handleDownload = async (name) => {
    const ok = await confirmAction({
      title: 'Are you sure?',
      text: `Download backup${name ? ` "${name}"` : ''}?`,
    });
    if (!ok) return;
    await toastInfo('Download Started', name ? `Preparing ${name}…` : 'Preparing latest backup…');
  };

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
      render: (row) => (
        <div className="mgmt-table__actions">
          <ManagementButton variant="tertiary" size="sm" aria-label="Download backup" onClick={() => handleDownload(row.name)}>
            <Download size={14} aria-hidden="true" /> Download
          </ManagementButton>
          <ManagementButton variant="tertiary" size="sm" aria-label="Restore backup" onClick={() => handleRestore(row.name)}>
            <RotateCcw size={14} aria-hidden="true" /> Restore
          </ManagementButton>
        </div>
      ),
    },
  ];

  return (
    <div className="mp-page">
      <header className="mp-header">
        <div className="sp-page-heading">
          <span className="sp-page-heading__icon" aria-hidden="true"><HardDrive size={20} /></span>
          <div>
          <p className="mp-header__eyebrow">System</p>
          <h1 className="mp-header__title">Backup</h1>
          <p className="mp-header__lede">
            Create and restore system backups. {completedCount} completed backups.
          </p>
          </div>
        </div>
        <div className="mp-header__actions">
          <ManagementButton variant="primary" onClick={handleCreateBackup}>
            <Database size={16} aria-hidden="true" /> Create Backup
          </ManagementButton>
        </div>
      </header>

      <div className="mp-split">
        <section className="mp-panel" aria-label="Automatic backup settings">
          <h2 className="mp-panel__title"><Settings2 size={17} aria-hidden="true" /> Automatic Backup</h2>
          <div className="sp-form">
            <label className="sp-form__toggle">
              <input
                type="checkbox"
                checked={autoBackup}
                onChange={async (e) => {
                  const next = e.target.checked;
                  const ok = await confirmAction({
                    title: 'Are you sure?',
                    text: next ? 'Enable automatic daily backup?' : 'Disable automatic daily backup?',
                  });
                  if (!ok) return;
                  setAutoBackup(next);
                  await toastSuccess('Settings Saved Successfully');
                }}
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
          <h2 className="mp-panel__title"><Zap size={17} aria-hidden="true" /> Quick Actions</h2>
          <div className="mp-panel__body">
            <ManagementButton variant="primary" className="sp-action-btn" onClick={handleCreateBackup}>
              <Database size={16} aria-hidden="true" /> Create Backup
            </ManagementButton>
            <ManagementButton variant="secondary" className="sp-action-btn" onClick={() => handleRestore()}>
              <RotateCcw size={16} aria-hidden="true" /> Restore Backup
            </ManagementButton>
            <ManagementButton variant="secondary" className="sp-action-btn" onClick={() => handleDownload()}>
              <Download size={16} aria-hidden="true" /> Download Latest Backup
            </ManagementButton>
          </div>
        </section>
      </div>

      <section className="mp-panel" aria-label="Backup history">
        <h2 className="mp-panel__title"><History size={17} aria-hidden="true" /> Backup History</h2>
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
