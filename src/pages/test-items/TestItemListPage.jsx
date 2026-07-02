import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { testItemApi } from '../../api/testItemApi';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { Alert } from '../../components/ui/Alert';
import { formatDate } from '../../utils/formatDate';
import { TEST_ITEM_STATUSES } from '../../utils/constants';

export default function TestItemListPage() {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ search: '', status: '', page: 1 });
  const [error, setError] = useState('');

  const load = () => {
    testItemApi.list(filters).then(({ data }) => {
      setItems(data.data);
      setMeta(data.meta);
    }).catch((err) => setError(err.response?.data?.message || 'Failed to load.'));
  };

  useEffect(() => { load(); }, [filters]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    await testItemApi.delete(id);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Test Items</h1>
        <Link to="/test-items/create"><Button>Create Item</Button></Link>
      </div>
      <Alert type="error" message={error} />
      <div className="mb-4 grid gap-4 md:grid-cols-3">
        <Input placeholder="Search..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} />
        <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
          <option value="">All Statuses</option>
          {TEST_ITEM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created By</th>
              <th className="p-3">Created</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-3">{item.title}</td>
                <td className="p-3">{item.status}</td>
                <td className="p-3">{item.created_by?.name || '-'}</td>
                <td className="p-3">{formatDate(item.created_at)}</td>
                <td className="p-3 space-x-2">
                  <Link to={`/test-items/${item.id}`} className="text-indigo-600 hover:underline">View</Link>
                  <Link to={`/test-items/${item.id}/edit`} className="text-indigo-600 hover:underline">Edit</Link>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination meta={meta} onPageChange={(page) => setFilters({ ...filters, page })} />
    </div>
  );
}
