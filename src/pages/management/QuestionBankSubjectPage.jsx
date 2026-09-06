import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileUp,
  FolderOpen,
  Layers,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { questionBankApi } from '../../api/questionBankApi';
import { ManagementButton } from '../../components/management/ManagementToolbar';
import { FileTypeIcon } from '../../components/ui/FileTypeIcon';
import { Skeleton, SkeletonCardGrid, SkeletonPageHeader, SkeletonStats } from '../../components/ui/Skeleton';
import {
  alertFromApiError,
  confirmAction,
  confirmDelete,
  toastError,
  toastSuccess,
  toastWarning,
} from '../../utils/swal';
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
  {
    name: 'Others',
    code: 'OTHERS',
    description: 'Other subject areas not covered above.',
  },
];

const FILE_TYPE_OPTIONS = [
  {
    value: 'excel',
    label: 'Excel',
    ext: '.xlsx · .xls · .csv',
    accept: '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv',
    hint: 'Columns: stem, option_a, option_b, option_c, option_d, correct_answer',
  },
  {
    value: 'word',
    label: 'Word',
    ext: '.docx',
    accept: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    hint: 'Numbered questions with A–D choices (.docx)',
  },
  {
    value: 'documents',
    label: 'Documents',
    ext: '.txt · .csv · .rtf',
    accept: '.txt,.csv,.rtf,text/plain,text/csv,application/rtf',
    hint: 'Plain text, CSV, or RTF with numbered A–D items',
  },
  {
    value: 'pdf',
    label: 'PDF',
    ext: '.pdf',
    accept: '.pdf,application/pdf',
    hint: 'Text-based exam PDF with numbered A–D items',
  },
];

const EMPTY_FORM = {
  addMode: 'single', // 'single' or 'multiple'
  categoryKey: '',
  customName: '',
  description: '',
  selection_limit: 5,
  selectedPresetCodes: ['MATH', 'ENGLISH', 'SCIENCE', 'GENERAL'],
  includeCustomInMultiple: false,
  customMultipleName: '',
};

