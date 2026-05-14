// Floating theme switcher — bottom-right. Replaces the prototype's host-driven
// Tweaks panel with a self-contained control: toggle button + palette list.

import { useState } from "react";
import { THEMES, THEME_KEYS } from "../lib/themes.js";

export function ThemePicker({ theme, setTheme }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-4 bottom-4 z-[2147483646]" style={{ width: open ? 280 : "auto" }}>
      {open ? (
        <div
          className="flex flex-col overflow-hidden"
          style={{
            background: "rgba(250,249,247,0.92)",
            WebkitBackdropFilter: "blur(24px) saturate(160%)",
            backdropFilter: "blur(24px) saturate(160%)",
            border: "0.5px solid rgba(255,255,255,0.6)",
            borderRadius: 14,
            boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset, 0 12px 40px rgba(0,0,0,0.18)",
            color: "#29261b",
          }}
        >
          <div className="flex items-center justify-between" style={{ padding: "10px 8px 10px 14px" }}>
            <b className="text-xs font-semibold">Tema visual</b>
            <button
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="border-0 bg-transparent cursor-pointer text-[13px]"
              style={{ width: 22, height: 22, borderRadius: 6, color: "rgba(41,38,27,0.55)" }}
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col gap-1.5" style={{ padding: "2px 14px 14px" }}>
            {THEME_KEYS.map((k) => {
              const th = THEMES[k];
              const sel = theme === k;
              return (
                <button
                  key={k}
                  onClick={() => setTheme(k)}
                  className="grid items-center text-left cursor-pointer"
                  style={{
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 10,
                    padding: "8px 10px",
                    border: `1px solid ${sel ? th.vars["--ink"] : "#D6D5D1"}`,
                    background: sel ? "rgba(0,0,0,0.04)" : "#fff",
                  }}
                >
                  <div className="flex">
                    {th.swatches.map((c, i) => (
                      <span
                        key={i}
                        style={{
                          width: 14,
                          height: 18,
                          background: c,
                          border: "1px solid rgba(0,0,0,0.08)",
                          marginLeft: i > 0 ? -4 : 0,
                        }}
                      />
                    ))}
                  </div>
                  <div>
                    <div className="text-xs font-semibold" style={{ color: "#15140F" }}>
                      {th.label}
                    </div>
                    <div className="text-[10px]" style={{ color: "#7A766C", marginTop: 1 }}>
                      {th.desc}
                    </div>
                  </div>
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      border: `1.5px solid ${sel ? th.vars["--ink"] : "#A8A39A"}`,
                      background: sel ? th.vars["--ink"] : "transparent",
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          aria-label="Cambiar tema"
          className="flex items-center justify-center cursor-pointer"
          style={{
            width: 40,
            height: 40,
            background: "rgba(250,249,247,0.92)",
            WebkitBackdropFilter: "blur(24px) saturate(160%)",
            backdropFilter: "blur(24px) saturate(160%)",
            border: "0.5px solid rgba(255,255,255,0.6)",
            borderRadius: 12,
            boxShadow: "0 1px 0 rgba(255,255,255,0.5) inset, 0 12px 40px rgba(0,0,0,0.18)",
          }}
        >
          <div className="flex">
            {THEMES[theme].swatches.map((c, i) => (
              <span
                key={i}
                style={{
                  width: 9,
                  height: 14,
                  background: c,
                  border: "1px solid rgba(0,0,0,0.08)",
                  marginLeft: i > 0 ? -3 : 0,
                }}
              />
            ))}
          </div>
        </button>
      )}
    </div>
  );
}
