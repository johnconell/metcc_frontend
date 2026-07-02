export function Spinner({ className = '' }) {
  return (
    <div className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent ${className}`} />
  );
}
