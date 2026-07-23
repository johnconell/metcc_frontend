import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckSquare,
  Loader2,
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
  const { subjectId, bankId } = useParams();
  const [bank, setBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [busyId, setBusyId] = useState(null);

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

  const questions = useMemo(() => (bank?.questions || []).map((item) => ({
    id: item.id,
    stem: item.stem,
    difficulty: item.difficulty,
    status: item.status,
    correct: item.correct_answer,
    selected: item.is_selected_for_exam,
    optionsLabel: (item.options || []).map((opt) => `${opt.key}. ${opt.text}`).join(' · '),
    raw: item,
  })), [bank]);

  const table = useTableState(questions, {
    searchKeys: ['stem', 'difficulty', 'status', 'correct', 'optionsLabel'],
    pageSize: 8,
  });

  const openForm = () => {
    setForm(EMPTY_FORM);
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

    setSaving(true);
    setFormError('');
    try {
      await questionBankApi.createQuestion(bankId, {
        stem: form.stem.trim(),
        options,
        correct_answer: form.correct_answer,
        difficulty: form.difficulty,
        status: form.is_selected_for_exam ? 'active' : 'draft',
        is_selected_for_exam: form.is_selected_for_exam,
      });
      setShowForm(false);
      setSuccess('Question added to this bank.');
      await load();
    } catch (err) {
      const first = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : null;
      setFormError(first || err.response?.data?.message || 'Unable to add question.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSelection = async (question) => {
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
          <div className="mp-table__sub">{row.optionsLabel}</div>
        </div>
      ),
    },
    {
      key: 'correct',
      label: 'Answer',
      sortable: true,
      render: (row) => <strong>{row.correct}</strong>,
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
          disabled={busyId === row.id}
          onClick={() => toggleSelection(row)}
        >
          {row.selected ? <CheckSquare size={14} /> : <Square size={14} />}
          {row.selected ? 'Selected' : 'Select'}
        </ManagementButton>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
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
      ),
    },
  ];

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
        <Link to={`/management/question-bank/subjects/${subjectId}`} className="mp-link-back">
          <ArrowLeft size={16} /> Back to subject
        </Link>
      </div>
    );
  }

  return (
    <div className="mp-page">
      <Link to={`/management/question-bank/subjects/${subjectId}`} className="mp-link-back">
        <ArrowLeft size={16} /> Back to {bank.subject?.name || 'subject'}
      </Link>

      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">{bank.subject?.name} · Question Bank</p>
          <h1 className="mp-header__title">{bank.name}</h1>
          <p className="mp-header__lede">
            {bank.description || 'Add as many questions as you need, then select which ones will be used in the entrance exam.'}
          </p>
        </div>
        <div className="mp-header__actions">
          <ManagementButton variant="primary" onClick={openForm}>
            <Plus size={16} aria-hidden="true" /> Add Question
          </ManagementButton>
        </div>
      </header>

      <div className="mp-stats">
        <div className="mp-stats__item">
          <div className="mp-stats__value">{formatNumber(bank.questions_count)}</div>
          <div className="mp-stats__label">Questions in folder</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{formatNumber(bank.selected_questions_count)}</div>
          <div className="mp-stats__label">Selected for exam</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{formatNumber((bank.questions_count || 0) - (bank.selected_questions_count || 0))}</div>
          <div className="mp-stats__label">Not selected</div>
        </div>
      </div>

      {success && <div className="mp-alert mp-alert--success" role="status">{success}</div>}
      {error && <div className="mp-alert mp-alert--error" role="alert">{error}</div>}

      <section className="mp-panel">
        <div className="mp-panel__head">
          <div>
            <h2 className="mp-panel__title">Questions</h2>
            <p className="mp-panel__hint">
              Toggle <strong>Select</strong> to include a question in the entrance exam set for this subject.
            </p>
          </div>
        </div>

        <ManagementToolbar
          searchId="bank-questions-search"
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
              emptyDescription="Add your first question to this bank folder."
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
        <div className="mp-modal-overlay" role="presentation" onClick={() => !saving && setShowForm(false)}>
          <div className="mp-modal mp-question-modal" role="dialog" aria-modal="true" aria-labelledby="question-form-title" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal__header">
              <div>
                <h2 id="question-form-title" className="mp-modal__title">Add question</h2>
                <p className="mp-modal__subtitle">Multiple choice question for {bank.name}.</p>
              </div>
              <button type="button" className="mp-modal__close" onClick={() => setShowForm(false)} aria-label="Close">
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
                    />
                    Select this question for the entrance exam
                  </label>
                </label>
              </div>

              <div className="mp-modal__actions">
                <ManagementButton type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>
                  Cancel
                </ManagementButton>
                <ManagementButton type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save question'}
                </ManagementButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
