import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { authApi } from '../../api/authApi';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Spinner } from '../../components/ui/Spinner';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="mb-6 text-2xl font-bold">Login</h1>
      <Alert type="error" message={error} onClose={() => setError('')} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Spinner className="h-4 w-4" /> : 'Login'}
        </Button>
      </form>
      <div className="mt-4 space-y-2 text-center text-sm">
        <Link to="/forgot-password" className="text-indigo-600 hover:underline">Forgot password?</Link>
        <p><Link to="/register" className="text-indigo-600 hover:underline">Create an account</Link></p>
        <a href={authApi.googleRedirect()} className="block text-indigo-600 hover:underline">Login with Google</a>
      </div>
    </AuthLayout>
  );
}
