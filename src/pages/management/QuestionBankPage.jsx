import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  FolderOpen,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { questionBankApi } from '../../api/questionBankApi';
import { ManagementButton } from '../../components/management/ManagementToolbar';
import { SkeletonCardGrid, SkeletonPageHeader, SkeletonStats } from '../../components/ui/Skeleton';
import {
  alertFromApiError,
  confirmAction,
  confirmDelete,
  toastError,
  toastSuccess,
} from '../../utils/swal';
import '../../components/management/management.css';
import './management-pages.css';

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

const EMPTY_FORM = { school_year: '', title: '' };

export default function QuestionBankPage() {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await questionBankApi.listBanks();
      setBanks(data.data || []);
    } catch (err) {
      await alertFromApiError(err, 'Unable to load question banks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totals = useMemo(() => ({
    banks: banks.length,
    subjects: banks.reduce((sum, item) => sum + (item.subjects_count || 0), 0),
    questions: banks.reduce((sum, item) => sum + (item.questions_count || 0), 0),
    active: banks.find((item) => item.is_active)?.school_year || '—',
  }), [banks]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowForm(true);
  };

  const openEdit = (bank, event) => {
    event.preventDefault();
    event.stopPropagation();
    setEditing(bank);
    setForm({
      school_year: bank.school_year || '',
      title: bank.title || '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleActivate = async (bank, event) => {
    event.preventDefault();
    event.stopPropagation();
    if (bank.is_active) return;

    const ok = await confirmAction({
      title: 'Set active question bank?',
      text: `"${bank.title}" will become the examination question set.`,
      confirmText: 'Set Active',
      icon: 'question',
    });
    if (!ok) return;

    setBusyId(bank.id);
    try {
      const { data } = await questionBankApi.activateBank(bank.id);
      await toastSuccess(data.message || 'Question bank activated.');
      await load();
    } catch (err) {
      await alertFromApiError(err, 'Unable to activate question bank.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (bank, event) => {
    event.preventDefault();
    event.stopPropagation();
    const ok = await confirmDelete({
      text: `Delete "${bank.title}" and all of its categories and questions? This action cannot be undone.`,
    });
    if (!ok) return;

    try {
      await questionBankApi.deleteBank(bank.id);
      await toastSuccess('Record Deleted Successfully');
      await load();
    } catch (err) {
      await alertFromApiError(err, 'Unable to delete question bank.');
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!form.school_year.trim()) {
      setFormError('School year is required.');
      return;
    }
    const ok = await confirmAction({
      title: 'Are you sure?',
      text: editing ? 'Update this question bank?' : 'Create this question bank?',
    });
    if (!ok) return;

    setSaving(true);
    setFormError('');
    try {
      const payload = {
        school_year: form.school_year.trim(),
        title: form.title.trim() || null,
      };
      if (editing) {
        await questionBankApi.updateBank(editing.id, payload);
        await toastSuccess('Question Bank Updated Successfully');
      } else {
        await questionBankApi.createBank(payload);
        await toastSuccess('Question Bank Created Successfully');
      }
      setShowForm(false);
      await load();
    } catch (err) {
      const first = err.response?.data?.errors
        ? Object.values(err.response.data.errors).flat()[0]
        : null;
      const message = first || err.response?.data?.message || 'Unable to save question bank.';
      setFormError(message);
      await toastError('Unable to save', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mp-page">
      {loading ? (
        <>
          <SkeletonPageHeader />
          <SkeletonStats count={4} />
          <SkeletonCardGrid count={6} />
        </>
      ) : (
        <>
          <header className="mp-header">
            <div>
              <p className="mp-header__eyebrow">Management</p>
              <h1 className="mp-header__title">Question Bank</h1>
              <p className="mp-header__lede">
                Question Bank → Categories → Questions. Create a school-year bank, add categories, then import or write questions.
              </p>
            </div>
            <div className="mp-header__actions">
              <ManagementButton variant="primary" onClick={openCreate}>
                <Plus size={16} aria-hidden="true" /> Add Question Bank
              </ManagementButton>
            </div>
          </header>

          <div className="mp-stats" aria-label="Question bank summary">
            <div className="mp-stats__item">
              <div className="mp-stats__value">{formatNumber(totals.banks)}</div>
              <div className="mp-stats__label">Question Banks</div>
            </div>
            <div className="mp-stats__item">
              <div className="mp-stats__value mp-stats__value--active">{totals.active}</div>
              <div className="mp-stats__label">Active Bank</div>
            </div>
            <div className="mp-stats__item">
              <div className="mp-stats__value">{formatNumber(totals.subjects)}</div>
              <div className="mp-stats__label">Categories</div>
            </div>
            <div className="mp-stats__item">
              <div className="mp-stats__value">{formatNumber(totals.questions)}</div>
              <div className="mp-stats__label">Total Questions</div>
            </div>
          </div>

          <section aria-label="Question banks list">
            <div className="mp-cat-grid">
              {banks.length === 0 ? (
                <p className="mp-panel__hint">No question banks yet. Create a school-year bank to begin.</p>
              ) : banks.map((bank) => (
                <Link
                  key={bank.id}
                  to={`/management/question-bank/${bank.id}`}
                  className={`mp-cat-card mp-cat-card--link${bank.is_active ? ' mp-cat-card--active' : ''}`}
                >
                  <div className="mp-cat-card__top">
                    <FolderOpen size={18} aria-hidden="true" />
                    {bank.is_active && (
                      <span className="mp-active-badge">
                        <CheckCircle2 size={14} aria-hidden="true" />
                        Active
                      </span>
                    )}
                    <span className="mp-cat-card__code">{bank.school_year}</span>
                  </div>
                  <h2 className="mp-cat-card__subject">{bank.title}</h2>
                  <p className="mp-cat-card__desc">
                    {formatNumber(bank.subjects_count)} Categories
                    <br />
                    {formatNumber(bank.questions_count)} Questions
                  </p>
                  <div className="mp-cat-card__meta">
                    {bank.is_active ? 'Currently used for examinations' : 'Open bank to manage categories →'}
                  </div>
                  <div className="mp-cat-card__actions" onClick={(e) => e.preventDefault()}>
                    <ManagementButton
                      type="button"
                      variant={bank.is_active ? 'primary' : 'secondary'}
                      size="sm"
                      disabled={busyId === bank.id || bank.is_active}
                      onClick={(e) => handleActivate(bank, e)}
                    >
                      <CheckCircle2 size={14} aria-hidden="true" />
                      {bank.is_active ? 'Active' : busyId === bank.id ? 'Activating...' : 'Set Active'}
                    </ManagementButton>
                    <ManagementButton type="button" variant="tertiary" size="sm" onClick={(e) => openEdit(bank, e)}>
                      <Pencil size={14} aria-hidden="true" /> Edit
                    </ManagementButton>
                    <ManagementButton type="button" variant="tertiary" size="sm" onClick={(e) => handleDelete(bank, e)}>
                      <Trash2 size={14} aria-hidden="true" /> Delete
                    </ManagementButton>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}

      {showForm && (
        <div className="mp-modal-overlay" role="presentation" onClick={() => !saving && setShowForm(false)}>
          <div
            className="mp-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bank-form-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mp-modal__header">
              <div>
                <h2 id="bank-form-title" className="mp-modal__title">
                  {editing ? 'Edit Question Bank' : 'Add Question Bank'}
                </h2>
                <p className="mp-modal__subtitle">
                  Create a school-year examination question bank (e.g. 2027).
                </p>
              </div>
              <button type="button" className="mp-modal__close" onClick={() => setShowForm(false)} aria-label="Close">
                <X size={18} />
              </button>
            </div>
            {formError && <div className="mp-alert mp-alert--error" role="alert">{formError}</div>}
            <form className="mp-form" onSubmit={submit}>
              <label className="mp-field">
                <span className="mp-field__label">School year</span>
                <input
                  className="mp-field__input"
                  value={form.school_year}
                  onChange={(e) => setForm({ ...form, school_year: e.target.value })}
                  placeholder="e.g. 2027"
                  required
                />
              </label>
              <label className="mp-field">
                <span className="mp-field__label">Title (optional)</span>
                <input
                  className="mp-field__input"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Auto: 2027 Examination Question Bank"
                />
              </label>
              <div className="mp-modal__actions">
                <ManagementButton type="button" variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>
                  Cancel
                </ManagementButton>
                <ManagementButton type="submit" variant="primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Save changes' : 'Create Question Bank'}
                </ManagementButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}