import { useState } from 'react';
import { Download, Eye, FileSpreadsheet, FileText, Printer, ScrollText } from 'lucide-react';
import { ManagementToolbar, ManagementButton } from '../../components/management/ManagementToolbar';
import { DataTable } from '../../components/management/DataTable';
import { StatusBadge } from '../../components/management/StatusBadge';
import { FilterDropdown } from '../../components/management/FilterDropdown';
import { Pagination } from '../../components/management/Pagination';
import { useTableState, statusVariant } from '../management/useTableState';
import '../../components/management/management.css';
import '../management/management-pages.css';

const EXAM_RESULTS = [
  { id: 1, studentName: 'Juan Dela Cruz', studentId: '2025-001', exam: 'College Admission Test', examDate: 'May 28, 2025', score: 87, maxScore: 100, status: 'Pass', course: 'BSIT' },
  { id: 2, studentName: 'Maria Clara Reyes', studentId: '2025-002', exam: 'Scholarship Examination', examDate: 'May 29, 2025', score: 72, maxScore: 100, status: 'Pass', course: 'BSED' },
  { id: 3, studentName: 'Jose Rizal Santos', studentId: '2025-003', exam: 'Course Placement Test', examDate: 'May 30, 2025', score: 54, maxScore: 100, status: 'Fail', course: 'BSBA' },
  { id: 4, studentName: 'Ana Patricia Lim', studentId: '2025-004', exam: 'College Admission Test', examDate: 'May 31, 2025', score: 91, maxScore: 100, status: 'Pass', course: 'BSCrim' },
  { id: 5, studentName: 'Mark Anthony Go', studentId: '2025-005', exam: 'NSTP Qualifying Exam', examDate: 'Jun 1, 2025', score: 68, maxScore: 100, status: 'Pass', course: 'BSN' },
  { id: 6, studentName: 'Sofia Mendoza', studentId: '2025-006', exam: 'College Admission Test', examDate: 'May 28, 2025', score: 45, maxScore: 100, status: 'Fail', course: 'BSHM' },
  { id: 7, studentName: 'Rafael Bautista', studentId: '2025-007', exam: 'Scholarship Examination', examDate: 'May 29, 2025', score: 78, maxScore: 100, status: 'Pass', course: 'BSIT' },
  { id: 8, studentName: 'Camille Torres', studentId: '2025-008', exam: 'Course Placement Test', examDate: 'May 30, 2025', score: 83, maxScore: 100, status: 'Pass', course: 'BSED' },
];

const EXAMS = [...new Set(EXAM_RESULTS.map((r) => r.exam))];
const DATES = [...new Set(EXAM_RESULTS.map((r) => r.examDate))];

function resultStatusVariant(status) {
  const value = String(status).toLowerCase();
  if (value === 'pass') return 'success';
  if (value === 'fail') return 'error';
  return statusVariant(status);
}

export default function ExamResultsPage() {
  const [examFilter, setExamFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const table = useTableState(EXAM_RESULTS, {
    searchKeys: ['studentName', 'studentId', 'exam', 'examDate', 'status', 'course'],
    pageSize: 6,
    filterFn: (row) => {
      if (examFilter !== 'all' && row.exam !== examFilter) return false;
      if (dateFilter !== 'all' && row.examDate !== dateFilter) return false;
      if (statusFilter !== 'all' && row.status.toLowerCase() !== statusFilter) return false;
      return true;
    },
  });

  const passCount = EXAM_RESULTS.filter((r) => r.status === 'Pass').length;
  const failCount = EXAM_RESULTS.filter((r) => r.status === 'Fail').length;
  const avgScore = Math.round(
    EXAM_RESULTS.reduce((sum, r) => sum + r.score, 0) / EXAM_RESULTS.length,
  );

  const columns = [
    { key: 'studentName', label: 'Student Information', sortable: true },
    { key: 'studentId', label: 'Student ID', sortable: true },
    { key: 'exam', label: 'Examination', sortable: true },
    { key: 'examDate', label: 'Date', sortable: true },
    {
      key: 'score',
      label: 'Examination Score',
      sortable: true,
      render: (row) => (
        <span>
          {row.score}/{row.maxScore}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Result Status',
      sortable: true,
      render: (row) => (
        <StatusBadge variant={resultStatusVariant(row.status)}>{row.status}</StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: () => (
        <div className="mgmt-table__actions">
          <ManagementButton variant="tertiary" size="sm" aria-label="View result details">
            <Eye size={14} aria-hidden="true" /> View Details
          </ManagementButton>
          <ManagementButton variant="tertiary" size="sm" aria-label="Print individual result">
            <Printer size={14} aria-hidden="true" /> Print
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
          <h1 className="mp-header__title">Exam Results</h1>
          <p className="mp-header__lede">
            {EXAM_RESULTS.length} recorded results — {passCount} passed, {failCount} failed, average score {avgScore}%.
          </p>
        </div>
        <div className="mp-header__actions">
          <ManagementButton variant="secondary">
            <FileText size={16} aria-hidden="true" /> Export PDF
          </ManagementButton>
          <ManagementButton variant="secondary">
            <FileSpreadsheet size={16} aria-hidden="true" /> Export Excel
          </ManagementButton>
          <ManagementButton variant="secondary">
            <Download size={16} aria-hidden="true" /> Export All
          </ManagementButton>
        </div>
      </header>

      <div className="mp-stats" aria-label="Result summary">
        <div className="mp-stats__item">
          <div className="mp-stats__value">{EXAM_RESULTS.length}</div>
          <div className="mp-stats__label">Total results</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{passCount}</div>
          <div className="mp-stats__label">Passed</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{failCount}</div>
          <div className="mp-stats__label">Failed</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{avgScore}%</div>
          <div className="mp-stats__label">Average score</div>
        </div>
      </div>

      <section className="mp-panel" aria-label="Result list">
        <h2 className="mp-panel__title">Result List</h2>
        <ManagementToolbar
          searchId="result-search"
          searchValue={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Search by name, ID, or exam"
          filters={[
            <FilterDropdown
              key="exam"
              id="result-exam-filter"
              value={examFilter}
              onChange={(value) => {
                setExamFilter(value);
                table.setPage(1);
              }}
              options={[
                { value: 'all', label: 'All exams' },
                ...EXAMS.map((exam) => ({ value: exam, label: exam })),
              ]}
            />,
            <FilterDropdown
              key="date"
              id="result-date-filter"
              value={dateFilter}
              onChange={(value) => {
                setDateFilter(value);
                table.setPage(1);
              }}
              options={[
                { value: 'all', label: 'All dates' },
                ...DATES.map((date) => ({ value: date, label: date })),
              ]}
            />,
            <FilterDropdown
              key="status"
              id="result-status-filter"
              value={statusFilter}
              onChange={(value) => {
                setStatusFilter(value);
                table.setPage(1);
              }}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'pass', label: 'Pass' },
                { value: 'fail', label: 'Fail' },
              ]}
            />,
          ]}
          selectedCount={table.selectedKeys.length}
          bulkActions={
            <>
              <ManagementButton variant="secondary" size="sm">
                <Printer size={14} aria-hidden="true" /> Print Selected
              </ManagementButton>
              <ManagementButton variant="secondary" size="sm">
                <Download size={14} aria-hidden="true" /> Export Selected
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
          emptyTitle="No results match"
          emptyDescription="Try a different name, exam, date, or result status."
          emptyIcon={ScrollText}
        />
        <Pagination page={table.page} pageSize={table.pageSize} total={table.total} onPageChange={table.setPage} />
      </section>
    </div>
  );
}
