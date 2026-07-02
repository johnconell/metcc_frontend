import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { profileApi } from '../../api/profileApi';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../auth/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Avatar } from '../../components/ui/Avatar';

export default function ProfileSettingsPage() {
  const { user, fetchUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '', phone: user.phone || '', address: user.address || '' });
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await profileApi.update(form);
      await fetchUser();
      setMessage('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await profileApi.uploadPhoto(file);
      await fetchUser();
      setMessage('Photo uploaded.');
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed.');
    }
  };

  const handleRemovePhoto = async () => {
    await profileApi.removePhoto();
    await fetchUser();
    setMessage('Photo removed.');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account?')) return;
    try {
      await authApi.deleteAccount({ password: deletePassword });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Profile Settings</h1>
      <Alert type="success" message={message} onClose={() => setMessage('')} />
      <Alert type="error" message={error} onClose={() => setError('')} />

      <div className="mb-6 flex items-center gap-4">
        <Avatar src={user?.profile_photo_url} name={user?.name} size="lg" />
        <div>
          <input type="file" accept="image/*" onChange={handlePhoto} className="text-sm" />
          {user?.profile_photo_url && (
            <Button variant="outline" className="mt-2" onClick={handleRemovePhoto}>Remove Photo</Button>
          )}
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <Button type="submit">Save Changes</Button>
      </form>

      <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-6">
        <h2 className="font-semibold text-red-800">Delete Account</h2>
        <Input label="Confirm Password" type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="mt-2" />
        <Button variant="danger" className="mt-2" onClick={handleDeleteAccount}>Delete My Account</Button>
      </div>
    </div>
  );
}
