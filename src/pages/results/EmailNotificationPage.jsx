import { useState } from 'react';
import { Calendar, Clock, Eye, Mail, Megaphone, ScrollText, Send } from 'lucide-react';
import { ManagementToolbar, ManagementButton } from '../../components/management/ManagementToolbar';
import { DataTable } from '../../components/management/DataTable';
import { StatusBadge } from '../../components/management/StatusBadge';
import { FilterDropdown } from '../../components/management/FilterDropdown';
import { Pagination } from '../../components/management/Pagination';
import { useTableState, statusVariant } from '../management/useTableState';
import '../../components/management/management.css';
import '../management/management-pages.css';
import './results-pages.css';

const NOTIFICATION_HISTORY = [
  { id: 1, type: 'Announcement', subject: 'Examination guidelines update', recipients: 2483, sentAt: 'Jun 1, 2025 08:10 AM', deliveryStatus: 'Delivered' },
  { id: 2, type: 'Exam Schedule', subject: 'College Admission Test — May 28 schedule', recipients: 312, sentAt: 'May 27, 2025 02:30 PM', deliveryStatus: 'Delivered' },
  { id: 3, type: 'Reminder', subject: 'Exam reminder — 24 hours before start', recipients: 148, sentAt: 'May 27, 2025 09:00 AM', deliveryStatus: 'Delivered' },
  { id: 4, type: 'Result Notification', subject: 'Exam results released — College Admission Test', recipients: 287, sentAt: 'May 29, 2025 04:15 PM', deliveryStatus: 'Delivered' },
  { id: 5, type: 'Reminder', subject: 'Bring valid ID and exam permit', recipients: 148, sentAt: 'May 26, 2025 11:00 AM', deliveryStatus: 'Pending' },
  { id: 6, type: 'Result Notification', subject: 'Exam results released — Scholarship Examination', recipients: 195, sentAt: 'May 30, 2025 03:45 PM', deliveryStatus: 'Delivered' },
  { id: 7, type: 'Announcement', subject: 'Lobby rules and anti-cheat policy', recipients: 2483, sentAt: 'May 25, 2025 10:00 AM', deliveryStatus: 'Failed' },
  { id: 8, type: 'Exam Schedule', subject: 'Course Placement Test — May 30 schedule', recipients: 256, sentAt: 'May 28, 2025 01:00 PM', deliveryStatus: 'Delivered' },
];

const NOTIFICATION_TYPES = ['Announcement', 'Exam Schedule', 'Reminder', 'Result Notification'];

function deliveryVariant(status) {
  const value = String(status).toLowerCase();
  if (value === 'delivered') return 'success';
  if (value === 'failed') return 'error';
  if (value === 'pending') return 'muted';
  return statusVariant(status);
}

const COMPOSE_ACTIONS = [
  { key: 'announcement', label: 'Send Announcements', icon: Megaphone, description: 'Broadcast general updates to all examinees.' },
  { key: 'schedule', label: 'Exam Schedules', icon: Calendar, description: 'Notify students of upcoming examination dates.' },
  { key: 'reminder', label: 'Reminders', icon: Clock, description: 'Send automated reminders before exam day.' },
  { key: 'results', label: 'Result Notifications', icon: ScrollText, description: 'Deliver exam results while keeping a history of sent messages.' },
];

