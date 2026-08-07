import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Eye,
  Pencil,
  Power,
  PowerOff,
  Search,
  Trash2,
  Download,
  FolderInput,
} from 'lucide-react';
import { questionBankApi } from '../../api/questionBankApi';
import { ManagementButton, ManagementToolbar } from '../../components/management/ManagementToolbar';
import { StatusBadge } from '../../components/management/StatusBadge';
import { DataTable } from '../../components/management/DataTable';
import { Pagination } from '../../components/management/Pagination';
import { SkeletonTable } from '../../components/ui/Skeleton';
import { statusVariant } from './useTableState';
import {
  alertFromApiError,
  confirmAction,
  confirmDelete,
  showLoading,
  closeLoading,
  toastSuccess,
} from '../../utils/swal';
import '../../components/management/management.css';
import './management-pages.css';

function optionText(row, key) {
  return row[`option_${key.toLowerCase()}`] || '—';
}

export default function QuestionReviewPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [banks, setBanks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 25, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [busy, setBusy] = useState(false);
  const [viewRow, setViewRow] = useState(null);
  const [moveCategoryId, setMoveCategoryId] = useState('');

  const bankId = searchParams.get('bank') || '';
  const categoryId = searchParams.get('category') || '';
  const status = searchParams.get('status') || '';
  const search = searchParams.get('q') || '';
  const page = Number(searchParams.get('page') || 1);
  const activeOnly = searchParams.get('active') === '1';
  const panel = searchParams.get('panel') || 'all'; // all | active | selected

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === '' || value == null) next.delete(key);
    else next.set(key, String(value));
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const loadBanks = useCallback(async () => {
    try {
      const { data } = await questionBankApi.listBanks();
      setBanks(data.data || []);
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        per_page: 25,
        search: search || undefined,
        question_bank_id: bankId || undefined,
        exam_subject_id: categoryId || undefined,
        status: status || undefined,
        active_only: activeOnly || panel === 'active' ? 1 : undefined,
        selected_only: panel === 'selected' ? 1 : undefined,
        sort: 'id',
        dir: 'desc',
      };
      const { data } = await questionBankApi.reviewQuestions(params);
      setRows(data.data || []);
      setMeta(data.meta || { current_page: 1, last_page: 1, per_page: 25, total: 0 });
      setCategories(data.categories || []);
      setSelectedKeys([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load questions.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, bankId, categoryId, status, activeOnly, panel]);

  useEffect(() => {
    loadBanks();
  }, [loadBanks]);

  useEffect(() => {
    load();
  }, [load]);

  const columns = useMemo(
    () => [
      { key: 'id', label: '#', sortable: false },
      {
        key: 'category',
        label: 'Category',
        render: (row) => <span className="mgmt-badge mgmt-badge--info">{row.category}</span>,
      },
      {
        key: 'stem',
        label: 'Question',
        render: (row) => <span title={row.stem}>{row.stem?.length > 80 ? `${row.stem.slice(0, 80)}…` : row.stem}</span>,
      },
      { key: 'option_a', label: 'Option A', render: (row) => optionText(row, 'A') },
      { key: 'option_b', label: 'Option B', render: (row) => optionText(row, 'B') },
      { key: 'option_c', label: 'Option C', render: (row) => optionText(row, 'C') },
      { key: 'option_d', label: 'Option D', render: (row) => optionText(row, 'D') },
      { key: 'correct_answer', label: 'Correct', render: (row) => <strong>{row.correct_answer}</strong> },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <StatusBadge status={row.status} variant={statusVariant(row.status)} />,
      },
    ],
    [],
  );

  const runBulk = async (action) => {
    if (!selectedKeys.length) return;
    const labels = {
      activate: 'activate',
      deactivate: 'deactivate',
      delete: 'delete',
      move_category: 'move',
      export: 'export',
    };
    if (action !== 'export') {
      const ok = action === 'delete'
        ? await confirmDelete({
            text: `Delete ${selectedKeys.length} question(s)? This action cannot be undone.`,
          })
        : await confirmAction({
            title: 'Are you sure?',
            text: `Confirm bulk ${labels[action]} for ${selectedKeys.length} question(s)?`,
          });
      if (!ok) return;
    }
    if (action === 'move_category' && !moveCategoryId) {
      setError('Select a target category to move questions.');
      return;
    }
    setBusy(true);
    setError('');
    setSuccess('');
    showLoading(action === 'export' ? 'Exporting Questions...' : 'Processing...');
    try {
      const { data } = await questionBankApi.bulkQuestions({
        ids: selectedKeys,
        action,
        exam_subject_id: action === 'move_category' ? Number(moveCategoryId) : undefined,
      });
      closeLoading();
      if (action === 'export') {
        const blob = new Blob([JSON.stringify(data.data || [], null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `questions-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setSuccess(`Exported ${selectedKeys.length} question(s).`);
        await toastSuccess('Questions Exported Successfully');
      } else {
        setSuccess(data.message || 'Bulk action completed.');
        await toastSuccess(
          action === 'delete' ? 'Record Deleted Successfully' : (data.message || 'Bulk Action Completed Successfully')
        );
        await load();
      }
    } catch (err) {
      closeLoading();
      setError(err.response?.data?.message || 'Bulk action failed.');
      await alertFromApiError(err, 'Bulk action failed.');
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (row, nextStatus) => {
    const ok = await confirmAction({
      title: 'Are you sure?',
      text: `Set question #${row.id} to ${nextStatus}?`,
    });
    if (!ok) return;

    setBusy(true);
    try {
      await questionBankApi.updateQuestion(row.id, { status: nextStatus });
      setSuccess(`Question #${row.id} set to ${nextStatus}.`);
      await toastSuccess('Question Updated Successfully');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update status.');
      await alertFromApiError(err, 'Unable to update status.');
    } finally {
      setBusy(false);
    }
  };

  const removeOne = async (row) => {
    const ok = await confirmDelete();
    if (!ok) return;
    setBusy(true);
    showLoading('Deleting Question...');
    try {
      await questionBankApi.deleteQuestion(row.id);
      closeLoading();
      setSuccess(`Question #${row.id} deleted.`);
      await toastSuccess('Record Deleted Successfully');
      await load();
    } catch (err) {
      closeLoading();
      setError(err.response?.data?.message || 'Unable to delete.');
      await alertFromApiError(err, 'Unable to delete.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mp-page">
      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">Management</p>
          <h1 className="mp-header__title">
            {panel === 'active' ? 'Active Questions' : panel === 'selected' ? 'Exam Question Review' : 'Question Review Table'}
          </h1>
          <p className="mp-header__lede">
            Review, filter, and bulk-manage questions without opening them one by one.
          </p>
        </div>
        <ManagementToolbar>
          <ManagementButton as={Link} to="/management/question-bank" variant="secondary">
            Question Banks
          </ManagementButton>
          {bankId ? (
            <ManagementButton as={Link} to={`/management/question-bank/${bankId}/exam-preview`} variant="primary">
              Exam Preview
            </ManagementButton>
          ) : null}
        </ManagementToolbar>
      </header>

      <div className="mp-panel" style={{ marginBottom: 16 }}>
        <div className="mgmt-toolbar" style={{ flexWrap: 'wrap', gap: 10 }}>
          <button type="button" className={`mgmt-chip${panel === 'all' ? ' is-active' : ''}`} onClick={() => setParam('panel', '')}>
            All questions
          </button>
          <button type="button" className={`mgmt-chip${panel === 'active' ? ' is-active' : ''}`} onClick={() => setParam('panel', 'active')}>
            Active Questions
          </button>
          <button type="button" className={`mgmt-chip${panel === 'selected' ? ' is-active' : ''}`} onClick={() => setParam('panel', 'selected')}>
            Selected for exam
          </button>
        </div>
      </div>

      {error ? <div className="mp-alert mp-alert--error" role="alert">{error}</div> : null}
      {success ? <div className="mp-alert mp-alert--success" role="status">{success}</div> : null}

      <div className="mp-panel" style={{ marginBottom: 16 }}>
        <div className="mgmt-filters" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <label className="sp-form__label">
            Search
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <input
                className="mp-field__input"
                value={search}
                placeholder="Question, category…"
                onChange={(e) => setParam('q', e.target.value)}
              />
              <Search size={16} style={{ alignSelf: 'center', opacity: 0.5 }} />
            </div>
          </label>
          <label className="sp-form__label">
            Question bank
            <select className="mp-field__input" value={bankId} onChange={(e) => setParam('bank', e.target.value)} style={{ marginTop: 4 }}>
              <option value="">All banks</option>
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title || b.school_year}{b.is_active ? ' (active)' : ''}
                </option>
              ))}
            </select>
          </label>
          <label className="sp-form__label">
            Category
            <select className="mp-field__input" value={categoryId} onChange={(e) => setParam('category', e.target.value)} style={{ marginTop: 4 }}>
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.questions_count})
                </option>
              ))}
            </select>
          </label>
          <label className="sp-form__label">
            Status
            <select className="mp-field__input" value={status} onChange={(e) => setParam('status', e.target.value)} style={{ marginTop: 4 }}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </label>
        </div>
      </div>

      {selectedKeys.length > 0 ? (
        <div className="mp-panel" style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <strong>{selectedKeys.length} selected</strong>
          <ManagementButton type="button" size="sm" variant="primary" disabled={busy} onClick={() => runBulk('activate')}>
            <Power size={14} /> Activate
          </ManagementButton>
          <ManagementButton type="button" size="sm" variant="secondary" disabled={busy} onClick={() => runBulk('deactivate')}>
            <PowerOff size={14} /> Deactivate
          </ManagementButton>
          <ManagementButton type="button" size="sm" variant="secondary" disabled={busy} onClick={() => runBulk('delete')}>
            <Trash2 size={14} /> Delete
          </ManagementButton>
          <ManagementButton type="button" size="sm" variant="secondary" disabled={busy} onClick={() => runBulk('export')}>
            <Download size={14} /> Export
          </ManagementButton>
          <select className="mp-field__input" style={{ maxWidth: 220 }} value={moveCategoryId} onChange={(e) => setMoveCategoryId(e.target.value)}>
            <option value="">Move to category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ManagementButton type="button" size="sm" variant="secondary" disabled={busy || !moveCategoryId} onClick={() => runBulk('move_category')}>
            <FolderInput size={14} /> Move
          </ManagementButton>
        </div>
      ) : null}

      <div className="mp-panel">
        {loading ? (
          <SkeletonTable rows={8} cols={6} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={rows}
              selectable
              selectedKeys={selectedKeys}
              onSelectionChange={setSelectedKeys}
              emptyTitle="No questions found"
              emptyDescription="Adjust filters or add questions in the question bank."
              renderActions={(row) => (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <ManagementButton type="button" size="sm" variant="secondary" onClick={() => setViewRow(row)}>
                    <Eye size={14} /> View
                  </ManagementButton>
                  {row.question_bank_id && row.exam_subject_id ? (
                    <ManagementButton
                      as={Link}
                      size="sm"
                      variant="secondary"
                      to={`/management/question-bank/${row.question_bank_id}/subjects/${row.exam_subject_id}`}
                    >
                      <Pencil size={14} /> Edit
                    </ManagementButton>
                  ) : null}
                  {row.status !== 'active' ? (
                    <ManagementButton type="button" size="sm" variant="primary" disabled={busy} onClick={() => setStatus(row, 'active')}>
                      <CheckCircle2 size={14} /> Activate
                    </ManagementButton>
                  ) : (
                    <ManagementButton type="button" size="sm" variant="secondary" disabled={busy} onClick={() => setStatus(row, 'archived')}>
                      Deactivate
                    </ManagementButton>
                  )}
                  <ManagementButton type="button" size="sm" variant="secondary" disabled={busy} onClick={() => removeOne(row)}>
                    <Trash2 size={14} />
                  </ManagementButton>
                </div>
              )}
            />
            <Pagination
              page={meta.current_page}
              pageSize={meta.per_page}
              total={meta.total}
              onPageChange={(p) => setParam('page', p)}
            />
          </>
        )}
      </div>

      {viewRow ? (
        <div className="mp-modal-overlay" role="presentation" onClick={() => setViewRow(null)}>
          <div className="mp-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="mp-modal__header">
              <h2 className="mp-modal__title">Question #{viewRow.id}</h2>
              <button type="button" className="mp-modal__close" onClick={() => setViewRow(null)} aria-label="Close">×</button>
            </div>
            <p><span className="mgmt-badge mgmt-badge--info">{viewRow.category}</span></p>
            <p style={{ fontWeight: 600, marginTop: 12 }}>{viewRow.stem}</p>
            <ul style={{ marginTop: 12, lineHeight: 1.7 }}>
              <li>A. {viewRow.option_a}</li>
              <li>B. {viewRow.option_b}</li>
              <li>C. {viewRow.option_c}</li>
              <li>D. {viewRow.option_d}</li>
            </ul>
            <p>Correct: <strong>{viewRow.correct_answer}</strong> · Difficulty: {viewRow.difficulty || '—'} · Status: {viewRow.status}</p>
            <div className="mp-modal__actions">
              <ManagementButton type="button" variant="secondary" onClick={() => setViewRow(null)}>Close</ManagementButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
