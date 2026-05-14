import { useCallback, useEffect, useRef } from "react";

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

/**
 * Área de firma con canvas; exporta PNG como `File` para FormData (FirmaCliente).
 *
 * @param {(file: File | null) => void} onChange — `null` si está vacío o se limpió.
 * @param {number} [resetVersion] — al incrementar, borra el trazo.
 * @param {boolean} [disabled]
 */
export default function SignaturePad({ onChange, resetVersion = 0, disabled }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const hasInk = useRef(false);

  const clearInternal = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = STROKE;
    ctx.lineWidth = Math.min(3, Math.max(2, W / 220));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    hasInk.current = false;
    onChange?.(null);
  }, [onChange]);

  useEffect(() => {
    clearInternal();
  }, [clearInternal, resetVersion]);

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
          Firme en el recuadro apaisado ({W}×{H} px). Se enviará como PNG.
        </p>
        <button
          type="button"
          onClick={clearInternal}
          disabled={disabled}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Limpiar firma
        </button>
      </div>
    </div>
  );
}
