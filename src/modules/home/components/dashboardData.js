const MONTHS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const matrices = [
  { name: "Agua Potable", color: "#1e3a8a" },
  { name: "Aguas Residuales", color: "#3b82f6" },
  { name: "Sedimentos", color: "#059669" },
  { name: "Suelos", color: "#10b981" },
  { name: "Lodos", color: "#34d399" },
  { name: "Otros", color: "#6b7280" },
];

const departamentosNicaragua = [
  { name: "Managua", samples: 125, cx: 175, cy: 170 },
  { name: "León", samples: 55, cx: 120, cy: 110 },
  { name: "Chinandega", samples: 42, cx: 75, cy: 95 },
  { name: "Matagalpa", samples: 45, cx: 250, cy: 105 },
  { name: "Granada", samples: 52, cx: 200, cy: 240 },
  { name: "Estelí", samples: 35, cx: 190, cy: 55 },
  { name: "Masaya", samples: 38, cx: 215, cy: 180 },
  { name: "Rivas", samples: 32, cx: 145, cy: 280 },
  { name: "Jinotega", samples: 28, cx: 260, cy: 45 },
  { name: "Carazo", samples: 25, cx: 155, cy: 225 },
  { name: "Chontales", samples: 30, cx: 270, cy: 240 },
  { name: "RAAN", samples: 22, cx: 340, cy: 80 },
  { name: "RAAS", samples: 38, cx: 340, cy: 190 },
  { name: "Nueva Segovia", samples: 18, cx: 100, cy: 30 },
  { name: "Madriz", samples: 12, cx: 150, cy: 25 },
  { name: "Boaco", samples: 15, cx: 280, cy: 175 },
  { name: "Río San Juan", samples: 10, cx: 250, cy: 305 },
];

export const monthlyConversionData = [
  { mes: "Ene", proformas: 520, ordenes: 340 },
  { mes: "Feb", proformas: 490, ordenes: 310 },
  { mes: "Mar", proformas: 550, ordenes: 380 },
  { mes: "Abr", proformas: 510, ordenes: 350 },
  { mes: "May", proformas: 580, ordenes: 410 },
  { mes: "Jun", proformas: 540, ordenes: 390 },
  { mes: "Jul", proformas: 560, ordenes: 420 },
  { mes: "Ago", proformas: 530, ordenes: 400 },
  { mes: "Sep", proformas: 500, ordenes: 360 },
  { mes: "Oct", proformas: 480, ordenes: 330 },
  { mes: "Nov", proformas: 510, ordenes: 370 },
  { mes: "Dic", proformas: 470, ordenes: 340 },
];

export const matrixDistribution = matrices;

export const solicitudesTrend = [
  { mes: "Dic", solicitudes: 85 },
  { mes: "Ene", solicitudes: 92 },
  { mes: "Feb", solicitudes: 78 },
  { mes: "Mar", solicitudes: 105 },
  { mes: "Abr", solicitudes: 98 },
  { mes: "May", solicitudes: 112 },
];

export const gaugeData = { cumplimiento: 78, programados: 42, ejecutados: 33 };

export const departmentData = departamentosNicaragua;

export const topClientes = [
  { name: "ENACAL", muestras: 280 },
  { name: "MINSA", muestras: 195 },
  { name: "Alcaldía de Managua", muestras: 145 },
  { name: "Empresa Privada", muestras: 98 },
  { name: "MARENA", muestras: 72 },
];

export const analisisSolicitados = [
  { name: "Físico-Químico", cantidad: 320 },
  { name: "Microbiológico", cantidad: 280 },
  { name: "Metales Pesados", cantidad: 195 },
  { name: "Hidrobiológico", cantidad: 140 },
  { name: "Plaguicidas", cantidad: 85 },
  { name: "Orgánicos", cantidad: 60 },
];

export const alertsData = {
  cadenasPendientes: 7,
  totalCadenas: 23,
  tiempoPromedioHoras: 16,
};

export default {
  monthlyConversionData,
  matrixDistribution,
  solicitudesTrend,
  gaugeData,
  departmentData,
  topClientes,
  analisisSolicitados,
  alertsData,
};
