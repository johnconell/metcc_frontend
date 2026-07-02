import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { Spinner } from '../../components/ui/Spinner';

export default function GoogleCallbackPage() {
  const [params] = useSearchParams();
  const { setToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get('token');
    if (token) {
      setToken(token).then(() => navigate('/dashboard'));
    } else {
      navigate('/login');
    }
  }, [params, setToken, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner />
      <span className="ml-2">Completing Google login...</span>
    </div>
  );
}
