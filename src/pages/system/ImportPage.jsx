import { useState } from 'react';
import { BookOpen, Calendar, ClipboardCheck, Eye, FileSpreadsheet, Layers3, Upload, UserPlus, Users } from 'lucide-react';
import { ManagementButton } from '../../components/management/ManagementToolbar';
import { DataTable } from '../../components/management/DataTable';
import { confirmAction, showLoading, closeLoading, toastSuccess } from '../../utils/swal';
import '../../components/management/management.css';
import '../management/management-pages.css';
import './system-pages.css';

const IMPORT_TYPES = [
  { key: 'students', label: 'Import Students', icon: Users, description: 'Upload a CSV or Excel file with student records.' },
  { key: 'questions', label: 'Import Questions', icon: BookOpen, description: 'Bulk import questions into the question bank.' },
  { key: 'schedules', label: 'Import Schedules', icon: Calendar, description: 'Import examination schedules and batch assignments.' },
];

const PREVIEW_STUDENTS = [
  { id: 1, fullName: 'Juan Dela Cruz', studentId: '2025-101', course: 'BSIT', batch: 'Batch A' },
  { id: 2, fullName: 'Maria Clara Reyes', studentId: '2025-102', course: 'BSED', batch: 'Batch B' },
  { id: 3, fullName: 'Jose Rizal Santos', studentId: '2025-103', course: 'BSBA', batch: 'Batch C' },
  { id: 4, fullName: 'Ana Patricia Lim', studentId: '2025-104', course: 'BSCrim', batch: 'Batch D' },
  { id: 5, fullName: 'Mark Anthony Go', studentId: '2025-105', course: 'BSN', batch: 'Batch E' },
];

const PREVIEW_QUESTIONS = [
  { id: 1, subject: 'Mathematics', question: 'What is 15% of 200?', type: 'Multiple Choice' },
  { id: 2, subject: 'English', question: 'Choose the correct synonym for "abundant".', type: 'Multiple Choice' },
  { id: 3, subject: 'Science', question: 'What is the chemical symbol for water?', type: 'Multiple Choice' },
];

const PREVIEW_SCHEDULES = [
  { id: 1, date: 'Jun 5, 2025', time: '08:00 AM', venue: 'Room 101', batch: 'Batch A', course: 'BSIT' },
  { id: 2, date: 'Jun 6, 2025', time: '09:30 AM', venue: 'Room 102', batch: 'Batch B', course: 'BSED' },
  { id: 3, date: 'Jun 7, 2025', time: '01:00 PM', venue: 'Room 103', batch: 'Batch C', course: 'BSBA' },
];

const PREVIEW_DATA = {
  students: {
    columns: [
      { key: 'fullName', label: 'Full Name' },
      { key: 'studentId', label: 'Student ID' },
      { key: 'course', label: 'Course' },
      { key: 'batch', label: 'Batch' },
    ],
    rows: PREVIEW_STUDENTS,
    emptyIcon: Users,
  },
  questions: {
    columns: [
      { key: 'subject', label: 'Subject' },
      { key: 'question', label: 'Question' },
      { key: 'type', label: 'Type' },
    ],
    rows: PREVIEW_QUESTIONS,
    emptyIcon: BookOpen,
  },
  schedules: {
    columns: [
      { key: 'date', label: 'Date' },
      { key: 'time', label: 'Time' },
      { key: 'venue', label: 'Venue' },
      { key: 'batch', label: 'Batch' },
      { key: 'course', label: 'Course' },
    ],
    rows: PREVIEW_SCHEDULES,
    emptyIcon: Calendar,
  },
};

