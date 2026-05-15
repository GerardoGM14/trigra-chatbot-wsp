import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

// Top-of-page progress bar — YouTube style: two stacked tracks.
//   · Trail (tenue): un rastro al 30% de opacidad que cruza completo más lento.
//   · Head  (vivo) : una barra brillante más corta que va por delante y termina
//                     antes que el trail, dando la sensación de "indicador en
//                     cabeza + progreso real" detrás.
//
// El color sale de `var(--accent)`, así que cambia con el tema activo.
// Sin sombra externa: línea plana, 2 px de alto.

// Ambas barras cruzan completas; lo que las distingue es el ritmo: el rastro
// despega rápido y se relaja al final (curva relajante), mientras que la
// cabeza brillante arranca con un poco de retraso visual (curva con anticipo)
// y persigue al rastro hasta alcanzarlo justo en el 100%.
const TRAIL_MS = 450;    // rastro completa más rápido
const HEAD_MS = 650;     // cabeza completa después, "persiguiéndolo"
const TOTAL_MS = 800;    // tiempo total visible (incluye fade)
const FADE_MS = TOTAL_MS - HEAD_MS;

export function RouteProgressBar() {
  const { pathname } = useLocation();
  // `phase`: idle | running | done
  //   idle    → ambas barras ocultas
  //   running → animando los anchos
  //   done    → llegaron al final, haciendo fade-out
  const [phase, setPhase] = useState("idle");
  const [headWidth, setHeadWidth] = useState(0);
  const [trailWidth, setTrailWidth] = useState(0);

  useEffect(() => {
    // Nueva ruta → arranca el ciclo. Reset síncrono + animación con RAF.
    /* eslint-disable react-hooks/set-state-in-effect */
    setPhase("running");
    setHeadWidth(0);
    setTrailWidth(0);
    /* eslint-enable react-hooks/set-state-in-effect */

    // Doble RAF: el navegador necesita pintar el 0% antes de transicionar al
    // objetivo, si no la animación se "salta".
    let raf2 = null;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setHeadWidth(100);
        setTrailWidth(100);
      });
    });

    // Esperamos a que la cabeza llegue al 100 antes de iniciar el fade —
    // así el "completado" se siente tras ambas, no a mitad de animación.
    const finish = setTimeout(() => setPhase("done"), HEAD_MS);
    const reset = setTimeout(() => {
      setPhase("idle");
      setHeadWidth(0);
      setTrailWidth(0);
    }, TOTAL_MS);

    return () => {
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
      clearTimeout(finish);
      clearTimeout(reset);
    };
  }, [pathname]);

  if (phase === "idle") return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 pointer-events-none"
      style={{ height: 2, zIndex: 2147483647 }}
    >
      {/* Trail — rastro tenue al 30%, despega rápido y se relaja al final. */}
      <div
        className="absolute top-0 left-0"
        style={{
          height: "100%",
          width: `${trailWidth}%`,
          background: "var(--accent)",
          opacity: phase === "done" ? 0 : 0.3,
          transition: `width ${TRAIL_MS}ms cubic-bezier(0.1, 0.7, 0.1, 1), opacity ${FADE_MS}ms ease-out`,
        }}
      />
      {/* Head — barra brillante, persigue al rastro y lo alcanza en el 100%. */}
      <div
        className="absolute top-0 left-0"
        style={{
          height: "100%",
          width: `${headWidth}%`,
          background: "var(--accent)",
          opacity: phase === "done" ? 0 : 1,
          transition: `width ${HEAD_MS}ms cubic-bezier(0.55, 0.1, 0.9, 0.5), opacity ${FADE_MS}ms ease-out`,
        }}
      />
    </div>
  );
}
