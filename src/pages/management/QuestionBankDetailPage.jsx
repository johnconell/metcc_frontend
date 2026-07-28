import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckSquare,
  Loader2,
  Pencil,
  Plus,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { questionBankApi } from '../../api/questionBankApi';
import { ManagementButton, ManagementToolbar } from '../../components/management/ManagementToolbar';
import { StatusBadge } from '../../components/management/StatusBadge';
import { DataTable } from '../../components/management/DataTable';
import { Pagination } from '../../components/management/Pagination';
import { useTableState, statusVariant } from './useTableState';
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

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

export default function QuestionBankDetailPage() {
  const { bankId, subjectId } = useParams();
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [busyId, setBusyId] = useState(null);
  const [showLimitForm, setShowLimitForm] = useState(false);
  const [limitValue, setLimitValue] = useState(5);
  const [savingLimit, setSavingLimit] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await questionBankApi.getSubject(subjectId);
      setSubject(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load subject questions.');
      setSubject(null);
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

  const table = useTableState(questions, {
    searchKeys: ['stem', 'difficulty', 'status', 'correct', 'optionsLabel'],
    pageSize: 8,
  });

  const selectionLimit = subject?.selection_limit ?? 5;
  const selectedCount = subject?.selected_questions_count ?? 0;
  const atSelectionLimit = selectedCount >= selectionLimit;

  const openLimitForm = () => {
    setLimitValue(selectionLimit);
    setShowLimitForm(true);
  };

  const saveSelectionLimit = async (event) => {
    event.preventDefault();
    const nextLimit = Math.max(0, Number(limitValue) || 0);
    setSavingLimit(true);
    setError('');
    try {
      const { data } = await questionBankApi.updateSubject(subjectId, { selection_limit: nextLimit });
      setSubject((prev) => ({
        ...prev,
        ...data.data,
        question_bank: prev?.question_bank,
        questions: prev?.questions,
      }));
      setShowLimitForm(false);
      setSuccess(`Selection limit updated to ${nextLimit}.`);
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update selection limit.');
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
      return;
    }
    if (options.length < 2) {
      setFormError('Add at least two answer options.');
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
        await questionBankApi.updateQuestion(editing.id, payload);
        setSuccess('Question updated.');
      } else {
        await questionBankApi.createQuestion(subjectId, payload);
        setSuccess('Question added.');
      }
      setShowForm(false);
      setEditing(null);
      await load();
    } catch (err) {
      const first = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : null;
      setFormError(first || err.response?.data?.message || (editing ? 'Unable to update question.' : 'Unable to add question.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleSelection = async (question) => {
    if (!question.selected && atSelectionLimit) {
      setError(`Selection limit reached (${selectionLimit}). Increase the limit or deselect another question.`);
      return;
    }
    setBusyId(question.id);
    setError('');
    try {
      const { data } = await questionBankApi.toggleSelection(question.id);
      setSuccess(data.message || 'Selection updated.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update exam selection.');
    } finally {
      setBusyId(null);
    }
  };

  const removeQuestion = async (question) => {
    if (!window.confirm('Delete this question?')) return;
    setBusyId(question.id);
    try {
      await questionBankApi.deleteQuestion(question.id);
      setSuccess('Question deleted.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete question.');
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
        <div className="mp-loading">
          <Loader2 size={18} className="mp-loading__icon" />
          Loading questions...
        </div>
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
            {subject.description || 'Add questions and select which ones will be used in the entrance exam.'}
          </p>
        </div>
        <div className="mp-header__actions">
          <ManagementButton variant="secondary" onClick={openLimitForm}>
            <Pencil size={16} aria-hidden="true" /> Edit selection limit
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

      {success && <div className="mp-alert mp-alert--success" role="status">{success}</div>}
      {error && <div className="mp-alert mp-alert--error" role="alert">{error}</div>}

      <section className="mp-panel">
        <div className="mp-panel__head">
          <div>
            <h2 className="mp-panel__title">Questions</h2>
            <p className="mp-panel__hint">
              You can select up to <strong>{selectionLimit}</strong> questions for the exam.
              Change the limit anytime with <strong>Edit selection limit</strong>.
            </p>
          </div>
        </div>

        <ManagementToolbar
          searchId="subject-questions-search"
          searchValue={table.search}
          onSearchChange={table.setSearch}
          searchPlaceholder="Search questions..."
        />

        {loading ? (
          <div className="mp-loading mp-loading--compact">
            <Loader2 size={18} className="mp-loading__icon" />
            Loading questions...
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={table.rows}
              rowKey="id"
              sortKey={table.sortKey}
              sortDir={table.sortDir}
              onSort={table.onSort}
              emptyTitle="No questions yet"
              emptyDescription="Add your first question to this subject."
            />
            <Pagination
              page={table.page}
              pageSize={table.pageSize}
              total={table.total}
              onPageChange={table.setPage}
            />
          </>
        )}
      </section>

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
                  Example: bank has 20 questions — set 5 to allow only 5 selected, or change to 10 later.
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
