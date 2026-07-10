import { useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { EmptyState } from './EmptyState';
import './management.css';

export function DataTable({
  columns,
  rows,
  rowKey = 'id',
  sortKey,
  sortDir = 'asc',
  onSort,
  renderActions,
  emptyTitle = 'No records found',
  emptyDescription,
  emptyIcon,
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
}) {
  const allSelected = rows.length > 0 && rows.every((row) => selectedKeys.includes(row[rowKey]));

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(rows.map((row) => row[rowKey]));
    }
  };

  const handleSelectRow = (id) => {
    if (!onSelectionChange) return;
    if (selectedKeys.includes(id)) {
      onSelectionChange(selectedKeys.filter((k) => k !== id));
    } else {
      onSelectionChange([...selectedKeys, id]);
    }
  };

  const visibleColumns = useMemo(
    () => columns.filter((col) => col.key !== 'actions'),
    [columns],
  );

  if (rows.length === 0) {
    return <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />;
  }

  const renderSortIcon = (key) => {
    if (sortKey !== key) {
      return <ArrowUpDown size={14} className="mgmt-table__sort-icon" aria-hidden="true" />;
    }
    const Icon = sortDir === 'asc' ? ArrowUp : ArrowDown;
    return <Icon size={14} className="mgmt-table__sort-icon mgmt-table__sort-icon--active" aria-hidden="true" />;
  };

  return (
    <>
      <div className="mgmt-table-wrap">
        <table className="mgmt-table">
          <thead>
            <tr>
              {selectable && (
                <th scope="col">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={col.sortable ? 'mgmt-table__sortable' : undefined}
                  onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                  onKeyDown={
                    col.sortable && onSort
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSort(col.key);
                          }
                        }
                      : undefined
                  }
                  tabIndex={col.sortable && onSort ? 0 : undefined}
                  aria-sort={
                    col.sortable && sortKey === col.key
                      ? sortDir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : col.sortable
                        ? 'none'
                        : undefined
                  }
                >
                  {col.label}
                  {col.sortable && renderSortIcon(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row[rowKey]}>
                {selectable && (
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedKeys.includes(row[rowKey])}
                      onChange={() => handleSelectRow(row[rowKey])}
                      aria-label={`Select row ${row[rowKey]}`}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mgmt-table-cards" aria-label="Mobile table view">
        {rows.map((row) => (
          <article key={row[rowKey]} className="mgmt-table-card">
            {selectable && (
              <div className="mgmt-table-card__row">
                <span className="mgmt-table-card__label">Select</span>
                <span className="mgmt-table-card__value">
                  <input
                    type="checkbox"
                    checked={selectedKeys.includes(row[rowKey])}
                    onChange={() => handleSelectRow(row[rowKey])}
                    aria-label={`Select row ${row[rowKey]}`}
                  />
                </span>
              </div>
            )}
            {visibleColumns.map((col) => (
              <div key={col.key} className="mgmt-table-card__row">
                <span className="mgmt-table-card__label">{col.label}</span>
                <span className="mgmt-table-card__value">
                  {col.render ? col.render(row) : row[col.key]}
                </span>
              </div>
            ))}
            {renderActions && (
              <div className="mgmt-table-card__actions">{renderActions(row)}</div>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