export default function ImportPage() {
  const [activeType, setActiveType] = useState('students');
  const [fileName, setFileName] = useState('');
  const [hasPreview, setHasPreview] = useState(false);

  const activeImport = IMPORT_TYPES.find((t) => t.key === activeType);
  const preview = PREVIEW_DATA[activeType];

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setHasPreview(true);
    }
  };

  const handleImport = async () => {
    if (!hasPreview) return;
    const ok = await confirmAction({
      title: 'Are you sure?',
      text: `Import ${activeImport?.label?.toLowerCase() || 'records'} from "${fileName}"? This action cannot be undone.`,
    });
    if (!ok) return;
    showLoading(`Importing ${activeImport?.label || 'Records'}...`);
    await new Promise((resolve) => setTimeout(resolve, 800));
    closeLoading();
    await toastSuccess(
      activeType === 'students'
        ? 'Student Imported Successfully'
        : activeType === 'questions'
          ? 'Questions Imported Successfully'
          : 'Schedule Imported Successfully'
    );
  };

  return (
    <div className="mp-page sp-page">
      <header className="sp-page-header">
        <div className="sp-page-header__copy">
          <h1>Import</h1>
          <p>Import students, questions, or schedules with a live preview before committing changes.</p>
        </div>
        <div className="sp-page-header__actions">
          <ManagementButton variant="primary" disabled={!hasPreview} onClick={handleImport}>
            <UserPlus size={16} aria-hidden="true" /> Import
          </ManagementButton>
        </div>
      </header>

      <section className="mp-panel" aria-label="Import type selection">
        <div className="sp-card-title">
          <span className="sp-card-title__icon" aria-hidden="true"><Layers3 size={17} /></span>
          <h2 className="sp-card-title__text">Select Import Type</h2>
        </div>
        <div className="sp-import-grid">
          {IMPORT_TYPES.map(({ key, label, icon: Icon, description }) => (
            <button
              key={key}
              type="button"
              className={`sp-import-card${activeType === key ? ' is-active' : ''}`}
              onClick={() => {
                setActiveType(key);
                setFileName('');
                setHasPreview(false);
              }}
            >
              <span className="sp-import-card__icon" aria-hidden="true"><Icon size={18} /></span>
              <span className="sp-import-card__title">{label}</span>
              <p className="sp-import-card__desc">{description}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="mp-split">
        <section className="mp-panel" aria-label="File upload">
          <div className="sp-card-title">
            <span className="sp-card-title__icon" aria-hidden="true"><FileSpreadsheet size={17} /></span>
            <h2 className="sp-card-title__text">File Upload</h2>
          </div>
          <p className="sp-upload__hint">
            {activeImport?.label} — accepted formats: .csv, .xlsx, .xls
          </p>
          <label className={`sp-upload__zone${hasPreview ? ' sp-upload__zone--filled' : ''}`} htmlFor="import-file">
            <span className="sp-upload__zone-icon" aria-hidden="true">
              <Upload size={22} />
            </span>
            <span className="sp-upload__label">
              {fileName || 'Drag and drop a file here, or click to browse'}
            </span>
            <span className="sp-upload__meta">
              {hasPreview ? 'File ready for preview' : 'Maximum file size: 10 MB'}
            </span>
            <input
              id="import-file"
              type="file"
              accept=".csv,.xlsx,.xls"
              className="sp-upload__input"
              onChange={handleFileChange}
            />
          </label>
        </section>

        <section className="mp-panel" aria-label="Import summary">
          <div className="sp-card-title">
            <span className="sp-card-title__icon sp-card-title__icon--gold" aria-hidden="true"><ClipboardCheck size={17} /></span>
            <h2 className="sp-card-title__text">Import Summary</h2>
          </div>
          <div className="mp-kv">
            <div className="mp-kv__row">
              <span className="mp-kv__key">Import type</span>
              <span className="mp-kv__val">{activeImport?.label}</span>
            </div>
            <div className="mp-kv__row">
              <span className="mp-kv__key">File</span>
              <span className="mp-kv__val">{fileName || 'No file selected'}</span>
            </div>
            <div className="mp-kv__row">
              <span className="mp-kv__key">Records to import</span>
              <span className="mp-kv__val">{hasPreview ? preview.rows.length : '—'}</span>
            </div>
            <div className="mp-kv__row">
              <span className="mp-kv__key">Status</span>
              <span className="mp-kv__val">{hasPreview ? 'Ready to import' : 'Awaiting file'}</span>
            </div>
          </div>
          <div className="sp-form__actions">
            <ManagementButton variant="secondary" disabled={!hasPreview}>
              <Eye size={16} aria-hidden="true" /> Preview Data
            </ManagementButton>
            <ManagementButton variant="primary" disabled={!hasPreview} onClick={handleImport}>
              <Upload size={16} aria-hidden="true" /> Import
            </ManagementButton>
          </div>
        </section>
      </div>

      {hasPreview && (
        <section className="mp-panel" aria-label="Preview data">
          <div className="sp-card-title">
            <span className="sp-card-title__icon" aria-hidden="true"><Eye size={17} /></span>
            <h2 className="sp-card-title__text">Preview Data</h2>
            <span className="sp-card-title__meta">{preview.rows.length} records</span>
          </div>
          <p className="sp-upload__hint">
            Showing {preview.rows.length} records from {fileName}
          </p>
          <div className="mp-list-table-wrap">
            <DataTable
              columns={preview.columns}
              rows={preview.rows}
              rowKey="id"
              emptyTitle="No data to preview"
              emptyDescription="Upload a file to see a preview of the records."
              emptyIcon={preview.emptyIcon}
            />
          </div>
          <div className="sp-form__actions" style={{ marginTop: 'var(--space-base)' }}>
            <ManagementButton variant="primary" onClick={handleImport}>
              <Upload size={16} aria-hidden="true" /> Import {preview.rows.length} Records
            </ManagementButton>
          </div>
        </section>
      )}
    </div>
  );
}
