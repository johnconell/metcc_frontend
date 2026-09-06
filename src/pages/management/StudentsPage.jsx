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
  X,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { applicantApi } from '../../api/applicantApi';
import { notifySchedulesChanged } from '../../api/scheduleApi';
import { ManagementToolbar, ManagementButton } from '../../components/management/ManagementToolbar';
import { DataTable } from '../../components/management/DataTable';
import { StatusBadge } from '../../components/management/StatusBadge';
import { FilterDropdown } from '../../components/management/FilterDropdown';
import { FileTypeIcon } from '../../components/ui/FileTypeIcon';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { alertFromApiError, confirmAction, showLoading, closeLoading, toastSuccess, toastWarning } from '../../utils/swal';
import { statusVariant } from './useTableState';
import '../../components/management/management.css';
import './management-pages.css';
import './students-page.css';

const PROGRAMS = ['BSIT', 'BSED', 'BEED', 'BSBA', 'BSHM', 'Criminology', 'BSCrim', 'BSN'];
const STATUSES = ['Pending', 'Scheduled', 'Completed', 'Passed', 'Failed'];

const IMPORT_TEMPLATE = `Applicant Name,Program Desire,Application Date,Time,Gmail
Juan Dela Cruz,BSIT,2026-07-20,08:00-09:00,family@gmail.com
Maria Santos,BSED,2026-07-20,09:30-10:30,maria@gmail.com
`;

