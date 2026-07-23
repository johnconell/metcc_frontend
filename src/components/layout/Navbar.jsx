import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

export function Navbar() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    window.location.replace('/');
  };

  return (
    <header className="border-b bg-white px-6 py-3">
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="text-lg font-bold text-indigo-600">Auth CRUD Starter</Link>
        <div className="flex items-center gap-4">
          {user && (
            <>
              <div className="flex items-center gap-2">
                <Avatar src={user.profile_photo_url} name={user.name} size="sm" />
                <span className="text-sm text-gray-700">{user.name}</span>
              </div>
              <Button variant="outline" onClick={handleLogout}>Logout</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
