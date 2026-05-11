// Native <select> reskinned to match Input's flat look. Caller supplies <option>.

export function Select(props) {
  return (
    <select
      {...props}
      className="w-full text-[13px] text-ink"
      style={{
        padding: "8px 10px",
        border: "1px solid var(--border-strong)",
        background: "var(--surface)",
        fontFamily: "inherit",
        appearance: "none",
        ...props.style,
      }}
    />
  );
}