export default function EmailNotificationPage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeCompose, setActiveCompose] = useState('announcement');

  const table = useTableState(NOTIFICATION_HISTORY, {
    searchKeys: ['type', 'subject', 'deliveryStatus', 'sentAt'],
    pageSize: 6,
    filterFn: (row) => {
      if (typeFilter !== 'all' && row.type !== typeFilter) return false;
      if (statusFilter !== 'all' && row.deliveryStatus.toLowerCase() !== statusFilter) return false;
      return true;
    },
  });

  const deliveredCount = NOTIFICATION_HISTORY.filter((n) => n.deliveryStatus === 'Delivered').length;
  const pendingCount = NOTIFICATION_HISTORY.filter((n) => n.deliveryStatus === 'Pending').length;
  const failedCount = NOTIFICATION_HISTORY.filter((n) => n.deliveryStatus === 'Failed').length;

  const activeAction = COMPOSE_ACTIONS.find((a) => a.key === activeCompose);

  const columns = [
    { key: 'type', label: 'Type', sortable: true },
    { key: 'subject', label: 'Subject', sortable: true },
    { key: 'recipients', label: 'Recipients', sortable: true },
    { key: 'sentAt', label: 'Sent At', sortable: true },
    {
      key: 'deliveryStatus',
      label: 'Delivery Status',
      sortable: true,
      render: (row) => (
        <StatusBadge variant={deliveryVariant(row.deliveryStatus)}>{row.deliveryStatus}</StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: () => (
        <div className="mgmt-table__actions">
          <ManagementButton variant="tertiary" size="sm" aria-label="View notification details">
            <Eye size={14} aria-hidden="true" /> View
          </ManagementButton>
        </div>
      ),
    },
  ];

  return (
    <div className="mp-page">
      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">Results &amp; Reports</p>
          <h1 className="mp-header__title">Email Notification</h1>
          <p className="mp-header__lede">
            Send announcements, schedules, reminders, and result notifications — with full delivery history.
          </p>
        </div>
        <div className="mp-header__actions">
          <ManagementButton variant="primary">
            <Send size={16} aria-hidden="true" /> Compose Email
          </ManagementButton>
        </div>
      </header>

      <div className="mp-stats" aria-label="Notification summary">
        <div className="mp-stats__item">
          <div className="mp-stats__value">{NOTIFICATION_HISTORY.length}</div>
          <div className="mp-stats__label">Total sent</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{deliveredCount}</div>
          <div className="mp-stats__label">Delivered</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{pendingCount}</div>
          <div className="mp-stats__label">Pending</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{failedCount}</div>
          <div className="mp-stats__label">Failed</div>
        </div>
      </div>

      <div className="mp-split">
        <section className="mp-panel" aria-label="Compose notification">
          <h2 className="mp-panel__title">Compose</h2>
          <div className="mp-cat-grid">
            {COMPOSE_ACTIONS.map(({ key, label, icon: Icon, description }) => (
              <button
                key={key}
                type="button"
                className={`mp-cat-card mp-cat-card--action${activeCompose === key ? ' mp-cat-card--active' : ''}`}
                onClick={() => setActiveCompose(key)}
              >
                <div className="mp-cat-card__subject">
                  <Icon size={16} aria-hidden="true" style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  {label}
                </div>
                <p className="mp-cat-card__meta">{description}</p>
              </button>
            ))}
          </div>

          {activeAction && (
            <div className="mp-panel__body" style={{ marginTop: 'var(--space-base)' }}>
              <label className="rp-compose__label" htmlFor="email-subject">
                Subject
              </label>
              <input
                id="email-subject"
                type="text"
                className="rp-compose__input"
                placeholder={`${activeAction.label} subject...`}
              />
              <label className="rp-compose__label" htmlFor="email-body">
                Message
              </label>
              <textarea
                id="email-body"
                className="rp-compose__textarea"
                rows={4}
                placeholder="Write your message to examinees..."
              />
              <ManagementButton variant="primary">
                <Send size={16} aria-hidden="true" /> Send {activeAction.label}
              </ManagementButton>
            </div>
          )}
        </section>

        <section className="mp-panel" aria-label="Delivery status overview">
          <h2 className="mp-panel__title">Delivery Status</h2>
          <div className="mp-bars">
            <div className="mp-bar">
              <span>Delivered</span>
              <div className="mp-bar__track">
                <div
                  className="mp-bar__fill mp-bar__fill--ink"
                  style={{ width: `${(deliveredCount / NOTIFICATION_HISTORY.length) * 100}%` }}
                />
              </div>
              <span className="mp-bar__value">{deliveredCount}</span>
            </div>
            <div className="mp-bar">
              <span>Pending</span>
              <div className="mp-bar__track">
                <div
                  className="mp-bar__fill"
                  style={{ width: `${(pendingCount / NOTIFICATION_HISTORY.length) * 100}%` }}
                />
              </div>
              <span className="mp-bar__value">{pendingCount}</span>
            </div>
            <div className="mp-bar">
              <span>Failed</span>
              <div className="mp-bar__track">
                <div
                  className="mp-bar__fill"
                  style={{ width: `${(failedCount / NOTIFICATION_HISTORY.length) * 100}%` }}
                />
              </div>
              <span className="mp-bar__value">{failedCount}</span>
            </div>
          </div>
        </section>
      </div>

      <section className="mp-panel" aria-label="Notification history">
        <h2 className="mp-panel__title">Sent History</h2>
        <ManagementToolbar
          searchId="notification-search"
          searchValue={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Search by subject, type, or status"
          filters={[
            <FilterDropdown
              key="type"
              id="notification-type-filter"
              value={typeFilter}
              onChange={(value) => {
                setTypeFilter(value);
                table.setPage(1);
              }}
              options={[
                { value: 'all', label: 'All types' },
                ...NOTIFICATION_TYPES.map((type) => ({ value: type, label: type })),
              ]}
            />,
            <FilterDropdown
              key="status"
              id="notification-status-filter"
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                table.setPage(1);
              }}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'pending', label: 'Pending' },
                { value: 'failed', label: 'Failed' },
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
          emptyTitle="No notifications match"
          emptyDescription="Try a different subject, type, or delivery status."
          emptyIcon={Mail}
        />
        <Pagination page={table.page} pageSize={table.pageSize} total={table.total} onPageChange={table.setPage} />
      </section>
    </div>
  );
}
