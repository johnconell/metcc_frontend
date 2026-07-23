import { Navigate } from 'react-router-dom';

/** Change password lives in Profile Settings — keep this route for bookmarks. */
export default function ChangePasswordPage() {
  return <Navigate to="/profile" replace />;
}
