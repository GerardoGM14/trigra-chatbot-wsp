// Form field wrapper — label on top, optional hint/error below.

export function Field({ label, hint, error, children, style }) {
  return (
    <label className="block" style={style}>
      {label && (
        <div className="text-[11px] font-medium uppercase text-muted mb-1.5" style={{ letterSpacing: "0.04em" }}>
          {label}
        </div>
      )}
      {children}
      {hint && <div className="text-[11px] text-muted mt-1.5">{hint}</div>}
      {error && <div className="text-[11px] text-danger mt-1.5">{error}</div>}
    </label>
  );
}
