import { useState } from "react";
import { I } from "../Icons.jsx";
import { Overlay } from "./Overlay.jsx";

// Standard modal: title bar + scrollable body + optional footer.
// `footer` is a render prop that receives { close } so footer buttons can
// trigger the exit animation before unmounting.

export function ModalShell({ title, subtitle, onClose, width = 560, children, footer }) {
  const [closing, setClosing] = useState(false);
  const close = () => {
    setClosing(true);
    setTimeout(onClose, 180);
  };
  return (
    <Overlay closing={closing} zIndex={55} onBackdropClick={close}>
      <div
        className={`${closing ? "anim-rise-out" : "anim-rise-in"} bg-surface flex flex-col`}
        style={{ width, border: "1px solid var(--border-strong)", maxHeight: "86vh" }}
      >
        <div className="flex justify-between items-center px-[22px] py-4 border-b border-border">
          <div>
            <h3 className="m-0 text-[15px] font-semibold">{title}</h3>
            {subtitle && <p className="mt-0.5 mb-0 text-xs text-muted">{subtitle}</p>}
          </div>
          <button onClick={close} className="border-none bg-transparent cursor-pointer p-1.5">
            <I.x size={16} />
          </button>
        </div>
        <div className="p-[22px] overflow-auto flex-1">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 px-[22px] py-3.5 border-t border-border bg-surface-2">
            {footer({ close })}
          </div>
        )}
      </div>
    </Overlay>
  );
}
