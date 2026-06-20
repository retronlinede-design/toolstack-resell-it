export function Input({ label, className = "", ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-stone-600">{label}</span>
      <input {...props} className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none transition-all duration-150 placeholder:text-stone-400 focus:border-orange-300 focus:ring-2 focus:ring-orange-100/70" />
    </label>
  );
}

export function Select({ label, className = "", children, ...props }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs font-semibold text-stone-600">{label}</span>
      <select {...props} className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-900 outline-none transition-all duration-150 focus:border-orange-300 focus:ring-2 focus:ring-orange-100/70">
        {children}
      </select>
    </label>
  );
}
