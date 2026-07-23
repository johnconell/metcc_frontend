import { useMemo, useState } from 'react';

export function useTableState(rows, { searchKeys = [], pageSize = 5, filterFn } = {}) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [selectedKeys, setSelectedKeys] = useState([]);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  const processed = useMemo(() => {
    let result = [...rows];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((row) =>
        searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(q)),
      );
    }

    if (filterFn) {
      result = result.filter(filterFn);
    }

    if (sortKey) {
      result.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [rows, search, searchKeys, sortKey, sortDir, filterFn]);

  const total = processed.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginated = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return processed.slice(start, start + pageSize);
  }, [processed, safePage, pageSize]);

  const setSearchValue = (value) => {
    setSearch(value);
    setPage(1);
  };

  return {
    search,
    setSearch: setSearchValue,
    sortKey,
    sortDir,
    onSort: handleSort,
    page: safePage,
    setPage,
    pageSize,
    total,
    rows: paginated,
    allRows: processed,
    selectedKeys,
    setSelectedKeys,
  };
}

export function statusVariant(status) {
  const value = String(status).toLowerCase();
  if (['active', 'scheduled', 'published', 'available', 'ongoing', 'completed', 'passed', 'present', 'confirmed'].includes(value)) {
    return 'success';
  }
  if (['inactive', 'archived', 'deactivated', 'unavailable', 'failed', 'absent', 'cancelled'].includes(value)) {
    return 'error';
  }
  if (['pending', 'draft', 'registered'].includes(value)) {
    return 'muted';
  }
  return 'default';
}
