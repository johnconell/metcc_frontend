import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { ADMIN_ROLES } from '../../utils/constants';
import { Spinner } from '../../components/ui/Spinner';

const UNAUTHORIZED_MESSAGE =
  'This Google account is not authorized to access the METCC Admin Portal.';

function parseBootstrapUser(encoded) {
  if (!encoded) return null;
  try {
    const normalized = decodeURIComponent(encoded).replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const user = JSON.parse(atob(padded));
    return user && typeof user === 'object' ? user : null;
  } catch {
    return null;
  }
}

function goToDashboard() {
  // Hard navigation avoids React Strict Mode cancelling soft navigate()
  // after the token is already saved.
  window.location.replace('/dashboard');
}

export default function GoogleCallbackPage() {
  const [params] = useSearchParams();
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Completing Google login...');

  useEffect(() => {
    let active = true;

    async function completeGoogleLogin() {
      const error = params.get('error');
      if (error) {
        navigate('/login', {
          replace: true,
          state: { error: decodeURIComponent(error) },
        });
        return;
      }

      const token = params.get('token');
      if (!token) {
        navigate('/login', {
          replace: true,
          state: { error: UNAUTHORIZED_MESSAGE },
        });
        return;
      }

      // Prevent double-processing the same token in React Strict Mode.
      const guardKey = `metcc_google_callback:${token.slice(0, 24)}`;
      const existing = sessionStorage.getItem(guardKey);
      if (existing === 'done') {
        goToDashboard();
        return;
      }
      if (existing === 'pending') {
        return;
      }
      sessionStorage.setItem(guardKey, 'pending');

      try {
        const bootstrapUser = parseBootstrapUser(params.get('user'));
        const user = await setToken(token, bootstrapUser);

        if (!ADMIN_ROLES.includes(user?.role?.slug)) {
          sessionStorage.removeItem(guardKey);
          navigate('/login', {
            replace: true,
            state: { error: UNAUTHORIZED_MESSAGE },
          });
          return;
        }

        sessionStorage.setItem(guardKey, 'done');
        goToDashboard();
      } catch {
        sessionStorage.removeItem(guardKey);
        if (!active) return;
        setStatus('Google login failed.');
        navigate('/login', {
          replace: true,
          state: { error: UNAUTHORIZED_MESSAGE },
        });
      }
    }

    completeGoogleLogin();

    return () => {
      active = false;
    };
  }, [params, setToken, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner />
      <span className="ml-2">{status}</span>
    </div>
  );
}
