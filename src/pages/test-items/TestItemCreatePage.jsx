import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { testItemApi } from '../../api/testItemApi';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { TEST_ITEM_STATUSES } from '../../utils/constants';

export default function TestItemCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', status: 'draft' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await testItemApi.create(form);
      navigate('/test-items');
    } catch (err) {
      setError(err.response?.data?.message || 'Create failed.');
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">Create Test Item</h1>
      <Alert type="error" message={error} />
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          {TEST_ITEM_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Button type="submit">Create</Button>
      </form>
    </div>
  );
}
