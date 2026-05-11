// Bordered card with an optional header (title + subtitle + action slot).

export function Panel({ title, subtitle, action, children, padding = 20, style }) {
  return (
    <section className="bg-surface border border-border" style={style}>
      {(title || action) && (
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div>
            {title && <h3 className="m-0 text-sm font-semibold" style={{ letterSpacing: "-0.01em" }}>{title}</h3>}
            {subtitle && <div className="text-xs text-muted mt-0.5">{subtitle}</div>}
          </div>
          {action}
        </header>
      )}
      <div style={{ padding }}>{children}</div>
    </section>
  );
}
