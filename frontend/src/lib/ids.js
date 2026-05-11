// Generadores de IDs cortos para el mock. Aislados aquí para mantener
// Date.now() / Math.random() fuera del render de los componentes (la regla
// react-hooks/purity los marca aunque estén dentro de un handler).

export function newCampaignId() {
  return `camp_${Date.now().toString().slice(-4)}`;
}

export function newGroupId() {
  return `grp_${Date.now().toString().slice(-5)}`;
}
