import { useState } from 'react';
import { BookOpen, Download, FileStack, Pencil, Plus, Upload } from 'lucide-react';
import { ManagementToolbar, ManagementButton } from '../../components/management/ManagementToolbar';
import { DataTable } from '../../components/management/DataTable';
import { StatusBadge } from '../../components/management/StatusBadge';
import { Pagination } from '../../components/management/Pagination';
import { useTableState, statusVariant } from './useTableState';
import '../../components/management/management.css';
import './management-pages.css';

const CATEGORIES = [
  { subject: 'Mathematics', count: 312, updated: 'Updated yesterday' },
  { subject: 'English', count: 274, updated: 'Updated May 27' },
  { subject: 'Science', count: 236, updated: 'Updated May 25' },
  { subject: 'General Knowledge', count: 198, updated: 'Updated today' },
  { subject: 'Abstract Reasoning', count: 145, updated: 'Updated May 20' },
  { subject: 'Filipino', count: 83, updated: 'Updated May 18' },
];

const QUESTION_SETS = [
  { id: 1, name: 'College Admission Set 2025', items: 100, subjects: 'Math · English · Science · GK', status: 'Published', updated: 'May 27, 2025' },
  { id: 2, name: 'Scholarship Screening Set', items: 80, subjects: 'Math · English · Abstract', status: 'Published', updated: 'May 24, 2025' },
  { id: 3, name: 'Course Placement Set B', items: 60, subjects: 'Math · English', status: 'Draft', updated: 'May 22, 2025' },
  { id: 4, name: 'NSTP Qualifying Set', items: 50, subjects: 'GK · Filipino', status: 'Draft', updated: 'May 19, 2025' },
];

const RECENT_ACTIVITY = [
  { id: 1, label: 'General Knowledge Set 2025 updated', time: '08:48 AM' },
  { id: 2, label: '12 new questions added to Mathematics', time: 'Yesterday' },
  { id: 3, label: 'English Comprehension set exported', time: 'May 27' },
  { id: 4, label: 'Duplicate items flagged in Science', time: 'May 25' },
];

export default function QuestionBankPage() {
  const [search, setSearch] = useState('');
  const table = useTableState(QUESTION_SETS, {
    searchKeys: ['name', 'subjects', 'status'],
    pageSize: 4,
  });

  const totalQuestions = CATEGORIES.reduce((sum, c) => sum + c.count, 0);

  const columns = [
    { key: 'name', label: 'Question Set', sortable: true },
    { key: 'items', label: 'Items', sortable: true },
    { key: 'subjects', label: 'Coverage' },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge variant={statusVariant(row.status)}>{row.status}</StatusBadge>,
    },
    { key: 'updated', label: 'Last Updated', sortable: true },
    {
      key: 'actions',
      label: '',
      render: () => (
        <ManagementButton variant="tertiary" size="sm" aria-label="Edit question set">
          <Pencil size={14} aria-hidden="true" /> Edit
        </ManagementButton>
      ),
    },
  ];

  return (
    <div className="mp-page">
      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">Management</p>
          <h1 className="mp-header__title">Question Bank</h1>
          <p className="mp-header__lede">
            {totalQuestions.toLocaleString()} questions across {CATEGORIES.length} subjects, organized into reusable
            examination sets.
          </p>
        </div>
        <div className="mp-header__actions">
          <ManagementButton variant="secondary">
            <Upload size={16} aria-hidden="true" /> Import
          </ManagementButton>
          <ManagementButton variant="secondary">
            <Download size={16} aria-hidden="true" /> Export
          </ManagementButton>
          <ManagementButton variant="primary">
            <Plus size={16} aria-hidden="true" /> Add Questions
          </ManagementButton>
        </div>
      </header>

      <section aria-label="Subjects">
        <div className="mp-cat-grid">
          {CATEGORIES.map((cat) => (
            <article key={cat.subject} className="mp-cat-card">
              <h2 className="mp-cat-card__subject">{cat.subject}</h2>
              <div className="mp-cat-card__count">
                {cat.count}
                <small>questions</small>
              </div>
              <div className="mp-cat-card__meta">{cat.updated}</div>
            </article>
          ))}
        </div>
      </section>

      <div className="mp-split">
        <section className="mp-panel" aria-label="Question sets">
          <h2 className="mp-panel__title">Question Sets</h2>
          <div className="mp-panel__body">
            <ManagementToolbar
              searchId="question-set-search"
              searchValue={table.search}
              onSearchChange={table.setSearch}
              searchPlaceholder="Search question sets"
              actions={
                <ManagementButton variant="secondary">
                  <FileStack size={16} aria-hidden="true" /> Generate Set
                </ManagementButton>
              }
            />
            <DataTable
              columns={columns}
              rows={table.rows}
              rowKey="id"
              sortKey={table.sortKey}
              sortDir={table.sortDir}
              onSort={table.onSort}
              emptyTitle="No question sets found"
              emptyIcon={BookOpen}
            />
            <Pagination page={table.page} pageSize={table.pageSize} total={table.total} onPageChange={table.setPage} />
          </div>
        </section>

        <aside className="mp-panel" aria-label="Recent activity">
          <h2 className="mp-panel__title">Recent Activity</h2>
          <ul className="mgmt-activity-list">
            {RECENT_ACTIVITY.map((item) => (
              <li key={item.id} className="mgmt-activity-list__item">
                <span className="mgmt-activity-list__label">{item.label}</span>
                <time className="mgmt-activity-list__time">{item.time}</time>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