const IMPORT_STEPS = [
  'Uploading spreadsheet…',
  'Parsing rows…',
  'Creating students & schedules…',
  'Refreshing student list…',
];

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentForm, setStudentForm] = useState({
    name: '',
    gmail: '',
    desired_program: '',
    status: '',
  });
  const [studentSaving, setStudentSaving] = useState(false);
  const [studentError, setStudentError] = useState('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importStep, setImportStep] = useState(0);
  const [importElapsed, setImportElapsed] = useState(0);
  const [notice, setNotice] = useState('');
  const [duplicateNotice, setDuplicateNotice] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState(() => searchParams.get('q') || '');
  const navigate = useNavigate();
  const [program, setProgram] = useState('all');
  const [status, setStatus] = useState('all');
  const [examDate, setExamDate] = useState('');
  const [sortKey, setSortKey] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q != null) setSearch(q);
  }, [searchParams]);

  const closeStudentModal = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('view');
    next.delete('edit');
    setSearchParams(next);
    setSelectedStudent(null);
    setStudentError('');
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const viewId = searchParams.get('view') || searchParams.get('edit');
    if (!viewId) {
      setSelectedStudent(null);
      return;
    }

    const existing = rows.find((row) => String(row.id) === String(viewId));
    if (existing) {
      setSelectedStudent(existing);
      setStudentForm({
        name: existing.name || '',
        gmail: existing.gmail || '',
        desired_program: existing.desired_program || '',
        status: existing.status || '',
      });
      setStudentError('');
      return;
    }

    let cancelled = false;
    applicantApi.get(viewId)
      .then(({ data }) => {
        if (cancelled) return;
        const student = data.data || data;
        setSelectedStudent(student);
        setStudentForm({
          name: student.name || '',
          gmail: student.gmail || '',
          desired_program: student.desired_program || '',
          status: student.status || '',
        });
        setStudentError('');
      })
      .catch(() => {
        if (!cancelled) setStudentError('Unable to load student details.');
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams, rows]);

  const saveStudent = async (event) => {
    event.preventDefault();
    if (!selectedStudent) return;

    setStudentSaving(true);
    setStudentError('');
    try {
      const payload = {
        name: studentForm.name.trim(),
        gmail: studentForm.gmail.trim(),
        desired_program: studentForm.desired_program,
        status: studentForm.status,
      };
      const { data } = await applicantApi.update(selectedStudent.id, payload);
      const updated = data.data || data;
      setSelectedStudent(updated);
      setRows((prev) => prev.map((row) => (String(row.id) === String(updated.id) ? { ...row, ...updated } : row)));
      setTotal((prev) => (prev > 0 ? prev : 0));
      setStudentError('');
      closeStudentModal();
      await load();
    } catch (err) {
      setStudentError(err.response?.data?.message || 'Unable to update student.');
    } finally {
      setStudentSaving(false);
    }
  };

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

  useEffect(() => {
    if (!importing) return undefined;
    setImportElapsed(0);
    const tick = setInterval(() => setImportElapsed((s) => s + 1), 1000);
    const stepTimer = setInterval(() => {
      setImportStep((s) => (s < IMPORT_STEPS.length - 2 ? s + 1 : s));
    }, 1200);
    return () => {
      clearInterval(tick);
      clearInterval(stepTimer);
    };
  }, [importing]);

  const onImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const ok = await confirmAction({
      title: 'Are you sure?',
      text: `Import students from "${file.name}"? This action cannot be undone.`,
    });
    if (!ok) return;

    setImporting(true);
    setImportStep(0);
    setNotice('');
    setDuplicateNotice('');
    setError('');
    showLoading('Importing Students...');
    try {
      setImportStep(1);
      const { data } = await applicantApi.importFile(file);
      setImportStep(2);
      const result = data.data || {};
      const dates = (result.dates_touched || []).join(', ');
      setNotice(
        `${data.message || 'Import completed.'}`
          + (dates ? ` Schedules updated for: ${dates}.` : '')
          + ' Open Examination / Schedules to review. Proctors should re-download the offline pack.',
      );

      if (result.duplicates > 0) {
        const names = (result.duplicate_applicants || [])
          .slice(0, 12)
          .map((d) => d.name)
          .filter(Boolean);
        const more = result.duplicates > names.length
          ? ` (+${result.duplicates - names.length} more)`
          : '';
        setDuplicateNotice(
          `${result.duplicates} duplicate name(s) inside the file were ignored: ${names.join(', ')}${more}`,
        );
        await toastWarning(
          'Duplicate Record Detected',
          `${result.duplicates} duplicate name(s) inside the file were ignored.`,
        );
      }

      if (result.errors?.length) {
        setError(result.errors.slice(0, 5).join(' '));
      }
      setImportStep(3);
      notifySchedulesChanged({
        dates: result.dates_touched || [],
        schedules: result.schedules_touched || [],
      });
      closeLoading();
      await toastSuccess(data.message || 'Student Imported Successfully');
      await load();
    } catch (err) {
      closeLoading();
      const message = err.response?.data?.message || 'Import failed.';
      setError(message);
      await alertFromApiError(err, 'Import Failed');
    } finally {
      setImporting(false);
      setImportStep(0);
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
        key: 'gmail',
        label: 'Gmail',
        render: (row) => row.gmail || '—',
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
        render: (row) => row.display_score || (row.score != null ? `${row.score}/100` : '—'),
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
            {importing ? (
              <Loader2 size={14} className="spin" />
            ) : (
              <FileTypeIcon type="excel" size={16} />
            )}
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

      {importing && (
        <div className="mp-alert mp-alert--success" role="status" aria-live="polite">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Loader2 size={18} className="spin" />
            <strong>{IMPORT_STEPS[importStep] || 'Importing…'}</strong>
            <span className="mp-table__sub">({importElapsed}s)</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {IMPORT_STEPS.map((label, index) => (
              <span
                key={label}
                className="mp-table__sub"
                style={{
                  fontWeight: index === importStep ? 700 : 500,
                  opacity: index <= importStep ? 1 : 0.45,
                }}
              >
                {index + 1}. {label.replace('…', '')}
              </span>
            ))}
          </div>
        </div>
      )}

      {notice && (
        <div className="mp-alert mp-alert--success" role="status">
          {notice}{' '}
          <button
            type="button"
            className="mp-link-back"
            style={{ display: 'inline', margin: 0 }}
            onClick={() => navigate('/management/schedules')}
          >
            Open Examination / Schedules
          </button>
        </div>
      )}

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

        {selectedStudent && (
          <div className="mp-modal-overlay" role="presentation" onClick={closeStudentModal}>
            <div className="mp-modal mp-users-modal" role="dialog" aria-modal="true" aria-labelledby="student-modal-title" onClick={(e) => e.stopPropagation()}>
              <div className="mp-modal__header">
                <div>
                  <h2 id="student-modal-title" className="mp-modal__title">
                    {searchParams.get('view') ? 'Student details' : 'Edit student'}
                  </h2>
                  <p className="mp-modal__subtitle">{selectedStudent.name || 'Applicant'}</p>
                </div>
                <button type="button" className="mp-modal__close" onClick={closeStudentModal} aria-label="Close student details">
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              {studentError && <div className="mp-alert mp-alert--error" role="alert">{studentError}</div>}

              {searchParams.get('view') ? (
                <div className="mp-form mp-student-details">
                  <div className="mp-student-details__intro">
                    <span className="mp-student-details__eyebrow">Applicant record</span>
                    <strong>{selectedStudent.applicant_code || selectedStudent.id}</strong>
                  </div>
                  <dl className="mp-dl mp-student-details__list">
                    <div>
                      <dt>Applicant ID</dt>
                      <dd>{selectedStudent.applicant_code || selectedStudent.id}</dd>
                    </div>
                    <div>
                      <dt>Program</dt>
                      <dd>{selectedStudent.desired_program || '—'}</dd>
                    </div>
                    <div>
                      <dt>Gmail</dt>
                      <dd>{selectedStudent.gmail || '—'}</dd>
                    </div>
                    <div>
                      <dt>Status</dt>
                      <dd>
                        <StatusBadge variant={statusVariant(selectedStudent.status)}>
                          {selectedStudent.status || 'Unknown'}
                        </StatusBadge>
                      </dd>
                    </div>
                    <div>
                      <dt>Exam date</dt>
                      <dd>{selectedStudent.examination_date_label || selectedStudent.application_date_label || '—'}</dd>
                    </div>
                    <div>
                      <dt>Time</dt>
                      <dd>{selectedStudent.examination_time || selectedStudent.preferred_exam_time || '—'}</dd>
                    </div>
                  </dl>
                  <div className="mp-modal__actions">
                    <ManagementButton type="button" variant="secondary" onClick={closeStudentModal}>Close</ManagementButton>
                    <ManagementButton
                      type="button"
                      variant="primary"
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.delete('view');
                        next.set('edit', String(selectedStudent.id));
                        setSearchParams(next);
                      }}
                    >
                      Edit
                    </ManagementButton>
                  </div>
                </div>
              ) : (
                <form className="mp-form" onSubmit={saveStudent}>
                  <label className="mp-field">
                    <span className="mp-field__label">Name</span>
                    <input
                      className="mp-field__input"
                      value={studentForm.name}
                      onChange={(e) => setStudentForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </label>
                  <label className="mp-field">
                    <span className="mp-field__label">Gmail</span>
                    <input
                      className="mp-field__input"
                      value={studentForm.gmail}
                      onChange={(e) => setStudentForm((prev) => ({ ...prev, gmail: e.target.value }))}
                    />
                  </label>
                  <label className="mp-field">
                    <span className="mp-field__label">Program desire</span>
                    <select
                      className="mp-field__input"
                      value={studentForm.desired_program}
                      onChange={(e) => setStudentForm((prev) => ({ ...prev, desired_program: e.target.value }))}
                    >
                      <option value="">Select program</option>
                      {PROGRAMS.map((programName) => (
                        <option key={programName} value={programName}>{programName}</option>
                      ))}
                    </select>
                  </label>
                  <label className="mp-field">
                    <span className="mp-field__label">Status</span>
                    <select
                      className="mp-field__input"
                      value={studentForm.status}
                      onChange={(e) => setStudentForm((prev) => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="">Select status</option>
                      {STATUSES.map((statusName) => (
                        <option key={statusName} value={statusName}>{statusName}</option>
                      ))}
                    </select>
                  </label>
                  <div className="mp-modal__actions">
                    <ManagementButton type="button" variant="secondary" onClick={closeStudentModal} disabled={studentSaving}>Cancel</ManagementButton>
                    <ManagementButton type="submit" variant="primary" disabled={studentSaving}>
                      {studentSaving ? 'Saving...' : 'Save changes'}
                    </ManagementButton>
                  </div>
                </form>
              )}
            </div>
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
          <SkeletonTable rows={8} cols={6} />
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
