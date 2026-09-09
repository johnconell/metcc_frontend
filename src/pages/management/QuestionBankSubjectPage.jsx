import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Layers,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { questionBankApi } from '../../api/questionBankApi';
import { ManagementButton } from '../../components/management/ManagementToolbar';
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
];

const EMPTY_FORM = {
  categoryKey: '',
  customName: '',
  description: '',
  selection_limit: 5,
};

export default function QuestionBankSubjectPage() {
  const { bankId } = useParams();
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

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, categoryKey: '' });
    setFormError('');
    setShowForm(true);
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
    if (key === '__new__') {
      const name = form.customName.trim();
      if (!name) return { error: 'Enter a name for the new category.' };
      return {
        name,
        code: codeFromName(name) || null,
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

  const submit = async (event) => {
    event.preventDefault();
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
            Manage exam categories for this bank. Open a category to add or import questions.
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
          <ManagementButton variant="primary" onClick={openCreate}>
            <Plus size={16} aria-hidden="true" /> Add Category
          </ManagementButton>
        </div>
      </header>

      <div className="mp-stats">
        <div className="mp-stats__item">
          <span className="mp-stats__icon" aria-hidden="true">
            <Layers size={18} />
          </span>
          <div className="mp-stats__value">{formatNumber(subjects.length)}</div>
          <div className="mp-stats__label">Categories</div>
        </div>
        <div className="mp-stats__item">
          <span className="mp-stats__icon" aria-hidden="true">
            <BookOpen size={18} />
          </span>
          <div className="mp-stats__value">{formatNumber(bank.questions_count)}</div>
          <div className="mp-stats__label">Questions</div>
        </div>
        <div className="mp-stats__item">
          <span className="mp-stats__icon" aria-hidden="true">
            <CheckCircle2 size={18} />
          </span>
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
            </p>
          </div>
        </div>

        <div className="mp-info-grid">
          {subjects.length === 0 ? (
            <p className="mp-panel__hint">No categories yet. Add Mathematics, Science, Verbal Ability, or create your own.</p>
          ) : subjects.map((subject) => (
            <article key={subject.id} className="mp-info-card">
              <Link
                to={`/management/question-bank/${bank.id}/subjects/${subject.id}`}
                className="mp-info-card__click"
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="mp-info-card__header">
                  <span className="mp-info-card__icon mp-info-card__icon--maroon" aria-hidden="true">
                    <BookOpen size={18} />
                  </span>
                  <div className="mp-info-card__identity">
                    <h3 className="mp-info-card__title">{subject.name}</h3>
                    <p className="mp-info-card__subtitle">{subject.description || 'Entrance exam category'}</p>
                  </div>
                  <span className="mp-info-card__badge">
                    <span className="mp-cat-card__code">{subject.code || 'SUB'}</span>
                  </span>
                </div>

                <div className="mp-info-card__section">
                  <div className="mp-info-card__row">
                    <BookOpen className="mp-info-card__row-icon" size={15} aria-hidden="true" />
                    <span className="mp-info-card__row-label">Questions:</span>
                    <span className="mp-info-card__row-value">{formatNumber(subject.questions_count)}</span>
                  </div>
                  <div className="mp-info-card__row">
                    <CheckCircle2 className="mp-info-card__row-icon" size={15} aria-hidden="true" />
                    <span className="mp-info-card__row-label">Selected:</span>
                    <span className="mp-info-card__row-value">
                      {formatNumber(subject.selected_questions_count)} / {formatNumber(subject.selection_limit ?? 5)}
                    </span>
                  </div>
                  <div className="mp-info-card__row">
                    <Layers className="mp-info-card__row-icon" size={15} aria-hidden="true" />
                    <span className="mp-info-card__row-label">Code:</span>
                    <span className="mp-info-card__row-value">{subject.code || 'SUB'}</span>
                  </div>
                </div>
              </Link>

              <div className="mp-info-card__actions" onClick={(e) => e.preventDefault()}>
                <div className="mp-info-card__actions-row">
                  <ManagementButton type="button" variant="tertiary" size="sm" onClick={(e) => openEdit(subject, e)}>
                    <Pencil size={14} aria-hidden="true" /> Edit
                  </ManagementButton>
                  <ManagementButton type="button" variant="tertiary" size="sm" onClick={(e) => handleDelete(subject, e)}>
                    <Trash2 size={14} aria-hidden="true" /> Delete
                  </ManagementButton>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {showForm && (
        <div className="mp-modal-overlay" role="presentation" onClick={() => !saving && setShowForm(false)}>
          <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="subject-form-title" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal__header">
              <div>
                <h2 id="subject-form-title" className="mp-modal__title">
                  {editing ? 'Edit category' : 'Add category'}
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
                  {saving ? 'Saving...' : editing ? 'Save changes' : 'Create category'}
                </ManagementButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
