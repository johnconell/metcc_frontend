import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { ADMIN_ROLES } from '../../utils/constants';
import { Spinner } from '../../components/ui/Spinner';

export default function GoogleCallbackPage() {
  const [params] = useSearchParams();
  const { setToken, logout } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Completing Google login...');

  useEffect(() => {
    let cancelled = false;

    async function completeGoogleLogin() {
      const token = params.get('token');
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const user = await setToken(token);
        if (!ADMIN_ROLES.includes(user?.role?.slug)) {
          await logout();
          if (!cancelled) {
            navigate('/login', {
              replace: true,
              state: {
                message: 'Admin access only. Proctor accounts use the mobile examination application.',
              },
            });
          }
          return;
        }

        if (!cancelled) navigate('/dashboard', { replace: true });
      } catch {
        await logout().catch(() => {});
        if (!cancelled) {
          setStatus('Google login failed.');
          navigate('/login', {
            replace: true,
            state: { message: 'Google authentication failed. Admin accounts only.' },
          });
        }
      }
    }

    completeGoogleLogin();

    return () => {
      cancelled = true;
    };
  }, [params, setToken, logout, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner />
      <span className="ml-2">{status}</span>
    </div>
  );
}
