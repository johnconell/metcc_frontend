export function Avatar({ src, name, size = 'md' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-16 w-16 text-lg' };
  const initials = name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?';
  if (src) {
    return <img src={src} alt={name} className={`rounded-full object-cover ${sizes[size]}`} />;
  }
  return (
    <div className={`flex items-center justify-center rounded-full bg-indigo-100 font-medium text-indigo-700 ${sizes[size]}`}>
      {initials}
    </div>
  );
}
