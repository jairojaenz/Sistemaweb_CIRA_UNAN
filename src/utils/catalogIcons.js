import {
  Activity,
  Briefcase,
  Building2,
  CircleDot,
  ClipboardList,
  Clock,
  Container,
  Cylinder,
  Droplets,
  FileText,
  Fish,
  FlaskConical,
  Gauge,
  GitFork,
  Globe,
  Inbox,
  Landmark,
  Layers,
  Leaf,
  Mail,
  MapPin,
  MessageCircle,
  Mountain,
  Phone,
  Recycle,
  Send,
  ShowerHead,
  Snowflake,
  Thermometer,
  UserRound,
  Waves,
  Wind,
  Wrench,
  Zap,
} from "lucide-react";

export function normalizarCatalogo(nombre) {
  return String(nombre ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const ICON_FALLBACK = [
  { icon: Inbox, tone: "bg-slate-100 text-slate-700" },
  { icon: Building2, tone: "bg-violet-50 text-violet-700" },
  { icon: Globe, tone: "bg-cyan-50 text-cyan-700" },
  { icon: Send, tone: "bg-orange-50 text-orange-700" },
  { icon: Landmark, tone: "bg-amber-50 text-amber-800" },
  { icon: Briefcase, tone: "bg-blue-50 text-blue-800" },
  { icon: FileText, tone: "bg-indigo-50 text-indigo-700" },
  { icon: ClipboardList, tone: "bg-stone-100 text-stone-700" },
  { icon: Wrench, tone: "bg-gray-100 text-gray-700" },
  { icon: Gauge, tone: "bg-emerald-50 text-emerald-700" },
];

function primerLibre(usados) {
  return ICON_FALLBACK.find((item) => !usados.has(item.icon)) || ICON_FALLBACK[0];
}

/**
 * Asigna un icono distinto a cada ítem según su nombre.
 * Si dos nombres coincidirían con el mismo icono, el segundo usa un fallback único.
 */
export function asignarEstilosUnicos(items, getNombre, resolver) {
  const usados = new Set();
  return items.map((item) => {
    const nombre = getNombre(item);
    let estilo = resolver(nombre);
    if (usados.has(estilo.icon)) {
      estilo = primerLibre(usados);
    }
    usados.add(estilo.icon);
    return { item, estilo };
  });
}

export function estiloMedio(nombre) {
  const n = normalizarCatalogo(nombre);
  if (/whatsapp/.test(n)) return { icon: MessageCircle, tone: "bg-teal-50 text-teal-700" };
  if (/correo|email/.test(n)) return { icon: Mail, tone: "bg-sky-50 text-sky-700" };
  if (/telefono|telefonica|llamada/.test(n)) return { icon: Phone, tone: "bg-emerald-50 text-emerald-700" };
  if (/personal|presencial|oficina|visita/.test(n)) return { icon: UserRound, tone: "bg-indigo-50 text-indigo-700" };
  return { icon: Inbox, tone: "bg-slate-100 text-slate-700" };
}

export function estiloServicio(nombre) {
  const n = normalizarCatalogo(nombre);
  if (/analisis|laboratorio|ensayo/.test(n)) return { icon: FlaskConical, tone: "bg-violet-50 text-violet-700" };
  if (/muestreo|campo/.test(n)) return { icon: MapPin, tone: "bg-cyan-50 text-cyan-700" };
  if (/consult/.test(n)) return { icon: ClipboardList, tone: "bg-amber-50 text-amber-800" };
  if (/informe/.test(n)) return { icon: FileText, tone: "bg-blue-50 text-blue-800" };
  if (/observ/.test(n)) return { icon: Landmark, tone: "bg-stone-100 text-stone-700" };
  return { icon: Briefcase, tone: "bg-indigo-50 text-indigo-700" };
}

export function estiloMatriz(nombre) {
  const n = normalizarCatalogo(nombre);
  if (/potable/.test(n)) return { icon: Droplets, tone: "bg-sky-50 text-sky-700" };
  if (/residual/.test(n)) return { icon: Recycle, tone: "bg-amber-50 text-amber-700" };
  if (/suelo|tierra/.test(n)) return { icon: Mountain, tone: "bg-yellow-50 text-yellow-800" };
  if (/sedimento/.test(n)) return { icon: Layers, tone: "bg-stone-100 text-stone-700" };
  if (/lodo/.test(n)) return { icon: Landmark, tone: "bg-neutral-100 text-neutral-700" };
  if (/natural|rio|lago|mar/.test(n)) return { icon: Waves, tone: "bg-cyan-50 text-cyan-700" };
  if (/aire/.test(n)) return { icon: Wind, tone: "bg-blue-50 text-blue-800" };
  if (/biota|planta|biolog/.test(n)) return { icon: Leaf, tone: "bg-emerald-50 text-emerald-700" };
  return { icon: FlaskConical, tone: "bg-indigo-50 text-indigo-700" };
}

export function estiloFuente(nombre) {
  const n = normalizarCatalogo(nombre);
  if (/envasad|botella/.test(n)) return { icon: Container, tone: "bg-sky-50 text-sky-700" };
  if (/tanque|almacen/.test(n)) return { icon: Cylinder, tone: "bg-slate-100 text-slate-700" };
  if (/grifo|llave|chorro/.test(n)) return { icon: ShowerHead, tone: "bg-blue-50 text-blue-800" };
  if (/marino|oceano|\bmar\b/.test(n)) return { icon: Fish, tone: "bg-cyan-50 text-cyan-800" };
  if (/lacustre|lago/.test(n)) return { icon: Waves, tone: "bg-teal-50 text-teal-700" };
  if (/fluvial|rio|quebrada/.test(n)) return { icon: GitFork, tone: "bg-sky-50 text-sky-800" };
  if (/pozo/.test(n)) return { icon: CircleDot, tone: "bg-stone-100 text-stone-700" };
  if (/manantial|nacimiento/.test(n)) return { icon: Droplets, tone: "bg-emerald-50 text-emerald-700" };
  if (/residual|alcantarill/.test(n)) return { icon: Recycle, tone: "bg-amber-50 text-amber-800" };
  return { icon: Landmark, tone: "bg-indigo-50 text-indigo-700" };
}

export function estiloTipoMuestreo(nombre) {
  const n = normalizarCatalogo(nombre);
  if (/compuesto|completo/.test(n)) return { icon: Layers, tone: "bg-amber-50 text-amber-800" };
  if (/puntual|simple/.test(n)) return { icon: CircleDot, tone: "bg-sky-50 text-sky-700" };
  return { icon: Clock, tone: "bg-indigo-50 text-indigo-700" };
}

export function estiloEquipo(nombre) {
  const n = normalizarCatalogo(nombre);
  if (/gps|coorden/.test(n)) return { icon: MapPin, tone: "bg-cyan-50 text-cyan-700" };
  if (/\bph\b|phmetro/.test(n)) return { icon: Droplets, tone: "bg-teal-50 text-teal-700" };
  if (/termom|temp/.test(n)) return { icon: Thermometer, tone: "bg-orange-50 text-orange-700" };
  if (/conduct/.test(n)) return { icon: Zap, tone: "bg-amber-50 text-amber-700" };
  if (/oxigen|odo/.test(n)) return { icon: Wind, tone: "bg-blue-50 text-blue-800" };
  if (/sonda|multiparam/.test(n)) return { icon: Activity, tone: "bg-violet-50 text-violet-700" };
  if (/cooler|hielo|nevera|termico/.test(n)) return { icon: Snowflake, tone: "bg-sky-50 text-sky-700" };
  if (/botella|envase|frasco/.test(n)) return { icon: Container, tone: "bg-slate-100 text-slate-700" };
  if (/bomba/.test(n)) return { icon: Cylinder, tone: "bg-stone-100 text-stone-700" };
  if (/balanza|peso/.test(n)) return { icon: Gauge, tone: "bg-indigo-50 text-indigo-700" };
  return { icon: Wrench, tone: "bg-gray-100 text-gray-700" };
}
