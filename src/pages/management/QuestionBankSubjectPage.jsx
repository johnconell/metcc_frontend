import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Folder, FolderPlus, Loader2, Plus, X } from 'lucide-react';
import { questionBankApi } from '../../api/questionBankApi';
import { ManagementButton } from '../../components/management/ManagementToolbar';
import { StatusBadge } from '../../components/management/StatusBadge';
import { statusVariant } from './useTableState';
import '../../components/management/management.css';
import './management-pages.css';

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

export default function QuestionBankSubjectPage() {
  const { subjectId } = useParams();
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ name: '', description: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await questionBankApi.getSubject(subjectId);
      setSubject(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load subject.');
      setSubject(null);
    } finally {
      setLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    load();
  }, [load]);

  const openForm = () => {
    setForm({ name: '', description: '' });
    setFormError('');
    setShowForm(true);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError('Folder name is required.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await questionBankApi.createBank(subjectId, {
        name: form.name.trim(),
        description: form.description.trim() || null,
      });
      setShowForm(false);
      setSuccess('Question bank folder created.');
      await load();
    } catch (err) {
      const first = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : null;
      setFormError(first || err.response?.data?.message || 'Unable to create question bank.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !subject) {
    return (
      <div className="mp-page">
        <div className="mp-loading">
          <Loader2 size={18} className="mp-loading__icon" />
          Loading subject...
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

  const banks = subject.banks || [];

  return (
    <div className="mp-page">
      <Link to="/management/question-bank" className="mp-link-back">
        <ArrowLeft size={16} /> Back to Question Bank
      </Link>

      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">Subject · {subject.code || 'ENTRANCE'}</p>
          <h1 className="mp-header__title">{subject.name}</h1>
          <p className="mp-header__lede">
            {subject.description || 'Create question bank folders for this subject, then add and select exam questions.'}
          </p>
        </div>
        <div className="mp-header__actions">
          <ManagementButton variant="primary" onClick={openForm}>
            <FolderPlus size={16} aria-hidden="true" /> Create Question Bank
          </ManagementButton>
        </div>
      </header>

      <div className="mp-stats">
        <div className="mp-stats__item">
          <div className="mp-stats__value">{formatNumber(banks.length)}</div>
          <div className="mp-stats__label">Question banks</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{formatNumber(subject.questions_count)}</div>
          <div className="mp-stats__label">Questions</div>
        </div>
        <div className="mp-stats__item">
          <div className="mp-stats__value">{formatNumber(subject.selected_questions_count)}</div>
          <div className="mp-stats__label">Selected for exam</div>
        </div>
      </div>

      {success && <div className="mp-alert mp-alert--success" role="status">{success}</div>}
      {error && <div className="mp-alert mp-alert--error" role="alert">{error}</div>}

      <section className="mp-panel">
        <div className="mp-panel__head">
          <div>
            <h2 className="mp-panel__title"><Folder size={16} /> Question bank folders</h2>
            <p className="mp-panel__hint">
              Each folder holds as many questions as you need. Open a folder to add questions and mark which ones are used in the exam.
            </p>
          </div>
          <ManagementButton variant="secondary" size="sm" onClick={openForm}>
            <Plus size={14} aria-hidden="true" /> New folder
          </ManagementButton>
        </div>

        <div className="mp-bank-grid">
          {banks.length === 0 ? (
            <p className="mp-panel__hint">No folders yet. Create a question bank to start adding questions.</p>
          ) : banks.map((bank) => (
            <Link
              key={bank.id}
              to={`/management/question-bank/subjects/${subject.id}/banks/${bank.id}`}
              className="mp-bank-card"
            >
              <div className="mp-bank-card__icon" aria-hidden="true">
                <Folder size={22} />
              </div>
              <div className="mp-bank-card__body">
                <h3 className="mp-bank-card__title">{bank.name}</h3>
                <p className="mp-bank-card__desc">{bank.description || 'Question bank folder'}</p>
                <div className="mp-bank-card__meta">
                  <span>{formatNumber(bank.questions_count)} questions</span>
                  <span>{formatNumber(bank.selected_questions_count)} selected</span>
                  <StatusBadge variant={statusVariant(bank.status)}>{bank.status}</StatusBadge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {showForm && (
        <div className="mp-modal-overlay" role="presentation" onClick={() => !saving && setShowForm(false)}>
          <div className="mp-modal" role="dialog" aria-modal="true" aria-labelledby="bank-form-title" onClick={(e) => e.stopPropagation()}>
            <div className="mp-modal__header">
              <div>
                <h2 id="bank-form-title" className="mp-modal__title">Create question bank</h2>
                <p className="mp-modal__subtitle">Add a folder under {subject.name} for grouping questions.</p>
              </div>
              <button type="button" className="mp-modal__close" onClick={() => setShowForm(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {formError && <div className="mp-alert mp-alert--error" role="alert">{formError}</div>}
            <form className="mp-form" onSubmit={submit}>
              <label className="mp-field">
                <span className="mp-field__label">Folder name</span>
                <input
                  className="mp-field__input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Algebra Set A"
                  required
                />
              </label>
              <label className="mp-field">
                <span className="mp-field__label">Description</span>
                <textarea
                  className="mp-field__input mp-field__textarea"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional notes about this question bank"
                />
              </label>
              <div className="mp-modal__actions">
                <ManagementButton type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>
                  Cancel
                </ManagementButton>
                <ManagementButton type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Create folder'}
                </ManagementButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
