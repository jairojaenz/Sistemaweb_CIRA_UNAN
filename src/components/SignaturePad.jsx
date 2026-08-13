import { useCallback, useEffect, useRef, useState } from "react";

const STROKE = "#0f172a";
const BG = "#ffffff";

/**
 * Lienzo de firma en formato **apaisado** (ancho × alto en px del PNG).
 * Las firmas suelen ser horizontales; un rectángulo estrecho y alto (p. ej. 200×240)
 * obliga a firmar “en columna” y se ve peor. 560×200 encaja bien en modal y dedo/ratón.
 */
export const FIRMA_CANVAS_ANCHO = 560;
export const FIRMA_CANVAS_ALTO = 200;

const W = FIRMA_CANVAS_ANCHO;
const H = FIRMA_CANVAS_ALTO;

/** Convierte Base64, data-URL o URL http en un src usable por `Image`. */
export function firmaSrcToUrl(src) {
  if (!src || typeof src !== "string") return "";
  let s = src.trim();
  if (s.length >= 5 && s.slice(0, 5).toUpperCase() === "DATA:") {
    s = `data:${s.slice(5)}`;
  }
  if (/^data:image\//i.test(s)) return s;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  const compact = s.replace(/\s/g, "");
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(compact) && compact.length >= 32) {
    return `data:image/png;base64,${compact}`;
  }
  return "";
}

function paintBlank(canvas) {
  if (!canvas) return null;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = STROKE;
  ctx.lineWidth = Math.min(3, Math.max(2, W / 220));
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  return ctx;
}

function drawContained(ctx, img) {
  const scale = Math.min(W / img.width, H / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
}

/**
 * Área de firma con canvas; exporta PNG como `File` para FormData (FirmaCliente).
 *
 * @param {(file: File | null) => void} onChange — `null` si está vacío, se limpió o solo se muestra la guardada.
 * @param {number} [resetVersion] — al incrementar, restaura el lienzo (firma inicial o vacío).
 * @param {boolean} [disabled]
 * @param {string} [initialSrc] — firma ya guardada (Base64 / data-URL) para mostrarla al editar.
 */
export default function SignaturePad({ onChange, resetVersion = 0, disabled, initialSrc = "" }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const hasInk = useRef(false);
  const [lienzoLimpio, setLienzoLimpio] = useState(false);
  const tieneFirmaGuardada = Boolean(firmaSrcToUrl(initialSrc));

  const restoreCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    paintBlank(canvas);
    hasInk.current = false;
    onChange?.(null);
    setLienzoLimpio(false);

    const url = firmaSrcToUrl(initialSrc);
    if (!url || !canvas) return;

    const img = new Image();
    img.onload = () => {
      if (canvasRef.current !== canvas) return;
      const liveCtx = canvas.getContext("2d");
      if (!liveCtx || !img.naturalWidth || !img.naturalHeight) return;
      drawContained(liveCtx, img);
    };
    img.onerror = () => {
      if (url.startsWith("data:image/png")) {
        img.src = url.replace("data:image/png", "data:image/jpeg");
      }
    };
    img.src = url;
  }, [initialSrc, onChange]);

  const clearCanvas = useCallback(() => {
    paintBlank(canvasRef.current);
    hasInk.current = false;
    onChange?.(null);
    setLienzoLimpio(true);
  }, [onChange]);

  useEffect(() => {
    restoreCanvas();
  }, [restoreCanvas, resetVersion]);

  const pos = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * W,
      y: ((e.clientY - rect.top) / rect.height) * H,
    };
  }, []);

  const emitPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasInk.current) {
      onChange?.(null);
      return;
    }
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          onChange?.(null);
          return;
        }
        onChange?.(new File([blob], "firma-cliente.png", { type: "image/png" }));
      },
      "image/png",
      0.92
    );
  }, [onChange]);

  const start = useCallback(
    (e) => {
      if (disabled) return;
      e.preventDefault();
      drawing.current = true;
      last.current = pos(e);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    },
    [disabled, pos]
  );

  const move = useCallback(
    (e) => {
      if (!drawing.current || disabled) return;
      e.preventDefault();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      const p = pos(e);
      const prev = last.current;
      if (!ctx || !p || !prev) return;
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last.current = p;
      hasInk.current = true;
    },
    [disabled, pos]
  );

  const end = useCallback(
    (e) => {
      if (!drawing.current) return;
      e.preventDefault();
      drawing.current = false;
      last.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      emitPng();
    },
    [emitPng]
  );

  return (
    <div className="space-y-2">
      <div className="relative flex w-full justify-center overflow-hidden rounded-md border-2 border-dashed border-gray-300 bg-white py-2">
        <canvas
          ref={canvasRef}
          className="block h-auto w-full max-w-[560px] touch-none cursor-crosshair disabled:pointer-events-none disabled:opacity-50"
          style={{ aspectRatio: `${W} / ${H}` }}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          onPointerLeave={(e) => {
            if (drawing.current) end(e);
          }}
          aria-label="Área para firmar con el dedo o el ratón"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-gray-500">
          {lienzoLimpio
            ? "Recuadro vacío. Dibuje la firma nueva y luego pulse Guardar."
            : `Firme en el recuadro apaisado (${W}×${H} px). Se enviará como PNG.`}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={clearCanvas}
            disabled={disabled}
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Limpiar firma
          </button>
          {tieneFirmaGuardada && lienzoLimpio && (
            <button
              type="button"
              onClick={restoreCanvas}
              disabled={disabled}
              className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-800 hover:bg-blue-100 disabled:opacity-50"
            >
              Volver a la firma guardada
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
