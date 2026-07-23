import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { AuthLayout } from '../../layouts/AuthLayout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { data } = await authApi.forgotPassword({ email });
      setMessage(
        data.message ||
          'If that email is registered, a password reset link has been sent to your Gmail inbox.',
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="mb-2 text-2xl font-bold">Forgot Password</h1>
      <p className="mb-6 text-sm text-gray-600">
        Enter the Gmail address linked to your admin account. We will email a secure reset link via Gmail SMTP.
      </p>
      <Alert type="error" message={error} />
      <Alert type="success" message={message} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Admin Gmail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link to="/login" className="text-indigo-600 hover:underline">Back to login</Link>
      </p>
    </AuthLayout>
  );
}
