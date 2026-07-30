import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarPlus,
  ChevronDown,
  Download,
  Eye,
  FileCheck,
  Loader2,
  MoreHorizontal,
  Pencil,
  Upload,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { applicantApi } from '../../api/applicantApi';
import { ManagementToolbar, ManagementButton } from '../../components/management/ManagementToolbar';
import { DataTable } from '../../components/management/DataTable';
import { StatusBadge } from '../../components/management/StatusBadge';
import { FilterDropdown } from '../../components/management/FilterDropdown';
import { statusVariant } from './useTableState';
import '../../components/management/management.css';
import './management-pages.css';
import './students-page.css';

const PROGRAMS = ['BSIT', 'BSED', 'BEED', 'BSBA', 'BSHM', 'Criminology', 'BSCrim', 'BSN'];
const STATUSES = ['Pending', 'Scheduled', 'Completed', 'Passed', 'Failed'];

const IMPORT_TEMPLATE = `Applicant Name,Program Desire,Application Date,Time
Juan Dela Cruz,BSIT,2026-07-20,08:00-09:00
Maria Santos,BSED,2026-07-20,09:30-10:30
`;

function RowActionsMenu({ row }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const items = [
    {
      key: 'view',
      label: 'View',
      icon: Eye,
      onClick: () => navigate(`/management/students?view=${row.id}`),
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: Pencil,
      onClick: () => navigate(`/management/students?edit=${row.id}`),
    },
    {
      key: 'schedule',
      label: 'Schedule',
      icon: CalendarPlus,
      disabled: !row.schedule_id,
      onClick: () => row.schedule_id && navigate(`/management/schedules/${row.schedule_id}`),
    },
    {
      key: 'result',
      label: 'View Result',
      icon: FileCheck,
      onClick: () => navigate('/results/exam-results'),
    },
  ];

  return (
    <div className={`students-action-menu${open ? ' is-open' : ''}`} ref={ref}>
      <button
        type="button"
        className="students-action-menu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${row.name}`}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreHorizontal size={15} aria-hidden="true" />
        <span>Actions</span>
        <ChevronDown size={13} aria-hidden="true" />
      </button>
      {open && (
        <div className="students-action-menu__panel" role="menu">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                className="students-action-menu__item"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
              >
                <Icon size={14} aria-hidden="true" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function StudentsPage() {
  const fileRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [notice, setNotice] = useState('');
  const [duplicateNotice, setDuplicateNotice] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [program, setProgram] = useState('all');
  const [status, setStatus] = useState('all');
  const [examDate, setExamDate] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await applicantApi.list({
        search: search.trim() || undefined,
        program: program !== 'all' ? program : undefined,
        status: status !== 'all' ? status.toLowerCase() : undefined,
        exam_date: examDate || undefined,
        page: 1,
        per_page: 5000,
        sort: sortKey,
        dir: sortDir,
      });
      setRows(data.data || []);
      setTotal(data.meta?.total ?? (data.data || []).length);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load applicants.');
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [search, program, status, examDate, sortKey, sortDir]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const onSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([IMPORT_TEMPLATE], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImporting(true);
    setNotice('');
    setDuplicateNotice('');
    setError('');
    try {
      const { data } = await applicantApi.importFile(file);
      const result = data.data || {};
      setNotice(data.message || 'Import completed.');

      if (result.duplicates > 0) {
        const names = (result.duplicate_applicants || [])
          .slice(0, 12)
          .map((d) => d.name)
          .filter(Boolean);
        const more = result.duplicates > names.length
          ? ` (+${result.duplicates - names.length} more)`
          : '';
        setDuplicateNotice(
          `${result.duplicates} applicant(s) already imported and were skipped: ${names.join(', ')}${more}`,
        );
      }

      if (result.errors?.length) {
        setError(result.errors.slice(0, 5).join(' '));
      }
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'applicant_code',
        label: 'ID',
        sortable: true,
        render: (row) => <span className="students-id">{row.applicant_code}</span>,
      },
      {
        key: 'name',
        label: 'Name',
        sortable: true,
      },
      {
        key: 'desired_program',
        label: 'Program Desire',
        sortable: true,
        render: (row) => row.desired_program || '—',
      },
      {
        key: 'date_label',
        label: 'Application Date',
        render: (row) =>
          row.examination_date_label || row.application_date_label || row.date_label || '—',
      },
      {
        key: 'examination_time',
        label: 'Time',
        render: (row) => row.examination_time || row.preferred_exam_time || '—',
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => (
          <StatusBadge variant={statusVariant(row.status)}>{row.status}</StatusBadge>
        ),
      },
      {
        key: 'score',
        label: 'Score',
        render: (row) => (row.score != null ? `${row.score}%` : '—'),
      },
      {
        key: 'actions',
        label: 'Action',
        render: (row) => <RowActionsMenu row={row} />,
      },
    ],
    []
  );

  return (
    <div className="mp-page students-page students-page--compact">
      <header className="students-header-bar">
        <div>
          <h1 className="students-header-bar__title">Student List</h1>
          <p className="students-header-bar__meta">{total} applicants</p>
        </div>
        <div className="students-header-bar__actions">
          <ManagementButton type="button" variant="secondary" size="sm" onClick={downloadTemplate}>
            <Download size={14} aria-hidden="true" /> Template
          </ManagementButton>
          <ManagementButton
            type="button"
            variant="primary"
            size="sm"
            disabled={importing}
            onClick={() => fileRef.current?.click()}
          >
            {importing ? <Loader2 size={14} className="spin" /> : <Upload size={14} aria-hidden="true" />}
            {importing ? 'Importing…' : 'Import Students'}
          </ManagementButton>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={onImportFile}
          />
        </div>
      </header>

      <section className="students-panel" aria-label="Applicant records">
        <ManagementToolbar
          searchId="student-search"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search name, ID…"
          filters={[
            <FilterDropdown
              key="program"
              id="student-program"
              value={program}
              onChange={setProgram}
              options={[
                { value: 'all', label: 'All programs' },
                ...PROGRAMS.map((p) => ({ value: p, label: p })),
              ]}
            />,
            <FilterDropdown
              key="status"
              id="student-status"
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all', label: 'All statuses' },
                ...STATUSES.map((s) => ({ value: s, label: s })),
              ]}
            />,
            <label key="date" className="students-date-filter">
              <span className="sr-only">Exam date</span>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
            </label>,
          ]}
        />

        {notice && (
          <div className="students-notice" role="status">
            {notice}
          </div>
        )}
        {duplicateNotice && (
          <div className="students-notice students-notice--warn" role="status">
            {duplicateNotice}
          </div>
        )}
        {error && (
          <div className="students-error" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="students-loading">
            <Loader2 className="spin" size={18} /> Loading…
          </div>
        ) : (
          <div className="students-table-wrap">
            <DataTable
              columns={columns}
              rows={rows}
              rowKey="id"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={onSort}
              emptyTitle="No applicants found"
              emptyDescription="Import a CSV/Excel file or adjust filters."
              emptyIcon={Users}
            />
          </div>
        )}
      </section>
    </div>
  );
}
