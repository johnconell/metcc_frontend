import './AuthLayout.css';

export function AuthLayout({ children }) {
  return (
    <div className="auth-shell">
      <div className="auth-shell__card">{children}</div>
    </div>
  );
}
