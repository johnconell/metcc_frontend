import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { checkApiHealth } from '../../services/apiHealth';
import { testItemApi } from '../../api/testItemApi';
import { Avatar } from '../../components/ui/Avatar';
import { Spinner } from '../../components/ui/Spinner';

export default function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const [apiOnline, setApiOnline] = useState(null);
  const [itemCount, setItemCount] = useState(null);

  useEffect(() => {
    checkApiHealth().then(setApiOnline);
    testItemApi.list({ per_page: 1 }).then(({ data }) => setItemCount(data.meta?.total ?? 0)).catch(() => setItemCount(0));
  }, []);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Welcome, {user?.name}!</h1>
      <p className="mb-6 text-gray-600">You are logged in as <strong>{user?.role?.name}</strong></p>

      <div className="mb-8 flex items-center gap-4 rounded-xl bg-white p-6 shadow-sm">
        <Avatar src={user?.profile_photo_url} name={user?.name} size="lg" />
        <div>
          <p className="font-medium">{user?.email}</p>
          <p className="text-sm text-gray-500">Status: {user?.status}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="font-semibold">API Status</h3>
          <p className="mt-2 text-sm">
            {apiOnline === null ? <Spinner className="h-4 w-4" /> : apiOnline ? (
              <span className="text-green-600">Connected</span>
            ) : (
              <span className="text-red-600">Offline</span>
            )}
          </p>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="font-semibold">Test Items</h3>
          <p className="mt-2 text-2xl font-bold">{itemCount ?? '-'}</p>
          <Link to="/test-items" className="text-sm text-indigo-600 hover:underline">Manage items</Link>
        </div>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="font-semibold">Quick Links</h3>
          <ul className="mt-2 space-y-1 text-sm">
            <li><Link to="/profile" className="text-indigo-600 hover:underline">Profile Settings</Link></li>
            <li><Link to="/test-items/create" className="text-indigo-600 hover:underline">Create Test Item</Link></li>
            {isAdmin && <li><Link to="/admin/users" className="text-indigo-600 hover:underline">User Management</Link></li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
