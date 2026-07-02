import { useState } from 'react';
import { authApi } from '../../api/authApi';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await authApi.changePassword(form);
      setMessage(data.message);
      setForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Change password failed.');
    }
  };

  return (
    <div className="max-w-md">
      <h1 className="mb-6 text-2xl font-bold">Change Password</h1>
      <Alert type="success" message={message} />
      <Alert type="error" message={error} />
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <Input label="Current Password" type="password" value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} required />
        <Input label="New Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <Input label="Confirm Password" type="password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} required />
        <Button type="submit">Update Password</Button>
      </form>
    </div>
  );
}
