// Generic table — column defs carry their own `render(row)` so cells can hold
// anything (badges, menus, progress). Optional `onRow` makes rows clickable.

export function Table({ columns, rows, onRow }) {
  return (
    <div className="overflow-auto border border-border bg-surface">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="bg-surface-2 border-b border-border">
            {columns.map((c, i) => (
              <th
                key={i}
                className="font-medium text-[11px] uppercase text-muted whitespace-nowrap"
                style={{ textAlign: c.align || "left", padding: "10px 14px", letterSpacing: "0.04em" }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              onClick={() => onRow && onRow(row)}
              className="border-b border-border"
              style={{ cursor: onRow ? "pointer" : "default" }}
            >
              {columns.map((c, i) => (
                <td
                  key={i}
                  style={{
                    padding: "12px 14px",
                    textAlign: c.align || "left",
                    verticalAlign: "middle",
                    whiteSpace: c.nowrap ? "nowrap" : "normal",
                  }}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
