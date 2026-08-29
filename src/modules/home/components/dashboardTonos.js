export const TONOS_GRAFICO = [
  { color: "#06b6d4", deep: "#0369a1", glow: "#67e8f9" },
  { color: "#2563eb", deep: "#1d4ed8", glow: "#7dd3fc" },
  { color: "#4f46e5", deep: "#3730a3", glow: "#a5b4fc" },
  { color: "#10b981", deep: "#047857", glow: "#6ee7b7" },
  { color: "#f59e0b", deep: "#b45309", glow: "#fde68a" },
  { color: "#f97316", deep: "#c2410c", glow: "#fdba74" },
  { color: "#7c3aed", deep: "#5b21b6", glow: "#c4b5fd" },
  { color: "#e11d48", deep: "#9f1239", glow: "#fda4af" },
];

export function conTonos(items, nameKey = "nombre") {
  return (items ?? []).map((item, i) => {
    const tono = TONOS_GRAFICO[i % TONOS_GRAFICO.length];
    return {
      ...item,
      name: item[nameKey] ?? item.nombre ?? item.name,
      value: Number(item.porcentaje ?? item.Porcentaje ?? item.value ?? item.cantidad ?? 0),
      cantidad: Number(item.cantidad ?? item.Cantidad ?? item.value ?? 0),
      ...tono,
    };
  });
}
