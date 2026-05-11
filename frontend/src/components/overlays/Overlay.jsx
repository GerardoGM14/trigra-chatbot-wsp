import { createPortal } from "react-dom";

// Dim backdrop + content rendered into document.body via a portal, so the veil
// always covers the WHOLE viewport — sidebar and topbar included — regardless
// of which subtree opened the modal. Clipping/stacking ancestors can't reach
// here.
//
// `closing` flips the exit animation; `onBackdropClick` fires when the user
// clicks the dim area (not the content) — pass nothing for wizards that
// shouldn't dismiss on stray clicks.

export function Overlay({ closing, zIndex = 55, onBackdropClick, children }) {
  return createPortal(
    <div
      className={`${closing ? "anim-fade-out" : "anim-fade-in"} fixed inset-0 flex items-center justify-center`}
      style={{
        background: "rgba(21,20,15,0.42)",
        // Padding lateral y vertical para modales altos: si el contenido se
        // pasa de la ventana, scrollea en lugar de pegarse a los bordes.
        padding: "24px",
        zIndex,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onBackdropClick?.();
      }}
    >
      {children}
    </div>,
    document.body,
  );
}
