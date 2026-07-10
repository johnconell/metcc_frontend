import { useState } from 'react';
import { CalendarPlus, Download, Eye, Pencil, Upload, UserPlus, UserX, Users } from 'lucide-react';
import { ManagementToolbar, ManagementButton } from '../../components/management/ManagementToolbar';
import { DataTable } from '../../components/management/DataTable';
import { StatusBadge } from '../../components/management/StatusBadge';
import { FilterDropdown } from '../../components/management/FilterDropdown';
import { Pagination } from '../../components/management/Pagination';
import { useTableState, statusVariant } from './useTableState';
import '../../components/management/management.css';
import './management-pages.css';

const STUDENTS = [
  { id: 1, fullName: 'Juan Dela Cruz', studentId: '2025-001', course: 'BSIT', batch: 'Batch A', schedule: 'May 28, 2025', status: 'Active' },
  { id: 2, fullName: 'Maria Clara Reyes', studentId: '2025-002', course: 'BSED', batch: 'Batch B', schedule: 'May 29, 2025', status: 'Pending' },
  { id: 3, fullName: 'Jose Rizal Santos', studentId: '2025-003', course: 'BSBA', batch: 'Batch C', schedule: 'May 30, 2025', status: 'Active' },
  { id: 4, fullName: 'Ana Patricia Lim', studentId: '2025-004', course: 'BSCrim', batch: 'Batch D', schedule: 'May 31, 2025', status: 'Inactive' },
  { id: 5, fullName: 'Mark Anthony Go', studentId: '2025-005', course: 'BSN', batch: 'Batch E', schedule: 'Jun 1, 2025', status: 'Active' },
  { id: 6, fullName: 'Sofia Mendoza', studentId: '2025-006', course: 'BSHM', batch: 'Batch F', schedule: 'Jun 2, 2025', status: 'Active' },
  { id: 7, fullName: 'Rafael Bautista', studentId: '2025-007', course: 'BSIT', batch: 'Batch A', schedule: 'May 28, 2025', status: 'Pending' },
  { id: 8, fullName: 'Camille Torres', studentId: '2025-008', course: 'BSED', batch: 'Batch B', schedule: 'May 29, 2025', status: 'Active' },
];

const COURSES = ['BSIT', 'BSED', 'BSBA', 'BSCrim', 'BSN', 'BSHM'];

export default function StudentsPage() {
  const [courseFilter, setCourseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const table = useTableState(STUDENTS, {
    searchKeys: ['fullName', 'studentId', 'course', 'batch', 'schedule', 'status'],
    pageSize: 6,
    filterFn: (row) => {
      if (courseFilter !== 'all' && row.course !== courseFilter) return false;
      if (statusFilter !== 'all' && row.status.toLowerCase() !== statusFilter) return false;
      return true;
    },
  });

  const activeCount = STUDENTS.filter((s) => s.status === 'Active').length;
  const pendingCount = STUDENTS.filter((s) => s.status === 'Pending').length;

  const columns = [
    { key: 'fullName', label: 'Full Name', sortable: true },
    { key: 'studentId', label: 'Student ID', sortable: true },
    { key: 'course', label: 'Course', sortable: true },
    { key: 'batch', label: 'Batch', sortable: true },
    { key: 'schedule', label: 'Exam Schedule', sortable: true },
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
          <ManagementButton variant="tertiary" size="sm" aria-label="View student">
            <Eye size={14} aria-hidden="true" />
          </ManagementButton>
          <ManagementButton variant="tertiary" size="sm" aria-label="Edit student">
            <Pencil size={14} aria-hidden="true" />
          </ManagementButton>
          <ManagementButton variant="tertiary" size="sm" aria-label="Assign exam">
            <CalendarPlus size={14} aria-hidden="true" />
          </ManagementButton>
          <ManagementButton variant="tertiary" size="sm" aria-label="Deactivate student">
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
          <h1 className="mp-header__title">Student List</h1>
          <p className="mp-header__lede">
            {STUDENTS.length} registered applicants — {activeCount} active, {pendingCount} awaiting exam assignment.
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
            <UserPlus size={16} aria-hidden="true" /> Add Student
          </ManagementButton>
        </div>
      </header>

      <section className="mp-panel" aria-label="Student records">
        <ManagementToolbar
          searchId="student-search"
          searchValue={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Search by name, ID, or batch"
          filters={[
            <FilterDropdown
              key="course"
              id="student-course-filter"
              value={courseFilter}
              onChange={(value) => {
                setCourseFilter(value);
                table.setPage(1);
              }}
              options={[
                { value: 'all', label: 'All courses' },
                ...COURSES.map((c) => ({ value: c, label: c })),
              ]}
            />,
            <FilterDropdown
              key="status"
              id="student-status-filter"
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                table.setPage(1);
              }}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'active', label: 'Active' },
                { value: 'pending', label: 'Pending' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />,
          ]}
          selectedCount={table.selectedKeys.length}
          bulkActions={
            <>
              <ManagementButton variant="secondary" size="sm">
                <CalendarPlus size={14} aria-hidden="true" /> Assign Exam
              </ManagementButton>
              <ManagementButton variant="secondary" size="sm">
                <UserX size={14} aria-hidden="true" /> Deactivate
              </ManagementButton>
            </>
          }
        />
        <div style={{ height: 'var(--space-base)' }} aria-hidden="true" />
        <DataTable
          columns={columns}
          rows={table.rows}
          rowKey="id"
          sortKey={table.sortKey}
          sortDir={table.sortDir}
          onSort={table.onSort}
          selectable
          selectedKeys={table.selectedKeys}
          onSelectionChange={table.setSelectedKeys}
          emptyTitle="No students match"
          emptyDescription="Try a different name, course, or status."
          emptyIcon={Users}
        />
        <Pagination page={table.page} pageSize={table.pageSize} total={table.total} onPageChange={table.setPage} />
      </section>
    </div>
  );
}
