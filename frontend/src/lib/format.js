// Helpers de formato para fechas y números. Centralizados aquí para que
// cualquier pantalla los reuse sin reimplementarlos.

const N_PE = new Intl.NumberFormat("es-PE");
export const num = (n) => (typeof n === "number" ? N_PE.format(n) : "—");

// "hace X" relativo a ahora. Devuelve "—" si no hay fecha.
export function timeAgo(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000; // segundos
  if (diff < 60) return "hace segundos";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  if (diff < 86400 * 7) return `hace ${Math.floor(diff / 86400)} d`;
  if (diff < 86400 * 30) return `hace ${Math.floor(diff / 86400 / 7)} sem`;
  return `hace ${Math.floor(diff / 86400 / 30)} m`;
}

// "14:32:08" — hora local en formato 24h, útil para los feeds de actividad.
export function timeOfDay(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("es-PE", { hour12: false });
}
