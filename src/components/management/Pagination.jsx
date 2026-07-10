import { ChevronLeft, ChevronRight } from 'lucide-react';
import './management.css';

export function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  if (totalPages <= 1 && total <= pageSize) {
    return (
      <div className="mgmt-pagination">
        <span className="mgmt-pagination__info">
          Showing {start} to {end} of {total} entries
        </span>
      </div>
    );
  }

  const pages = [];
  const maxVisible = 5;
  let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);
  startPage = Math.max(1, endPage - maxVisible + 1);

  for (let i = startPage; i <= endPage; i += 1) {
    pages.push(i);
  }

  return (
    <nav className="mgmt-pagination" aria-label="Pagination">
      <span className="mgmt-pagination__info">
        Showing {start} to {end} of {total} entries
      </span>
      <div className="mgmt-pagination__controls">
        <button
          type="button"
          className="mgmt-pagination__btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            className={`mgmt-pagination__btn${p === page ? ' mgmt-pagination__btn--active' : ''}`}
            onClick={() => onPageChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          className="mgmt-pagination__btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </nav>
  );
}
