import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../api/userApi';
import { roleApi } from '../../api/roleApi';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';

export default function UserCreatePage() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role_id: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    roleApi.list().then(({ data }) => setRoles(data.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await userApi.create(form);
      navigate('/admin/users');
    } catch (err) {
      setError(err.response?.data?.message || 'Create failed.');
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Create User</h1>
      <Alert type="error" message={error} />
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <Select label="Role" value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })} required>
          <option value="">Select role</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </Select>
        <p className="text-sm text-gray-500">New accounts are activated automatically.</p>
        <Button type="submit">Create User</Button>
      </form>
    </div>
  );
}
