import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

export default function NotAuthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold text-gray-800">403</h1>
      <p className="mt-2 text-gray-600">You are not authorized to access this page.</p>
      <Link to="/dashboard" className="mt-4"><Button>Go to Dashboard</Button></Link>
    </div>
  );
}
