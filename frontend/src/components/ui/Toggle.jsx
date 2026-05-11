import { useState } from "react";

// iOS-style on/off switch. Works both controlled (pass `checked` + `onChange`)
// or uncontrolled (pass `defaultChecked`).

export function Toggle({ label, defaultChecked, checked, onChange }) {
  const [internal, setInternal] = useState(!!defaultChecked);
  const isControlled = checked !== undefined;
  const on = isControlled ? checked : internal;
  const flip = () => {
    if (isControlled) onChange?.(!on);
    else {
      setInternal(!on);
      onChange?.(!on);
    }
  };
  return (
    <label className="flex items-center gap-2.5 cursor-pointer text-[13px]">
      <span
        onClick={flip}
        className="relative transition-colors"
        style={{ width: 32, height: 18, background: on ? "var(--accent)" : "var(--border-strong)" }}
      >
        <span
          className="absolute transition-all"
          style={{ top: 2, left: on ? 16 : 2, width: 14, height: 14, background: "#FFF" }}
        />
      </span>
      <span>{label}</span>
    </label>
  );
}
