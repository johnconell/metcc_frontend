import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, FileUp, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { questionBankApi } from '../../api/questionBankApi';
import { ManagementButton } from '../../components/management/ManagementToolbar';
import '../../components/management/management.css';
import './management-pages.css';

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function codeFromName(name) {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

const DEFAULT_CATEGORIES = [
  {
    name: 'Mathematics',
    code: 'MATH',
    description: 'Arithmetic, algebra, geometry, and quantitative reasoning.',
  },
  {
    name: 'English',
    code: 'ENGLISH',
    description: 'Vocabulary, grammar, reading comprehension, and language usage.',
  },
  {
    name: 'Science',
    code: 'SCIENCE',
    description: 'Basic concepts in biology, chemistry, physics, and earth science.',
  },
  {
    name: 'Computer',
    code: 'COMPUTER',
    description: 'Basic ICT, computer literacy, and digital concepts.',
  },
  {
    name: 'General Knowledge',
    code: 'GENERAL',
    description: 'Civics, Philippine history, current events, and general knowledge.',
  },
  {
    name: 'Logic',
    code: 'LOGIC',
    description: 'Logical reasoning, patterns, and analytical thinking.',
  },
  {
    name: 'Others',
    code: 'OTHERS',
    description: 'Other subject areas not covered above.',
  },
  {
    name: 'Verbal Ability',
    code: 'VERBAL',
    description: 'Vocabulary, grammar, reading comprehension, and language usage.',
  },
  {
    name: 'Numerical Ability',
    code: 'NUMERICAL',
    description: 'Arithmetic, algebra, word problems, and quantitative reasoning.',
  },
];

const FILE_TYPE_OPTIONS = [
  {
    value: 'excel',
    label: 'Excel',
    accept: '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv',
    hint: 'Columns: stem, option_a, option_b, option_c, option_d, correct_answer',
  },
  {
    value: 'word',
    label: 'Word',
    accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    hint: 'Numbered questions with A–D choices (.docx)',
  },
  {
    value: 'documents',
    label: 'Documents',
    accept: '.txt,.csv,.rtf,text/plain,text/csv,application/rtf',
    hint: 'Plain text, CSV, or RTF with numbered A–D items',
  },
  {
    value: 'pdf',
    label: 'PDF',
    accept: '.pdf,application/pdf',
    hint: 'Text-based PDF with numbered A–D items',
  },
];

const EMPTY_FORM = {
  categoryKey: '',
  customName: '',
  description: '',
  selection_limit: 5,
};

export default function QuestionBankSubjectPage() {
  const { bankId } = useParams();
  const fileInputRef = useRef(null);
  const [bank, setBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [showImport, setShowImport] = useState(false);
  const [importSubjectId, setImportSubjectId] = useState('');
  const [importFileType, setImportFileType] = useState('excel');
  const [importFile, setImportFile] = useState(null);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importSummary, setImportSummary] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await questionBankApi.getBank(bankId);
      setBank(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load question bank.');
      setBank(null);
    } finally {
      setLoading(false);
    }
  }, [bankId]);

  useEffect(() => {
    load();
  }, [load]);

  const categoryOptions = useMemo(() => {
    const existingNames = new Set(
      (bank?.subjects || []).map((s) => (s.name || '').toLowerCase())
    );
    const existingCodes = new Set(
      (bank?.subjects || []).map((s) => (s.code || '').toUpperCase()).filter(Boolean)
    );

    const preset = DEFAULT_CATEGORIES
      .filter((cat) => !existingNames.has(cat.name.toLowerCase()) && !existingCodes.has(cat.code))
      .map((cat) => ({
        key: `preset:${cat.code}`,
        name: cat.name,
        code: cat.code,
        description: cat.description,
      }));

    if (editing) {
      return [
        {
          key: `editing:${editing.id}`,
          name: editing.name,
          code: editing.code || codeFromName(editing.name),
          description: editing.description || '',
        },
        ...preset.filter((p) => p.name.toLowerCase() !== (editing.name || '').toLowerCase()),
      ];
    }

    return preset;
  }, [bank, editing]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      ...EMPTY_FORM,
      categoryKey: '',
    });
    setFormError('');
    setShowForm(true);
  };

  const openImport = () => {
    const firstSubject = bank?.subjects?.[0];
    setImportSubjectId(firstSubject ? String(firstSubject.id) : '');
    setImportFileType('excel');
    setImportFile(null);
    setReplaceExisting(true);
    setImportError('');
    setShowImport(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openEdit = (subject, event) => {
    event.preventDefault();
    event.stopPropagation();
    setEditing(subject);
    setForm({
      categoryKey: `editing:${subject.id}`,
      customName: '',
      description: subject.description || '',
      selection_limit: subject.selection_limit ?? 5,
    });
    setFormError('');
    setShowForm(true);
  };

  const handleDelete = async (subject, event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm(`Delete category "${subject.name}" and all of its questions?`)) {
      return;
    }
    try {
      await questionBankApi.deleteSubject(subject.id);
      setSuccess('Category deleted.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete category.');
    }
  };

  const resolveCategoryPayload = () => {
    const key = form.categoryKey || (categoryOptions[0]?.key || '__new__');
    if (key === '__new__') {
      const name = form.customName.trim();
      if (!name) {
        return { error: 'Enter a name for the new category.' };
      }
      return {
        name,
        code: codeFromName(name) || null,
        description: form.description.trim() || null,
      };
    }

    const selected = categoryOptions.find((opt) => opt.key === key);
    if (!selected) {
      return { error: 'Choose a category.' };
    }

    return {
      name: selected.name,
      code: selected.code || codeFromName(selected.name) || null,
      description: form.description.trim() || selected.description || null,
    };
  };

  const submit = async (event) => {
    event.preventDefault();
    const resolved = resolveCategoryPayload();
    if (resolved.error) {
      setFormError(resolved.error);
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name: resolved.name,
        code: resolved.code,
        description: resolved.description,
        selection_limit: Math.max(0, Number(form.selection_limit) || 0),
      };
      if (editing) {
        await questionBankApi.updateSubject(editing.id, payload);
        setSuccess('Category updated.');
      } else {
        await questionBankApi.createSubject(bankId, payload);
        setSuccess('Category added.');
      }
      setShowForm(false);
      await load();
    } catch (err) {
      const first = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : null;
      setFormError(first || err.response?.data?.message || 'Unable to save category.');
    } finally {
      setSaving(false);
    }
  };

  const submitImport = async (event) => {
    event.preventDefault();
    if (!importSubjectId) {
      setImportError('Choose a category to import into.');
      return;
    }
    if (!importFile) {
      setImportError('Choose a file to upload.');
      return;
    }

    setImporting(true);
    setImportError('');
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('file_type', importFileType);
      formData.append('exam_subject_id', importSubjectId);
      formData.append('replace_existing', replaceExisting ? '1' : '0');
      const { data } = await questionBankApi.importQuestions(bankId, formData);
      setBank(data.data);
      setImportSummary(data.data?.import_summary || []);
      setSuccess(data.message || 'Questions imported.');
      setShowImport(false);
      setImportFile(null);
    } catch (err) {
      const first = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : null;
      setImportError(first || err.response?.data?.message || 'Unable to import questions.');
    } finally {
      setImporting(false);
    }
  };

  if (loading && !bank) {
    return (
      <div className="mp-page">
        <div className="mp-loading">
          <Loader2 size={18} className="mp-loading__icon" />
          Loading question bank...
        </div>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="mp-page">
        <div className="mp-alert mp-alert--error" role="alert">{error || 'Question bank not found.'}</div>
        <Link to="/management/question-bank" className="mp-link-back">
          <ArrowLeft size={16} /> Back to Question Bank
        </Link>
      </div>
    );
  }

  const subjects = bank.subjects || [];
  const selectedFileType = FILE_TYPE_OPTIONS.find((item) => item.value === importFileType) || FILE_TYPE_OPTIONS[0];
  const activeCategoryKey = form.categoryKey || (categoryOptions[0]?.key || '__new__');
  const isNewCategory = activeCategoryKey === '__new__';

  return (
    <div className="mp-page">
      <Link to="/management/question-bank" className="mp-link-back">
        <ArrowLeft size={16} /> Back to Question Bank
      </Link>

      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">
            School Year · {bank.school_year}
            {bank.is_active && (
              <span className="mp-active-badge" style={{ marginLeft: 8 }}>
                <CheckCircle2 size={14} aria-hidden="true" />
                Active
              </span>
            )}
          </p>
          <h1 className="mp-header__title">{bank.title}</h1>
          <p className="mp-header__lede">
            Manage exam categories, then import questions from Excel, Word, Documents, or PDF.
          </p>
        </div>
        <div className="mp-header__actions">
          <ManagementButton as={Link} to={`/management/question-bank/${bankId}/exam-preview`} variant="secondary">
            Review Exam
          </ManagementButton>
          <ManagementButton variant="secondary" onClick={openImport} disabled={subjects.length === 0}>
            <FileUp size={16} aria-hidden="true" /> Import Questions
          </ManagementButton>
          {!bank.is_active && (
            <ManagementButton
              variant="secondary"
              onClick={async () => {
                try {
                  const { data } = await questionBankApi.activateBank(bank.id);
                  setSuccess(data.message || 'Question bank activated.');
                  await load();
                } catch (err) {
                  setError(err.response?.data?.message || 'Unable to activate question bank.');
                }
              }}
            >
              <CheckCircle2 size={16} aria-hidden="true" /> Set Active
            </ManagementButton>
          )}
          <ManagementButton variant="primary" onClick={openCreate}>
            <Plus size={16} aria-hidden="true" /> Add Subject
          </ManagementButton>
        </div>
      </header>

      <div className="mp-stats">
        <div className="mp-stats__item">
          <div className="mp-stats__value">{formatNumber(subjects.length)}</div>
          <div className="mp-stats__label">Categories</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{formatNumber(bank.questions_count)}</div>
          <div className="mp-stats__label">Questions</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{formatNumber(bank.selected_questions_count)}</div>
          <div className="mp-stats__label">Selected for exam</div>
        </div>
      </div>

      {success && <div className="mp-alert mp-alert--success" role="status">{success}</div>}
      {error && <div className="mp-alert mp-alert--error" role="alert">{error}</div>}
      {importSummary.length > 0 && (
        <div className="mp-alert mp-alert--success" role="status">
          Last import:{' '}
          {importSummary.map((item) => `${item.subject} (${item.imported}${item.file_type ? ` · ${item.file_type}` : ''})`).join(' · ')}
        </div>
      )}

      <section className="mp-panel">
        <div className="mp-panel__head">
          <div>
            <h2 className="mp-panel__title"><BookOpen size={16} /> Categories</h2>
            <p className="mp-panel__hint">
              Add a category, then use <strong>Import Questions</strong> and choose Excel, Word, Documents, or PDF.
            </p>
          </div>
        </div>

        <div className="mp-cat-grid">
          {subjects.length === 0 ? (
            <p className="mp-panel__hint">No categories yet. Add General Information, Verbal Ability, Scientific Ability, or Numerical Ability.</p>
          ) : subjects.map((subject) => (
            <Link
              key={subject.id}
              to={`/management/question-bank/${bank.id}/subjects/${subject.id}`}
              className="mp-cat-card mp-cat-card--link"
            >
              <div className="mp-cat-card__top">
                <BookOpen size={18} aria-hidden="true" />
                <span className="mp-cat-card__code">{subject.code || 'SUB'}</span>
              </div>
              <h2 className="mp-cat-card__subject">{subject.name}</h2>
              <p className="mp-cat-card__desc">{subject.description || 'Entrance exam category'}</p>
              <div className="mp-cat-card__count">
                {formatNumber(subject.questions_count)}
                <small>questions</small>
              </div>
              <div className="mp-cat-card__meta">
                {formatNumber(subject.selected_questions_count)} / {formatNumber(subject.selection_limit ?? 5)} selected for exam
              </div>
              <div className="mp-cat-card__actions" onClick={(e) => e.preventDefault()}>
                <ManagementButton type="button" variant="tertiary" size="sm" onClick={(e) => openEdit(subject, e)}>
                  <Pencil size={14} aria-hidden="true" /> Edit
                </ManagementButton>
                <ManagementButton type="button" variant="tertiary" size="sm" onClick={(e) => handleDelete(subject, e)}>
                  <Trash2 size={14} aria-hidden="true" /> Delete
                </ManagementButton>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {showImport && (
        <div className="mp-modal-overlay" role="presentation" onClick={() => !importing && setShowImport(false)}>
          <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="import-exam-title" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal__header">
              <div>
                <h2 id="import-exam-title" className="mp-modal__title">Import Questions</h2>
                <p className="mp-modal__subtitle">
                  Pick a category and file type, then upload the matching file.
                </p>
              </div>
              <button type="button" className="mp-modal__close" onClick={() => setShowImport(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {importError && <div className="mp-alert mp-alert--error" role="alert">{importError}</div>}
            <form className="mp-form" onSubmit={submitImport}>
              <label className="mp-field">
                <span className="mp-field__label">Category</span>
                <select
                  className="mp-field__input"
                  value={importSubjectId}
                  onChange={(e) => setImportSubjectId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select category</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </label>

              <label className="mp-field">
                <span className="mp-field__label">File type</span>
                <select
                  className="mp-field__input"
                  value={importFileType}
                  onChange={(e) => {
                    setImportFileType(e.target.value);
                    setImportFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  required
                >
                  {FILE_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <span className="mp-field__hint">{selectedFileType.hint}</span>
              </label>

              <label className="mp-field">
                <span className="mp-field__label">Upload {selectedFileType.label} file</span>
                <input
                  ref={fileInputRef}
                  className="mp-field__input"
                  type="file"
                  accept={selectedFileType.accept}
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  required
                />
              </label>

              <label className="mp-field mp-field--check">
                <span className="mp-field__label">Replace existing questions</span>
                <label className="mp-check">
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                  />
                  Clear questions in this category before importing
                </label>
              </label>

              <div className="mp-modal__actions">
                <ManagementButton type="button" variant="secondary" onClick={() => setShowImport(false)} disabled={importing}>
                  Cancel
                </ManagementButton>
                <ManagementButton type="submit" variant="primary" disabled={importing}>
                  {importing ? 'Importing...' : 'Import questions'}
                </ManagementButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForm && (
        <div className="mp-modal-overlay" role="presentation" onClick={() => !saving && setShowForm(false)}>
          <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="subject-form-title" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal__header">
              <div>
                <h2 id="subject-form-title" className="mp-modal__title">
                  {editing ? 'Edit subject' : 'Add subject'}
                </h2>
                <p className="mp-modal__subtitle">Category under {bank.title}</p>
              </div>
              <button type="button" className="mp-modal__close" onClick={() => setShowForm(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {formError && <div className="mp-alert mp-alert--error" role="alert">{formError}</div>}
            <form className="mp-form" onSubmit={submit}>
              <label className="mp-field">
                <span className="mp-field__label">Category</span>
                <select
                  className="mp-field__input"
                  value={form.categoryKey || (categoryOptions[0]?.key || '__new__')}
                  onChange={(e) => {
                    const key = e.target.value;
                    const selected = categoryOptions.find((opt) => opt.key === key);
                    setForm({
                      ...form,
                      categoryKey: key,
                      customName: key === '__new__' ? form.customName : '',
                      description: key === '__new__'
                        ? form.description
                        : (selected?.description || form.description),
                    });
                  }}
                  required
                >
                  <option value="" disabled>Select category</option>
                  {categoryOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>{opt.name}</option>
                  ))}
                  <option value="__new__">+ Add new category</option>
                </select>
              </label>

              {isNewCategory && (
                <label className="mp-field">
                  <span className="mp-field__label">New category name</span>
                  <input
                    className="mp-field__input"
                    value={form.customName}
                    onChange={(e) => setForm({ ...form, customName: e.target.value })}
                    placeholder="e.g. Logical Ability"
                    required
                  />
                </label>
              )}

              <label className="mp-field">
                <span className="mp-field__label">Description</span>
                <textarea
                  className="mp-field__input mp-field__textarea"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What this category covers"
                />
              </label>

              <label className="mp-field">
                <span className="mp-field__label">Exam selection limit</span>
                <input
                  className="mp-field__input"
                  type="number"
                  min={0}
                  max={500}
                  value={form.selection_limit}
                  onChange={(e) => setForm({ ...form, selection_limit: e.target.value })}
                  placeholder="e.g. 5"
                  required
                />
                <span className="mp-field__hint">
                  How many questions from this category can be selected for the exam.
                </span>
              </label>

              <div className="mp-modal__actions">
                <ManagementButton type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>
                  Cancel
                </ManagementButton>
                <ManagementButton type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Save changes' : 'Create subject'}
                </ManagementButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
