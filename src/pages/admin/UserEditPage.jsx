import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { userApi } from '../../api/userApi';
import { roleApi } from '../../api/roleApi';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { USER_STATUSES } from '../../utils/constants';

export default function UserEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', role_id: '', status: 'active', phone: '', address: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    roleApi.list().then(({ data }) => setRoles(data.data));
    userApi.get(id).then(({ data }) => {
      const u = data.data;
      setForm({ name: u.name, email: u.email, role_id: u.role?.id || '', status: u.status, phone: u.phone || '', address: u.address || '', password: '' });
    });
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      await userApi.update(id, payload);
      navigate('/admin/users');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Edit User</h1>
      <Alert type="error" message={error} />
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Select label="Role" value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })}>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </Select>
        <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          {USER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <Input label="New Password (optional)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <div className="flex gap-2">
          <Button type="submit">Save</Button>
          <Link to="/admin/users"><Button variant="outline" type="button">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
