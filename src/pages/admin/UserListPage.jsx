import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '../../api/userApi';
import { roleApi } from '../../api/roleApi';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { Alert } from '../../components/ui/Alert';
import { formatDate } from '../../utils/formatDate';
import { USER_STATUSES } from '../../utils/constants';

export default function UserListPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ search: '', role: '', status: '', page: 1 });
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await userApi.list(filters);
      setUsers(data.data);
      setMeta(data.meta);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    }
  };

  useEffect(() => {
    roleApi.list().then(({ data }) => setRoles(data.data)).catch(() => {});
    load();
  }, [filters]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    await userApi.delete(id);
    load();
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Link to="/admin/users/create"><Button>Create User</Button></Link>
      </div>
      <Alert type="error" message={error} />
      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <Input placeholder="Search..." value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} />
        <Select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}>
          <option value="">All Roles</option>
          {roles.map((r) => <option key={r.id} value={r.slug}>{r.name}</option>)}
        </Select>
        <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
          <option value="">All Statuses</option>
          {USER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </div>
      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.role?.name}</td>
                <td className="p-3">{u.status}</td>
                <td className="p-3">{formatDate(u.created_at)}</td>
                <td className="p-3 space-x-2">
                  <Link to={`/admin/users/${u.id}`} className="text-indigo-600 hover:underline">View</Link>
                  <Link to={`/admin/users/${u.id}/edit`} className="text-indigo-600 hover:underline">Edit</Link>
                  <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:underline">Delete</button>
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
