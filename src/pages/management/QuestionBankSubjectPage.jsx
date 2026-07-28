import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { questionBankApi } from '../../api/questionBankApi';
import { ManagementButton } from '../../components/management/ManagementToolbar';
import '../../components/management/management.css';
import './management-pages.css';

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

const EMPTY_FORM = { name: '', code: '', description: '', selection_limit: 5 };

export default function QuestionBankSubjectPage() {
  const { bankId } = useParams();
  const [bank, setBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);

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

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (subject, event) => {
    event.preventDefault();
    event.stopPropagation();
    setEditing(subject);
    setForm({
      name: subject.name || '',
      code: subject.code || '',
      description: subject.description || '',
      selection_limit: subject.selection_limit ?? 5,
    });
    setFormError('');
    setShowForm(true);
  };

  const handleDelete = async (subject, event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm(`Delete subject "${subject.name}" and all of its questions?`)) {
      return;
    }
    try {
      await questionBankApi.deleteSubject(subject.id);
      setSuccess('Subject deleted.');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to delete subject.');
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError('Subject name is required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || null,
        description: form.description.trim() || null,
        selection_limit: Math.max(0, Number(form.selection_limit) || 0),
      };
      if (editing) {
        await questionBankApi.updateSubject(editing.id, payload);
        setSuccess('Subject updated.');
      } else {
        await questionBankApi.createSubject(bankId, payload);
        setSuccess('Subject added.');
      }
      setShowForm(false);
      await load();
    } catch (err) {
      const first = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : null;
      setFormError(first || err.response?.data?.message || 'Unable to save subject.');
    } finally {
      setSaving(false);
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
            Add subjects under this examination question bank, then open a subject to manage its questions.
          </p>
        </div>
        <div className="mp-header__actions">
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
          <div className="mp-stats__label">Subjects</div>
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

      <section className="mp-panel">
        <div className="mp-panel__head">
          <div>
            <h2 className="mp-panel__title"><BookOpen size={16} /> Subjects</h2>
            <p className="mp-panel__hint">
              Each subject holds the questions used for that area of the entrance exam.
            </p>
          </div>
          <ManagementButton variant="secondary" size="sm" onClick={openCreate}>
            <Plus size={14} aria-hidden="true" /> Add Subject
          </ManagementButton>
        </div>

        <div className="mp-cat-grid">
          {subjects.length === 0 ? (
            <p className="mp-panel__hint">No subjects yet. Add a subject to start writing questions.</p>
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
              <p className="mp-cat-card__desc">{subject.description || 'Entrance exam subject'}</p>
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

      {showForm && (
        <div className="mp-modal-overlay" role="presentation" onClick={() => !saving && setShowForm(false)}>
          <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="subject-form-title" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal__header">
              <div>
                <h2 id="subject-form-title" className="mp-modal__title">
                  {editing ? 'Edit subject' : 'Add subject'}
                </h2>
                <p className="mp-modal__subtitle">Subject under {bank.title}</p>
              </div>
              <button type="button" className="mp-modal__close" onClick={() => setShowForm(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {formError && <div className="mp-alert mp-alert--error" role="alert">{formError}</div>}
            <form className="mp-form" onSubmit={submit}>
              <label className="mp-field">
                <span className="mp-field__label">Subject name</span>
                <input
                  className="mp-field__input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Mathematics"
                  required
                />
              </label>
              <label className="mp-field">
                <span className="mp-field__label">Code (optional)</span>
                <input
                  className="mp-field__input"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. MATH"
                />
              </label>
              <label className="mp-field">
                <span className="mp-field__label">Description</span>
                <textarea
                  className="mp-field__input mp-field__textarea"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What this subject covers"
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
                  How many questions from this subject can be selected for the exam (e.g. 5 of 20).
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
