import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckSquare,
  FileUp,
  FolderOpen,
  Layers,
  Pencil,
  Plus,
  Square,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { questionBankApi } from '../../api/questionBankApi';
import { ManagementButton, ManagementToolbar } from '../../components/management/ManagementToolbar';
import { StatusBadge } from '../../components/management/StatusBadge';
import { DataTable } from '../../components/management/DataTable';
import { FileTypeIcon, getFileTypePreset } from '../../components/ui/FileTypeIcon';
import { Skeleton, SkeletonPageHeader, SkeletonStats, SkeletonTable } from '../../components/ui/Skeleton';
import { useTableState, statusVariant } from './useTableState';
import {
  alertFromApiError,
  confirmAction,
  confirmDelete,
  showLoading,
  closeLoading,
  toastError,
  toastSuccess,
  toastWarning,
} from '../../utils/swal';
import '../../components/management/management.css';
import './management-pages.css';

const EMPTY_FORM = {
  stem: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correct_answer: 'A',
  difficulty: 'medium',
  is_selected_for_exam: false,
};

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

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

export default function QuestionBankDetailPage() {
  const { bankId, subjectId } = useParams();
  const fileInputRef = useRef(null);
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [busyId, setBusyId] = useState(null);
  const [showLimitForm, setShowLimitForm] = useState(false);
  const [limitValue, setLimitValue] = useState(5);
  const [savingLimit, setSavingLimit] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importFileType, setImportFileType] = useState('excel');
  const [importFile, setImportFile] = useState(null);
  const [replaceExisting, setReplaceExisting] = useState(true);
  const [selectionFilter, setSelectionFilter] = useState('all');
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [dragging, setDragging] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await questionBankApi.getSubject(subjectId);
      setSubject(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load subject questions.');
      setSubject(null);
      await alertFromApiError(err, 'Unable to load subject questions.');
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    load();
  }, [load]);

  const questions = useMemo(() => (subject?.questions || []).map((item) => ({
    id: item.id,
    stem: item.stem,
    difficulty: item.difficulty,
    status: item.status,
    correct: item.correct_answer,
    selected: item.is_selected_for_exam,
    options: item.options || [],
    optionsLabel: (item.options || []).map((opt) => `${opt.key}. ${opt.text}`).join(' · '),
    raw: item,
  })), [subject]);

  const filterQuestions = useCallback((row) => {
    if (selectionFilter === 'selected') return row.selected;
    if (selectionFilter === 'unselected') return !row.selected;
    return true;
  }, [selectionFilter]);

  const table = useTableState(questions, {
    searchKeys: ['stem', 'difficulty', 'status', 'correct', 'optionsLabel'],
    pageSize: Number.MAX_SAFE_INTEGER,
    filterFn: filterQuestions,
  });

  const selectionLimit = subject?.selection_limit ?? 5;
  const selectedCount = subject?.selected_questions_count ?? 0;
  const atSelectionLimit = selectedCount >= selectionLimit;
  const selectedFileType = FILE_TYPE_OPTIONS.find((item) => item.value === importFileType) || FILE_TYPE_OPTIONS[0];
  const selectedPreset = getFileTypePreset(selectedFileType.value);

  const openLimitForm = () => {
    setLimitValue(selectionLimit);
    setShowLimitForm(true);
  };

  const saveSelectionLimit = async (event) => {
    event.preventDefault();
    const nextLimit = Math.max(0, Number(limitValue) || 0);
    setSavingLimit(true);
    try {
      const { data } = await questionBankApi.updateSubject(subjectId, { selection_limit: nextLimit });
      setSubject((prev) => ({
        ...prev,
        ...data.data,
        question_bank: prev?.question_bank,
        questions: prev?.questions,
      }));
      setShowLimitForm(false);
      await toastSuccess(`Selection limit updated to ${nextLimit}.`);
      await load();
    } catch (err) {
      await alertFromApiError(err, 'Unable to update selection limit.');
    } finally {
      setSavingLimit(false);
    }
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openImport = () => {
    setImportFileType('excel');
    setImportFile(null);
    setReplaceExisting(true);
    setImportError('');
    setDragging(false);
    setShowImport(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openEdit = (question) => {
    const options = question.raw?.options || [];
    const byKey = Object.fromEntries(options.map((opt) => [opt.key, opt.text || '']));
    setEditing(question);
    setForm({
      stem: question.stem || '',
      optionA: byKey.A || '',
      optionB: byKey.B || '',
      optionC: byKey.C || '',
      optionD: byKey.D || '',
      correct_answer: question.correct || 'A',
      difficulty: question.difficulty || 'medium',
      is_selected_for_exam: Boolean(question.selected),
    });
    setFormError('');
    setShowForm(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    const options = [form.optionA, form.optionB, form.optionC, form.optionD]
      .map((value) => value.trim())
      .filter(Boolean);

    if (form.stem.trim().length < 5) {
      setFormError('Enter a full question stem.');
      await toastWarning('Check the form', 'Enter a full question stem.');
      return;
    }
    if (options.length < 2) {
      setFormError('Add at least two answer options.');
      await toastWarning('Check the form', 'Add at least two answer options.');
      return;
    }

    const payload = {
      stem: form.stem.trim(),
      options,
      correct_answer: form.correct_answer,
      difficulty: form.difficulty,
      status: form.is_selected_for_exam ? 'active' : 'draft',
      is_selected_for_exam: form.is_selected_for_exam,
    };

    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        const ok = await confirmAction({
          title: 'Are you sure?',
          text: 'Update this question?',
        });
        if (!ok) {
          setSaving(false);
          return;
        }
        await questionBankApi.updateQuestion(editing.id, payload);
        await toastSuccess('Question Updated Successfully');
      } else {
        const ok = await confirmAction({
          title: 'Are you sure?',
          text: 'Add this question to the bank?',
        });
        if (!ok) {
          setSaving(false);
          return;
        }
        await questionBankApi.createQuestion(subjectId, payload);
        await toastSuccess('Question Added Successfully');
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err) {
      const first = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : null;
      const message = first || err.response?.data?.message || (editing ? 'Unable to update question.' : 'Unable to add question.');
      setFormError(message);
      await toastError('Unable to save', message);
    } finally {
      setSaving(false);
    }
  };

  const submitImport = async (event) => {
    event.preventDefault();
    const bankKey = bankId || subject?.question_bank_id;
    if (!bankKey) {
      await toastError('Missing bank', 'Unable to determine question bank.');
      return;
    }
    if (!importFile) {
      setImportError('Choose a file to upload.');
      await toastWarning('File required', 'Click the upload area and choose a file.');
      return;
    }
    if (replaceExisting) {
      const ok = await confirmAction({
        title: 'Are you sure?',
        text: `Questions in "${subject.name}" will be cleared before import. This action cannot be undone.`,
      });
      if (!ok) return;
    } else {
      const ok = await confirmAction({
        title: 'Are you sure?',
        text: 'Import questions into this category?',
      });
      if (!ok) return;
    }

    setImporting(true);
    setImportError('');
    showLoading('Importing Questions...');
    try {
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('file_type', importFileType);
      formData.append('exam_subject_id', subjectId);
      formData.append('replace_existing', replaceExisting ? '1' : '0');
      const { data } = await questionBankApi.importQuestions(bankKey, formData);
      const summary = data.data?.import_summary?.[0];
      closeLoading();
      await toastSuccess(
        data.message || 'Questions Imported Successfully',
        summary ? `${summary.imported} question(s) imported.` : ''
      );
      setShowImport(false);
      setImportFile(null);
      await load();
    } catch (err) {
      closeLoading();
      const first = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : null;
      const message = first || err.response?.data?.message || 'Unable to import questions.';
      setImportError(message);
      await toastError('Import Failed', message);
    } finally {
      setImporting(false);
    }
  };

  const toggleSelection = async (question) => {
    const nextSelected = !question.selected;

    if (nextSelected && atSelectionLimit) {
      await toastWarning(
        'Selection limit reached',
        `Limit is ${selectionLimit}. Increase the limit or deselect another question.`
      );
      return;
    }

    setBusyId(question.id);
    setSubject((prev) => {
      if (!prev) return prev;
      const nextQuestions = (prev.questions || []).map((item) => (item.id === question.id
        ? {
            ...item,
            is_selected_for_exam: nextSelected,
            status: nextSelected ? 'active' : 'draft',
          }
        : item));

      return {
        ...prev,
        questions: nextQuestions,
        selected_questions_count: nextQuestions.filter((item) => item.is_selected_for_exam).length,
      };
    });

    try {
      const { data } = await questionBankApi.toggleSelection(question.id);
      const apiSelected = Boolean(data?.data?.is_selected_for_exam ?? nextSelected);
      setSubject((prev) => {
        if (!prev) return prev;
        const nextQuestions = (prev.questions || []).map((item) => (item.id === question.id
          ? {
              ...item,
              is_selected_for_exam: apiSelected,
              status: apiSelected ? 'active' : 'draft',
            }
          : item));

        return {
          ...prev,
          questions: nextQuestions,
          selected_questions_count: nextQuestions.filter((item) => item.is_selected_for_exam).length,
        };
      });
      await toastSuccess(data.message || 'Selection updated.');
    } catch (err) {
      setSubject((prev) => {
        if (!prev) return prev;
        const nextQuestions = (prev.questions || []).map((item) => (item.id === question.id
          ? {
              ...item,
              is_selected_for_exam: question.selected,
              status: question.selected ? 'active' : 'draft',
            }
          : item));

        return {
          ...prev,
          questions: nextQuestions,
          selected_questions_count: nextQuestions.filter((item) => item.is_selected_for_exam).length,
        };
      });
      await alertFromApiError(err, 'Unable to update exam selection.');
    } finally {
      setBusyId(null);
    }
  };

  const removeQuestion = async (question) => {
    const ok = await confirmDelete();
    if (!ok) return;

    setBusyId(question.id);
    try {
      await questionBankApi.deleteQuestion(question.id);
      await toastSuccess('Record Deleted Successfully');
      await load();
    } catch (err) {
      await alertFromApiError(err, 'Unable to delete question.');
    } finally {
      setBusyId(null);
    }
  };

  const columns = [
    {
      key: 'stem',
      label: 'Question',
      sortable: true,
      render: (row) => (
        <div>
          <div className="mp-result-name">{row.stem}</div>
          <div className="mp-option-list">
            {(row.options || []).map((opt) => {
              const isCorrect = opt.key === row.correct;
              return (
                <span
                  key={opt.key}
                  className={`mp-option-chip${isCorrect ? ' mp-option-chip--correct' : ''}`}
                >
                  <strong>{opt.key}.</strong> {opt.text}
                </span>
              );
            })}
          </div>
        </div>
      ),
    },
    {
      key: 'correct',
      label: 'Answer',
      sortable: true,
      render: (row) => (
        <span className="mp-correct-answer" title="Correct answer">
          {row.correct}
        </span>
      ),
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      sortable: true,
      render: (row) => <StatusBadge variant="default">{row.difficulty}</StatusBadge>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (row) => <StatusBadge variant={statusVariant(row.status)}>{row.status}</StatusBadge>,
    },
    {
      key: 'selected',
      label: 'Use in exam',
      sortable: true,
      render: (row) => (
        <ManagementButton
          type="button"
          variant={row.selected ? 'primary' : 'secondary'}
          size="sm"
          disabled={busyId === row.id || (!row.selected && atSelectionLimit)}
          onClick={() => toggleSelection(row)}
        >
          {row.selected ? <CheckSquare size={14} /> : <Square size={14} />}
          {row.selected ? 'Selected' : atSelectionLimit ? 'Limit reached' : 'Select'}
        </ManagementButton>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="mp-row-actions">
          <ManagementButton
            type="button"
            variant="tertiary"
            size="sm"
            disabled={busyId === row.id}
            onClick={() => openEdit(row)}
            aria-label="Edit question"
          >
            <Pencil size={14} />
          </ManagementButton>
          <ManagementButton
            type="button"
            variant="tertiary"
            size="sm"
            disabled={busyId === row.id}
            onClick={() => removeQuestion(row)}
            aria-label="Delete question"
          >
            <Trash2 size={14} />
          </ManagementButton>
        </div>
      ),
    },
  ];

  const backTo = bankId
    ? `/management/question-bank/${bankId}`
    : `/management/question-bank/${subject?.question_bank_id || ''}`;

  if (loading && !subject) {
    return (
      <div className="mp-page">
        <Skeleton className="ui-skeleton--lede" style={{ width: '10rem', marginBottom: '1rem' }} />
        <SkeletonPageHeader />
        <SkeletonStats count={3} />
        <SkeletonTable rows={6} cols={5} />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="mp-page">
        <div className="mp-alert mp-alert--error" role="alert">{error || 'Subject not found.'}</div>
        <Link to="/management/question-bank" className="mp-link-back">
          <ArrowLeft size={16} /> Back to Question Bank
        </Link>
      </div>
    );
  }

  return (
    <div className="mp-page">
      <Link to={backTo} className="mp-link-back">
        <ArrowLeft size={16} /> Back to {subject.question_bank?.title || 'question bank'}
      </Link>

      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">
            {subject.question_bank?.school_year || 'Question Bank'} · {subject.code || 'Subject'}
            {subject.question_bank?.is_active && (
              <span className="mp-active-badge" style={{ marginLeft: 8 }}>
                Active bank
              </span>
            )}
          </p>
          <h1 className="mp-header__title">{subject.name}</h1>
          <p className="mp-header__lede">
            {subject.description || 'Add questions manually or import from Excel, Word, or PDF.'}
          </p>
          <p className="mp-hierarchy-crumb">
            <FolderOpen size={14} aria-hidden="true" />
            <Link to="/management/question-bank">Banks</Link>
            <span aria-hidden="true">→</span>
            <Layers size={14} aria-hidden="true" />
            <Link to={backTo}>Categories</Link>
            <span aria-hidden="true">→</span>
            <BookOpen size={14} aria-hidden="true" />
            <strong>Questions</strong>
          </p>
        </div>
        <div className="mp-header__actions">
          <ManagementButton variant="secondary" onClick={openLimitForm}>
            <Pencil size={16} aria-hidden="true" /> Edit selection limit
          </ManagementButton>
          <ManagementButton variant="secondary" onClick={openImport}>
            <FileUp size={16} aria-hidden="true" /> Import Questions
          </ManagementButton>
          <ManagementButton variant="primary" onClick={openCreate}>
            <Plus size={16} aria-hidden="true" /> Add Question
          </ManagementButton>
        </div>
      </header>

      <div className="mp-stats">
        <div className="mp-stats__item">
          <div className="mp-stats__value">{formatNumber(subject.questions_count)}</div>
          <div className="mp-stats__label">Questions in bank</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">
            {formatNumber(selectedCount)} / {formatNumber(selectionLimit)}
          </div>
          <div className="mp-stats__label">Selected / Limit</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">
            {formatNumber(Math.max(0, selectionLimit - selectedCount))}
          </div>
          <div className="mp-stats__label">Slots remaining</div>
        </div>
      </div>

      <section className="mp-panel">
        <div className="mp-panel__head">
          <div>
            <h2 className="mp-panel__title"><BookOpen size={16} /> Questions</h2>
            <p className="mp-panel__hint">
              You can select up to <strong>{selectionLimit}</strong> questions for the exam.
              Import with Excel (green), Word (blue), or PDF (red), or add one by one.
            </p>
          </div>
        </div>

        <ManagementToolbar
          searchId="subject-questions-search"
          searchValue={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Search questions..."
          filters={[
            <select
              key="selection-filter"
              className="mp-field__input"
              value={selectionFilter}
              onChange={(event) => setSelectionFilter(event.target.value)}
              aria-label="Filter questions by exam selection"
            >
              <option value="all">All questions</option>
              <option value="selected">Selected for exam</option>
              <option value="unselected">Unselected</option>
            </select>,
          ]}
        />

        {loading ? (
          <SkeletonTable rows={5} cols={5} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={table.allRows}
              rowKey="id"
              sortKey={table.sortKey}
              sortDir={table.sortDir}
              onSort={table.onSort}
              emptyTitle="No questions yet"
              emptyDescription="Import a file or add your first question to this category."
            />
          </>
        )}
      </section>

      {showImport && (
        <div className="mp-modal-overlay" role="presentation" onClick={() => !importing && setShowImport(false)}>
          <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="import-cat-title" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal__header">
              <div>
                <h2 id="import-cat-title" className="mp-modal__title">Import into {subject.name}</h2>
                <p className="mp-modal__subtitle">Choose a file type, then click the upload area.</p>
              </div>
              <button type="button" className="mp-modal__close" onClick={() => setShowImport(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {importError && <div className="mp-alert mp-alert--error" role="alert">{importError}</div>}
            <form className="mp-form" onSubmit={submitImport}>
              <div className="mp-field">
                <span className="mp-field__label">File type</span>
                <div className="mp-filetype-grid" role="radiogroup" aria-label="Import file type">
                  {FILE_TYPE_OPTIONS.map((opt) => {
                    const preset = getFileTypePreset(opt.value);
                    const selected = importFileType === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={`mp-filetype-card${selected ? ' is-selected' : ''}`}
                        style={{
                          '--mp-ft-color': preset.color,
                          borderColor: selected ? preset.color : preset.border,
                          background: selected ? preset.bg : undefined,
                        }}
                        onClick={() => {
                          setImportFileType(opt.value);
                          setImportFile(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                      >
                        <FileTypeIcon type={opt.value} size={32} />
                        <span className="mp-filetype-card__label">{opt.label}</span>
                        <span className="mp-filetype-card__ext">{opt.ext}</span>
                      </button>
                    );
                  })}
                </div>
                <span className="mp-field__hint">{selectedFileType.hint}</span>
              </div>

              <div className="mp-field">
                <span className="mp-field__label">Upload {selectedFileType.label} file</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={selectedFileType.accept}
                  hidden
                  onChange={(e) => {
                    setImportFile(e.target.files?.[0] || null);
                    setImportError('');
                  }}
                />
                <div
                  className={`mp-dropzone${dragging ? ' is-dragging' : ''}${importFile ? ' is-filled' : ''}`}
                  style={{ '--mp-ft-color': selectedPreset.color }}
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    setImportFile(e.dataTransfer.files?.[0] || null);
                    setImportError('');
                  }}
                >
                  <FileTypeIcon type={selectedFileType.value} size={40} />
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
                      <p className="mp-dropzone__title">Click to upload {selectedFileType.label}</p>
                      <p className="mp-dropzone__hint">Or drag and drop · {selectedFileType.ext}</p>
                      <span className="mp-dropzone__browse">
                        <Upload size={14} aria-hidden="true" /> Browse files
                      </span>
                    </>
                  )}
                </div>
              </div>

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
                  <FileUp size={16} aria-hidden="true" />
                  {importing ? 'Importing...' : 'Import questions'}
                </ManagementButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForm && (
        <div className="mp-modal-overlay" role="presentation" onClick={closeForm}>
          <div className="mp-modal mp-question-modal" role="dialog" aria-modal="true" aria-labelledby="question-form-title" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal__header">
              <div>
                <h2 id="question-form-title" className="mp-modal__title">
                  {editing ? 'Edit question' : 'Add question'}
                </h2>
                <p className="mp-modal__subtitle">Multiple choice question for {subject.name}.</p>
              </div>
              <button type="button" className="mp-modal__close" onClick={closeForm} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {formError && <div className="mp-alert mp-alert--error" role="alert">{formError}</div>}
            <form className="mp-form" onSubmit={submit}>
              <label className="mp-field">
                <span className="mp-field__label">Question</span>
                <textarea
                  className="mp-field__input mp-field__textarea"
                  rows={3}
                  value={form.stem}
                  onChange={(e) => setForm({ ...form, stem: e.target.value })}
                  placeholder="Type the question here..."
                  required
                />
              </label>

              <div className="mp-option-grid">
                {['A', 'B', 'C', 'D'].map((letter) => (
                  <label key={letter} className="mp-field">
                    <span className="mp-field__label">Option {letter}</span>
                    <input
                      className="mp-field__input"
                      value={form[`option${letter}`]}
                      onChange={(e) => setForm({ ...form, [`option${letter}`]: e.target.value })}
                      placeholder={`Answer ${letter}`}
                      required={letter === 'A' || letter === 'B'}
                    />
                  </label>
                ))}
              </div>

              <div className="mp-result-filters">
                <label className="mp-field">
                  <span className="mp-field__label">Correct answer</span>
                  <select
                    className="mp-field__input"
                    value={form.correct_answer}
                    onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
                  >
                    {['A', 'B', 'C', 'D'].map((letter) => (
                      <option key={letter} value={letter}>{letter}</option>
                    ))}
                  </select>
                </label>
                <label className="mp-field">
                  <span className="mp-field__label">Difficulty</span>
                  <select
                    className="mp-field__input"
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </label>
                <label className="mp-field mp-field--check">
                  <span className="mp-field__label">Use in exam</span>
                  <label className="mp-check">
                    <input
                      type="checkbox"
                      checked={form.is_selected_for_exam}
                      onChange={(e) => setForm({ ...form, is_selected_for_exam: e.target.checked })}
                      disabled={!form.is_selected_for_exam && atSelectionLimit && !editing?.selected}
                    />
                    Select this question for the entrance exam
                    {atSelectionLimit && !form.is_selected_for_exam && !editing?.selected
                      ? ` (limit ${selectionLimit} reached)`
                      : ''}
                  </label>
                </label>
              </div>

              <div className="mp-modal__actions">
                <ManagementButton type="button" variant="secondary" onClick={closeForm} disabled={saving}>
                  Cancel
                </ManagementButton>
                <ManagementButton type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update question' : 'Save question'}
                </ManagementButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLimitForm && (
        <div className="mp-modal-overlay" role="presentation" onClick={() => !savingLimit && setShowLimitForm(false)}>
          <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="limit-form-title" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal__header">
              <div>
                <h2 id="limit-form-title" className="mp-modal__title">Edit selection limit</h2>
                <p className="mp-modal__subtitle">
                  {subject.name} has {formatNumber(subject.questions_count)} questions in the bank.
                </p>
              </div>
              <button type="button" className="mp-modal__close" onClick={() => setShowLimitForm(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <form className="mp-form" onSubmit={saveSelectionLimit}>
              <label className="mp-field">
                <span className="mp-field__label">How many questions can be selected for the exam?</span>
                <input
                  className="mp-field__input"
                  type="number"
                  min={0}
                  max={500}
                  value={limitValue}
                  onChange={(e) => setLimitValue(e.target.value)}
                  required
                />
                <span className="mp-field__hint">
                  If you lower the limit below the current selection, extras are automatically deselected.
                </span>
              </label>
              <div className="mp-modal__actions">
                <ManagementButton type="button" variant="secondary" onClick={() => setShowLimitForm(false)} disabled={savingLimit}>
                  Cancel
                </ManagementButton>
                <ManagementButton type="submit" variant="primary" disabled={savingLimit}>
                  {savingLimit ? 'Saving...' : 'Save limit'}
                </ManagementButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