export default function QuestionBankSubjectPage() {
  const { bankId } = useParams();
  const fileInputRef = useRef(null);
  const [bank, setBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [activeBankId, setActiveBankId] = useState(bankId);

  // Reset local state when the route param changes (avoid sync setState in an effect).
  // File Import Modal State
  const [showImportModal, setShowImportModal] = useState(false);
  const [targetSubjectId, setTargetSubjectId] = useState('');
  const [importFileType, setImportFileType] = useState('excel');
  const [importFile, setImportFile] = useState(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [dragging, setDragging] = useState(false);

  if (bankId !== activeBankId) {
    setActiveBankId(bankId);
    setBank(null);
    setLoading(true);
    setError('');
  }

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await questionBankApi.getBank(bankId);
      setBank(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load question bank.');
      setBank(null);
      await alertFromApiError(err, 'Unable to load question bank.');
    } finally {
      setLoading(false);
    }
  }, [bankId]);

  // Fetch on mount / bankId change. setState only runs after await so it is not
  // synchronous inside the effect (react-hooks/set-state-in-effect).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data } = await questionBankApi.getBank(bankId);
        if (cancelled) return;
        setBank(data.data);
        setError('');
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || 'Unable to load question bank.');
        setBank(null);
        await alertFromApiError(err, 'Unable to load question bank.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bankId]);

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

  const existingCategoryCodes = useMemo(
    () => new Set((bank?.subjects || []).map((subject) => (subject.code || '').toUpperCase()).filter(Boolean)),
    [bank]
  );

  const availableBulkCategories = useMemo(
    () => DEFAULT_CATEGORIES.filter((category, index, categories) => (
      category.code !== 'OTHERS'
      && !existingCategoryCodes.has(category.code)
      && !categories.slice(0, index).some((previous) => previous.code === category.code)
    )),
    [existingCategoryCodes]
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, categoryKey: '' });
    const availableCodes = categoryOptions
      .filter((opt) => opt.code && opt.code !== 'OTHERS')
      .map((opt) => opt.code);

    setForm({
      ...EMPTY_FORM,
      categoryKey: categoryOptions[0]?.key || '__new__',
      selectedPresetCodes: availableCodes.slice(0, 4),
    });
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (subject, event) => {
    event.preventDefault();
    event.stopPropagation();
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setEditing(subject);
    setForm({
      ...EMPTY_FORM,
      addMode: 'single',
      categoryKey: `editing:${subject.id}`,
      customName: '',
      description: subject.description || '',
      selection_limit: subject.selection_limit ?? 5,
    });
    setFormError('');
    setShowForm(true);
  };

  const openImportForSubject = (subject, event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setTargetSubjectId(subject ? String(subject.id) : (bank?.subjects?.[0]?.id ? String(bank.subjects[0].id) : ''));
    setImportFileType('excel');
    setImportFile(null);
    setReplaceExisting(false);
    setImportError('');
    setShowImportModal(true);
  };

  const handleDelete = async (subject, event) => {
    event.preventDefault();
    event.stopPropagation();
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const ok = await confirmDelete({
      text: `Delete "${subject.name}" and all of its questions? This action cannot be undone.`,
    });
    if (!ok) return;

    try {
      await questionBankApi.deleteSubject(subject.id);
      await toastSuccess('Record Deleted Successfully');
      await load();
    } catch (err) {
      await alertFromApiError(err, 'Unable to delete category.');
    }
  };

  const resolveCategoryPayload = () => {
    const key = form.categoryKey || (categoryOptions[0]?.key || '__new__');
    if (key === '__new__' || key === 'preset:OTHERS') {
      const name = form.customName.trim();
      if (!name) return { error: 'Enter a name for the category.' };
      return {
        name,
        code: codeFromName(name) || 'CUSTOM',
        description: form.description.trim() || null,
      };
    }

    const selected = categoryOptions.find((opt) => opt.key === key);
    if (!selected) return { error: 'Choose a category.' };

    return {
      name: selected.name,
      code: selected.code || codeFromName(selected.name) || null,
      description: form.description.trim() || selected.description || null,
    };
  };

  const submitSingleCategory = async () => {
    const resolved = resolveCategoryPayload();
    if (resolved.error) {
      setFormError(resolved.error);
      await toastWarning('Check the form', resolved.error);
      return;
    }

    const ok = await confirmAction({
      title: 'Are you sure?',
      text: editing ? `Update category "${resolved.name}"?` : `Add category "${resolved.name}"?`,
    });
    if (!ok) return;

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
        await toastSuccess('Category Updated Successfully');
      } else {
        await questionBankApi.createSubject(bankId, payload);
        await toastSuccess('Category Added Successfully');
      }
      setShowForm(false);
      await load();
    } catch (err) {
      const first = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : null;
      const message = first || err.response?.data?.message || 'Unable to save category.';
      setFormError(message);
      await toastError('Unable to save', message);
    } finally {
      setSaving(false);
    }
  };

  const submitMultipleCategories = async () => {
    const availableCodes = new Set(availableBulkCategories.map((category) => category.code));
    const selectedCodes = (form.selectedPresetCodes || []).filter((code) => availableCodes.has(code));
    const includeCustom = form.includeCustomInMultiple && form.customMultipleName.trim();
    const customName = form.customMultipleName.trim();
    const customCode = codeFromName(customName) || 'CUSTOM';

    if (includeCustom && existingCategoryCodes.has(customCode)) {
      const message = `The code ${customCode} is already used. Choose a different custom category name.`;
      setFormError(message);
      await toastWarning('Code already used', message);
      return;
    }

    if (selectedCodes.length === 0 && !includeCustom) {
      setFormError('Select at least one category to add.');
      await toastWarning('Select categories', 'Check at least one category to add.');
      return;
    }

    const ok = await confirmAction({
      title: 'Are you sure?',
      text: `Add ${selectedCodes.length + (includeCustom ? 1 : 0)} category(ies) to this Question Bank?`,
    });
    if (!ok) return;

    setSaving(true);
    setFormError('');
    try {
      const itemsToCreate = [];

      selectedCodes.forEach((code) => {
        const cat = DEFAULT_CATEGORIES.find((c) => c.code === code);
        if (cat) {
          itemsToCreate.push({
            name: cat.name,
            code: cat.code,
            description: cat.description,
            selection_limit: Math.max(0, Number(form.selection_limit) || 5),
          });
        }
      });

      if (includeCustom && customName) {
        itemsToCreate.push({
          name: customName,
          code: customCode,
          description: form.description.trim() || `Exam category for ${customName}`,
          selection_limit: Math.max(0, Number(form.selection_limit) || 5),
        });
      }

      await Promise.all(
        itemsToCreate.map((payload) => questionBankApi.createSubject(bankId, payload))
      );

      await toastSuccess(`${itemsToCreate.length} Categories Added Successfully`);
      setShowForm(false);
      await load();
    } catch (err) {
      const first = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : null;
      const message = first || err.response?.data?.message || 'Unable to save categories.';
      setFormError(message);
      await toastError('Unable to save', message);
    } finally {
      setSaving(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (editing || form.addMode === 'single') {
      submitSingleCategory();
    } else {
      submitMultipleCategories();
    }
  };

  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!targetSubjectId) {
      setImportError('Select a category to import into.');
      await toastWarning('Category required', 'Choose a category for importing questions.');
      return;
    }
    if (!importFile) {
      setImportError('Choose a file to upload.');
      await toastWarning('File required', 'Click or drag a file to upload.');
      return;
    }

    const targetSub = (bank?.subjects || []).find((s) => String(s.id) === String(targetSubjectId));
    const subName = targetSub ? targetSub.name : 'selected category';

    const ok = await confirmAction({
      title: 'Import Questions?',
      text: replaceExisting
        ? `Questions in "${subName}" will be replaced with questions from this file.`
        : `Import questions into "${subName}"?`,
    });
    if (!ok) return;

    setImporting(true);
    setImportError('');
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('file_type', importFileType);
      formData.append('exam_subject_id', targetSubjectId);
      formData.append('replace_existing', replaceExisting ? '1' : '0');

      const { data } = await questionBankApi.importQuestions(bankId, formData);
      await toastSuccess(data.message || `Questions Imported into ${subName} Successfully`);
      setShowImportModal(false);
      setImportFile(null);
      await load();
    } catch (err) {
      const first = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : null;
      const message = first || err.response?.data?.message || 'Unable to import file into category.';
      setImportError(message);
      await toastError('Import Failed', message);
    } finally {
      setImporting(false);
    }
  };

  if (loading && !bank) {
    return (
      <div className="mp-page">
        <Skeleton className="ui-skeleton--lede" style={{ width: '8rem', marginBottom: '1rem' }} />
        <SkeletonPageHeader />
        <SkeletonStats count={3} />
        <SkeletonCardGrid count={6} />
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
  const activeCategoryKey = form.categoryKey || (categoryOptions[0]?.key || '__new__');
  const isNewCategory = activeCategoryKey === '__new__' || activeCategoryKey === 'preset:OTHERS';
  const selectedFileType = FILE_TYPE_OPTIONS.find((t) => t.value === importFileType) || FILE_TYPE_OPTIONS[0];

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
            Manage exam categories for this bank. Open a category to add or import questions.
            Manage exam categories for this bank. Add single or multiple categories, or upload question files.
          </p>
          <p className="mp-hierarchy-crumb">
            <FolderOpen size={14} aria-hidden="true" />
            <Link to="/management/question-bank">Banks</Link>
            <span aria-hidden="true">→</span>
            <Layers size={14} aria-hidden="true" />
            <strong>Categories</strong>
            <span aria-hidden="true">→</span>
            <BookOpen size={14} aria-hidden="true" />
            Questions
          </p>
        </div>
        <div className="mp-header__actions">
          <ManagementButton as={Link} to={`/management/question-bank/${bankId}/exam-preview`} variant="secondary">
            <ClipboardList size={16} aria-hidden="true" /> Review Exam
          </ManagementButton>
          {!bank.is_active && (
            <ManagementButton
              variant="secondary"
              onClick={async () => {
                const ok = await confirmAction({
                  title: 'Set active question bank?',
                  text: `"${bank.title}" will become the examination question set.`,
                  confirmText: 'Set Active',
                  icon: 'question',
                });
                if (!ok) return;
                try {
                  const { data } = await questionBankApi.activateBank(bank.id);
                  await toastSuccess(data.message || 'Question bank activated.');
                  await load();
                } catch (err) {
                  await alertFromApiError(err, 'Unable to activate question bank.');
                }
              }}
            >
              <CheckCircle2 size={16} aria-hidden="true" /> Set Active
            </ManagementButton>
          )}

          {subjects.length > 0 && (
            <ManagementButton variant="secondary" onClick={(e) => openImportForSubject(subjects[0], e)}>
              <FileUp size={16} aria-hidden="true" /> Import File
            </ManagementButton>
          )}

          <ManagementButton variant="primary" onClick={openCreate}>
            <Plus size={16} aria-hidden="true" /> Add Category
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

      <section className="mp-panel">
        <div className="mp-panel__head">
          <div>
            <h2 className="mp-panel__title"><Layers size={16} /> Categories</h2>
            <p className="mp-panel__hint">
              Open a category to import questions (Excel, Word, or PDF) or add them manually.
              Manage category subjects or upload question files (Excel, Word, PDF, Text) into specific categories.
            </p>
          </div>
        </div>

        <div className="mp-cat-grid">
          {subjects.length === 0 ? (
            <>
              <p className="mp-panel__hint">No categories yet. Add single or multiple categories to get started.</p>
            </>
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
                <ManagementButton type="button" variant="secondary" size="sm" onClick={(e) => openImportForSubject(subject, e)}>
                  <FileUp size={14} aria-hidden="true" /> Import File
                </ManagementButton>
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

      {/* Add / Edit Category Modal */}
      {showForm && (
        <div className="mp-modal-overlay" role="presentation" onClick={() => !saving && setShowForm(false)}>
          <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="subject-form-title" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', width: '92%' }}>
            <div className="mp-modal__header">
              <div>
                <h2 id="subject-form-title" className="mp-modal__title">
                  {editing ? 'Edit category' : 'Add Category'}
                </h2>
                <p className="mp-modal__subtitle">Category under {bank.title}</p>
              </div>
              <button type="button" className="mp-modal__close" onClick={() => setShowForm(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {formError && <div className="mp-alert mp-alert--error" role="alert">{formError}</div>}
            <form className="mp-form" onSubmit={handleFormSubmit}>
              {!editing && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button
                    type="button"
                    className={`mgmt-btn ${form.addMode === 'single' ? 'mgmt-btn--primary' : 'mgmt-btn--secondary'}`}
                    style={{ flex: 1, padding: '8px 12px' }}
                    onClick={() => setForm({ ...form, addMode: 'single' })}
                  >
                    Single Category
                  </button>
                  <button
                    type="button"
                    className={`mgmt-btn ${form.addMode === 'multiple' ? 'mgmt-btn--primary' : 'mgmt-btn--secondary'}`}
                    style={{ flex: 1, padding: '8px 12px' }}
                    onClick={() => setForm({ ...form, addMode: 'multiple' })}
                  >
                    Multiple Categories (Bulk)
                  </button>
                </div>
              )}

              {/* Single Category Form */}
              {(editing || form.addMode === 'single') && (
                <>
                  <label className="mp-field">
                    <span className="mp-field__label">Category</span>
                    <select
                      className="mp-field__input"
                      value={form.categoryKey}
                      onChange={(e) => setForm({ ...form, categoryKey: e.target.value })}
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
                        placeholder="e.g. Logical Ability, Physics, Filipino"
                        required
                      />
                    </label>
                  )}

                  <label className="mp-field">
                    <span className="mp-field__label">Description</span>
                    <textarea
                      className="mp-field__input mp-field__textarea"
                      rows={2}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="What this category covers"
                    />
                  </label>
                </>
              )}

              {/* Multiple Categories Form */}
              {!editing && form.addMode === 'multiple' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="mp-field__label" style={{ fontWeight: 600 }}>Select Categories to Add:</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', fontSize: '12px' }}
                        onClick={() => {
                          const allCodes = availableBulkCategories.map((category) => category.code);
                          setForm({ ...form, selectedPresetCodes: allCodes, includeCustomInMultiple: true });
                        }}
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer', fontSize: '12px' }}
                        onClick={() => setForm({ ...form, selectedPresetCodes: [], includeCustomInMultiple: false })}
                      >
                        Clear
                      </button>
                    </div>
                  </div>

              <div className="mp-field">
                <span className="mp-field__label">Available categories and codes</span>
                  <p className="mp-field__hint">Only categories not already in this question bank can be selected.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px', borderRadius: '8px', background: 'var(--color-canvas-soft)' }}>
                    {availableBulkCategories.map((cat) => {
                      const checked = form.selectedPresetCodes.includes(cat.code);
                      return (
                        <label key={cat.code} className="mp-check" style={{ fontSize: '13px' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...form.selectedPresetCodes, cat.code]
                                : form.selectedPresetCodes.filter((c) => c !== cat.code);
                              setForm({ ...form, selectedPresetCodes: next });
                            }}
                          />
                          <span>{cat.name} <small>({cat.code})</small></span>
                        </label>
                      );
                    })}
                  </div>
                  {availableBulkCategories.length === 0 && (
                    <p className="mp-field__hint">All preset category codes have already been added.</p>
                  )}
                  {existingCategoryCodes.size > 0 && (
                    <p className="mp-field__hint">Already used codes: {Array.from(existingCategoryCodes).join(', ')}</p>
                  )}
                </div>

                  <label className="mp-field mp-field--check">
                    <label className="mp-check">
                      <input
                        type="checkbox"
                        checked={form.includeCustomInMultiple}
                        onChange={(e) => setForm({ ...form, includeCustomInMultiple: e.target.checked })}
                      />
                      Add Custom / Other Category Name
                    </label>
                  </label>

                  {form.includeCustomInMultiple && (
                    <label className="mp-field">
                      <span className="mp-field__label">Custom Category Name</span>
                      <input
                        className="mp-field__input"
                        value={form.customMultipleName}
                        onChange={(e) => setForm({ ...form, customMultipleName: e.target.value })}
                        placeholder="e.g. Philippine History, Analytical Skills"
                      />
                    </label>
                  )}
                </div>
              )}

              <label className="mp-field" style={{ marginTop: '10px' }}>
                <span className="mp-field__label">Exam selection limit per category</span>
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
                  {saving
                    ? 'Saving...'
                    : editing
                      ? 'Save changes'
                      : form.addMode === 'multiple'
                        ? 'Add Selected Categories'
                        : 'Create category'}
                </ManagementButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* File Import Modal per Category */}
      {showImportModal && (
        <div className="mp-modal-overlay" role="presentation" onClick={() => !importing && setShowImportModal(false)}>
          <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="category-import-title" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px', width: '92%' }}>
            <div className="mp-modal__header">
              <div>
                <h2 id="category-import-title" className="mp-modal__title">
                  Import File to Category
                </h2>
                <p className="mp-modal__subtitle">Upload questions into a specific category from Excel, Word, PDF, or Text documents.</p>
              </div>
              <button type="button" className="mp-modal__close" onClick={() => setShowImportModal(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {importError && <div className="mp-alert mp-alert--error" role="alert">{importError}</div>}
            <form className="mp-form" onSubmit={handleImportSubmit}>
              <label className="mp-field">
                <span className="mp-field__label">Target Category</span>
                <select
                  className="mp-field__input"
                  value={targetSubjectId}
                  onChange={(e) => setTargetSubjectId(e.target.value)}
                  required
                >
                  <option value="" disabled>Select target category</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.questions_count || 0} questions)
                    </option>
                  ))}
                </select>
              </label>

              <div className="mp-field">
                <span className="mp-field__label">File format</span>
                <div className="mp-file-type-grid">
                  {FILE_TYPE_OPTIONS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={`mp-file-type-card${importFileType === item.value ? ' mp-file-type-card--selected' : ''}`}
                      onClick={() => {
                        setImportFileType(item.value);
                        setImportFile(null);
                      }}
                    >
                      <FileTypeIcon type={item.value} size={24} />
                      <div className="mp-file-type-card__label">{item.label}</div>
                      <div className="mp-file-type-card__ext">{item.ext}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mp-field">
                <span className="mp-field__label">File upload</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={selectedFileType.accept}
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setImportFile(f);
                  }}
                />
                <div
                  className={`mp-dropzone${dragging ? ' mp-dropzone--dragging' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) setImportFile(f);
                  }}
                >
                  <FileTypeIcon type={selectedFileType.value} size={36} />
                  {importFile ? (
                    <>
                      <p className="mp-dropzone__title">File ready to import</p>
                      <div className="mp-dropzone__file">
                        <FileTypeIcon type={selectedFileType.value} size={16} />
                        <span>{importFile.name}</span>
                      </div>
                      <p className="mp-dropzone__hint">Click to choose a different file</p>
                    </>
                  ) : (
                    <>
                      <p className="mp-dropzone__title">Click to upload {selectedFileType.label} file</p>
                      <p className="mp-dropzone__hint">Or drag &amp; drop · {selectedFileType.ext}</p>
                      <span className="mp-dropzone__browse">
                        <Upload size={14} aria-hidden="true" /> Browse files
                      </span>
                    </>
                  )}
                </div>
              </div>

              <label className="mp-field mp-field--check">
                <label className="mp-check">
                  <input
                    type="checkbox"
                    checked={replaceExisting}
                    onChange={(e) => setReplaceExisting(e.target.checked)}
                  />
                  Clear existing questions in this category before importing
                </label>
              </label>

              <div className="mp-modal__actions">
                <ManagementButton type="button" variant="secondary" onClick={() => setShowImportModal(false)} disabled={importing}>
                  Cancel
                </ManagementButton>
                <ManagementButton type="submit" variant="primary" disabled={importing}>
                  <FileUp size={16} aria-hidden="true" />
                  {importing ? 'Importing...' : 'Import file to category'}
                </ManagementButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

