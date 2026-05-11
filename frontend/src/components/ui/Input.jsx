import { useState } from "react";

export function Input({ value, onChange, placeholder, icon, type = "text", style }) {
  const [focus, setFocus] = useState(false);
  return (
    <div
      className="relative flex items-center bg-surface h-9"
      style={{ border: `1px solid ${focus ? "var(--ink)" : "var(--border-strong)"}`, ...style }}
    >
      {icon && <span className="pl-2.5 text-muted flex">{icon}</span>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        className="flex-1 border-none outline-none px-3 bg-transparent text-[13px] h-full"
      />
    </div>
  );
}
