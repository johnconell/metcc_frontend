import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { userApi } from '../../api/userApi';
import { Avatar } from '../../components/ui/Avatar';
import { formatDate } from '../../utils/formatDate';
import { Button } from '../../components/ui/Button';

export default function UserDetailPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    userApi.get(id).then(({ data }) => setUser(data.data));
  }, [id]);

  if (!user) return <p>Loading...</p>;

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-2xl font-bold">User Details</h1>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-4">
          <Avatar src={user.profile_photo_url} name={user.name} size="lg" />
          <div>
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>
        </div>
        <dl className="space-y-2 text-sm">
          <div><dt className="font-medium">Role</dt><dd>{user.role?.name}</dd></div>
          <div><dt className="font-medium">Status</dt><dd>{user.status}</dd></div>
          <div><dt className="font-medium">Phone</dt><dd>{user.phone || '-'}</dd></div>
          <div><dt className="font-medium">Address</dt><dd>{user.address || '-'}</dd></div>
          <div><dt className="font-medium">Created</dt><dd>{formatDate(user.created_at)}</dd></div>
          <div><dt className="font-medium">Updated</dt><dd>{formatDate(user.updated_at)}</dd></div>
        </dl>
        <Link to={`/admin/users/${id}/edit`} className="mt-4 inline-block"><Button>Edit User</Button></Link>
      </div>
    </div>
  );
}
