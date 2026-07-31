import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Search, Shuffle } from 'lucide-react';
import { questionBankApi } from '../../api/questionBankApi';
import { ManagementButton, ManagementToolbar } from '../../components/management/ManagementToolbar';
import { StatusBadge } from '../../components/management/StatusBadge';
import { statusVariant } from './useTableState';
import '../../components/management/management.css';
import './management-pages.css';

function normalizeOptions(q) {
  if (Array.isArray(q.options) && q.options.length) {
    return q.options.map((opt) =>
      typeof opt === 'object'
        ? { key: opt.key || opt.label, text: opt.text || opt.value || '' }
        : { key: '?', text: String(opt) },
    );
  }
  return ['A', 'B', 'C', 'D'].map((key) => ({
    key,
    text: q[`option_${key.toLowerCase()}`] || '',
  })).filter((o) => o.text);
}

export default function ExamPreviewPage() {
  const { bankId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await questionBankApi.examPreview(bankId);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load exam preview.');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [bankId]);

  useEffect(() => {
    load();
  }, [load]);

  const allQuestions = useMemo(() => {
    const groups = data?.categories || [];
    return groups.flatMap((g) =>
      (g.questions || []).map((q) => ({
        ...q,
        category: q.category || g.category,
        options: normalizeOptions(q),
        correct: q.correct_answer,
      })),
    );
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allQuestions.filter((row) => {
      if (categoryFilter && row.category !== categoryFilter) return false;
      if (!q) return true;
      const hay = [
        row.stem,
        row.category,
        row.correct,
        row.difficulty,
        ...(row.options || []).map((o) => o.text),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [allQuestions, search, categoryFilter]);

  const categories = data?.category_breakdown || [];
  const selectionLimitHint = data?.total_selected ?? 0;

  return (
    <div className="mp-page">
      <header className="mp-header">
        <div>
          <p className="mp-header__eyebrow">Question Bank</p>
          <h1 className="mp-header__title">Review Exam</h1>
          <p className="mp-header__lede">
            Review every selected question before the examination goes live.
          </p>
        </div>
        <ManagementToolbar>
          <ManagementButton as={Link} to={`/management/question-bank/${bankId}`} variant="secondary">
            <ArrowLeft size={16} /> Categories
          </ManagementButton>
          <ManagementButton as={Link} to="/system/settings" variant="secondary">
            <Shuffle size={16} /> Randomization
          </ManagementButton>
        </ManagementToolbar>
      </header>

      {error ? <div className="mp-alert mp-alert--error" role="alert">{error}</div> : null}

      {loading ? (
        <div className="mp-loading">
          <Loader2 size={18} className="mp-loading__icon" /> Loading questions…
        </div>
      ) : data ? (
        <section className="mp-panel">
          <div className="mp-panel__header-row" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
            <div>
              <h2 className="mp-panel__title">Questions</h2>
              <p className="mp-panel__hint" style={{ margin: 0 }}>
                {selectionLimitHint} question{selectionLimitHint === 1 ? '' : 's'} selected for the exam
                {categories.length ? (
                  <>
                    {' · '}
                    {categories.map((c) => `${c.category} ${c.count}`).join(' · ')}
                  </>
                ) : null}
                . Change category limits from each category page.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
            <label className="mgmt-search" style={{ flex: '1 1 240px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', opacity: 0.45 }} />
              <input
                className="mp-field__input"
                style={{ paddingLeft: 36 }}
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <select
              className="mp-field__input"
              style={{ maxWidth: 220 }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.category} value={c.category}>
                  {c.category} ({c.count})
                </option>
              ))}
            </select>
          </div>

          {!filtered.length ? (
            <p className="mp-panel__hint">
              {allQuestions.length
                ? 'No questions match your search.'
                : 'No questions are selected for the exam yet. Select questions from each category.'}
            </p>
          ) : (
            <div className="mgmt-table-wrap">
              <table className="mgmt-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Answer</th>
                    <th>Difficulty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id}>
                      <td>
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
                        {row.category ? (
                          <div style={{ marginTop: 6 }}>
                            <span className="mgmt-badge mgmt-badge--info">{row.category}</span>
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <span className="mp-correct-answer" title="Correct answer">
                          {row.correct}
                        </span>
                      </td>
                      <td>
                        <StatusBadge variant="default">{row.difficulty || '—'}</StatusBadge>
                      </td>
                      <td>
                        <StatusBadge variant={statusVariant(row.status || 'active')}>
                          {row.status || 'active'}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
