export function Field({ label, hint, error, children, optional }) {
  return (
    <label className="block">
      <span className="label">
        {label}
        {optional && <span className="ml-1 font-normal text-slate-400">(optional)</span>}
      </span>
      {children}
      {error
        ? <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>
        : hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

// Read-only labelled value, used on the admin detail page
export function ReadField({ label, children }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-800">{children || "—"}</p>
    </div>
  );
}
