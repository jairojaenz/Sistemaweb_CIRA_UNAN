import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "../../../components/ToastContext.jsx";
import NicaraguaMap from "../../home/components/NicaraguaMap.jsx";
import {
  getPuntosClientesMapa,
  getPuntosPlanesMapa,
} from "../../home/service/graficosService.js";

export default function GeolocalizacionPage() {
  const { addToast } = useToast();
  const [modo, setModo] = useState("muestras");
  const [puntos, setPuntos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const reqRef = useRef(0);

  const cargarPuntos = useCallback(
    async (tipo) => {
      const id = ++reqRef.current;
      setCargando(true);
      setPuntos([]);
      try {
        const data =
          tipo === "clientes" ? await getPuntosClientesMapa() : await getPuntosPlanesMapa(null);
        if (id === reqRef.current) setPuntos(data ?? []);
      } catch (err) {
        if (id === reqRef.current) {
          setPuntos([]);
          addToast(err?.message || "No se pudieron cargar los puntos del mapa", "error");
        }
      } finally {
        if (id === reqRef.current) setCargando(false);
      }
    },
    [addToast],
  );

  useEffect(() => {
    cargarPuntos(modo);
  }, [modo, cargarPuntos]);

  return (
    <div className="geoloc-page flex min-h-0 flex-1 flex-col bg-black">
      <NicaraguaMap
        puntos={puntos}
        modo={modo}
        onModo={setModo}
        cargando={cargando}
        rellenoPantalla
        vista3dInicial
        mapaGlobo
      />
    </div>
  );
}
