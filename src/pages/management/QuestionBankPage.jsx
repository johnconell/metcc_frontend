import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FolderPlus, Loader2, Plus, X } from 'lucide-react';
import { questionBankApi } from '../../api/questionBankApi';
import { ManagementButton } from '../../components/management/ManagementToolbar';
import '../../components/management/management.css';
import './management-pages.css';

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

export default function QuestionBankPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ name: '', code: '', description: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await questionBankApi.listSubjects();
      setSubjects(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load question bank subjects.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => ({
    subjects: subjects.length,
    banks: subjects.reduce((sum, item) => sum + (item.banks_count || 0), 0),
    questions: subjects.reduce((sum, item) => sum + (item.questions_count || 0), 0),
    selected: subjects.reduce((sum, item) => sum + (item.selected_questions_count || 0), 0),
  }), [subjects]);

  const openForm = () => {
    setForm({ name: '', code: '', description: '' });
    setFormError('');
    setShowForm(true);
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
      await questionBankApi.createSubject({
        name: form.name.trim(),
        code: form.code.trim() || null,
        description: form.description.trim() || null,
      });
      setShowForm(false);
      setSuccess('Subject added to Question Bank.');
      await load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Unable to create subject.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mp-page">
      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">Management</p>
          <h1 className="mp-header__title">Question Bank</h1>
          <p className="mp-header__lede">
            Organize entrance exam subjects, create question bank folders, add questions,
            and select which items will be used in the exam.
          </p>
        </div>
        <div className="mp-header__actions">
          <ManagementButton variant="primary" onClick={openForm}>
            <Plus size={16} aria-hidden="true" /> Add Subject
          </ManagementButton>
        </div>
      </header>

      <div className="mp-stats" aria-label="Subject summary">
        <div className="mp-stats__item">
          <div className="mp-stats__value">{formatNumber(totals.subjects)}</div>
          <div className="mp-stats__label">Subjects</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{formatNumber(totals.banks)}</div>
          <div className="mp-stats__label">Question banks</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{formatNumber(totals.questions)}</div>
          <div className="mp-stats__label">Total questions</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{formatNumber(totals.selected)}</div>
          <div className="mp-stats__label">Selected for exam</div>
        </div>
      </div>

      {success && <div className="mp-alert mp-alert--success" role="status">{success}</div>}
      {error && <div className="mp-alert mp-alert--error" role="alert">{error}</div>}

      {loading ? (
        <div className="mp-loading">
          <Loader2 size={18} className="mp-loading__icon" />
          Loading subjects...
        </div>
      ) : (
        <section aria-label="Subjects list">
          <div className="mp-cat-grid">
            {subjects.length === 0 ? (
              <p className="mp-panel__hint">No subjects yet. Create one to start building question banks.</p>
            ) : subjects.map((subject) => (
              <Link
                key={subject.id}
                to={`/management/question-bank/subjects/${subject.id}`}
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
                  {formatNumber(subject.banks_count)} banks · {formatNumber(subject.selected_questions_count)} selected
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {showForm && (
        <div className="mp-modal-overlay" role="presentation" onClick={() => !saving && setShowForm(false)}>
          <div
            className="mp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="subject-form-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mp-modal__header">
              <div>
                <h2 id="subject-form-title" className="mp-modal__title">Add subject</h2>
                <p className="mp-modal__subtitle">Create a subject area for the entrance examination.</p>
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
                  placeholder="What this subject covers in the entrance exam"
                />
              </label>
              <div className="mp-modal__actions">
                <ManagementButton type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>
                  Cancel
                </ManagementButton>
                <ManagementButton type="submit" variant="primary" disabled={saving}>
                  <FolderPlus size={16} aria-hidden="true" />
                  {saving ? 'Saving...' : 'Create subject'}
                </ManagementButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
