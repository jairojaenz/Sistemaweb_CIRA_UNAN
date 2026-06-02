import { useMemo, useState, useEffect } from "react";
import { FIRMA_CANVAS_ANCHO, FIRMA_CANVAS_ALTO } from "./SignaturePad.jsx";

function parseFirmaContenido(src) {
  if (!src || typeof src !== "string") return null;
  let s = src.trim();
  if (s.length >= 5 && s.slice(0, 5).toUpperCase() === "DATA:") {
    s = `data:${s.slice(5)}`;
  }
  if (/^data:image\//i.test(s)) {
    s = s.replace(/^data:([^;]+);([^,]+),/i, (_, mime, enc) => `data:${mime.toLowerCase()};${enc.toLowerCase()},`);
    return { kind: "url", url: s };
  }
  if (s.startsWith("http://") || s.startsWith("https://")) return { kind: "url", url: s };
  const compact = s.replace(/\s/g, "");
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(compact) && compact.length >= 32) {
    return { kind: "b64", b64: compact };
  }
  return { kind: "text", text: s };
}

export default function FirmaDisplay({ src, alt = "Firma" }) {
  const parsed = useMemo(() => parseFirmaContenido(src), [src]);
  const [mime, setMime] = useState("image/png");

  useEffect(() => {
    setMime("image/png");
  }, [src]);

  const boxStyle = {
    maxWidth: FIRMA_CANVAS_ANCHO,
    aspectRatio: `${FIRMA_CANVAS_ANCHO} / ${FIRMA_CANVAS_ALTO}`,
  };
  const boxClass =
    "relative mx-auto flex w-full items-center justify-center overflow-hidden rounded border border-gray-200 bg-white";

  if (!parsed) {
    return (
      <div className={boxClass} style={boxStyle}>
        <p className="px-2 text-center text-sm text-gray-500">Sin firma registrada.</p>
      </div>
    );
  }

  const imgClass = "h-full w-full object-contain";

  if (parsed.kind === "url") {
    return (
      <div className={boxClass} style={boxStyle}>
        <img src={parsed.url} alt={alt} width={FIRMA_CANVAS_ANCHO} height={FIRMA_CANVAS_ALTO} className={imgClass} />
      </div>
    );
  }

  if (parsed.kind === "b64") {
    const dataUrl = `data:${mime};base64,${parsed.b64}`;
    return (
      <div className={boxClass} style={boxStyle}>
        <img
          src={dataUrl}
          alt={`${alt} (decodificada desde Base64)`}
          width={FIRMA_CANVAS_ANCHO}
          height={FIRMA_CANVAS_ALTO}
          className={imgClass}
          onError={() => {
            if (mime === "image/png") setMime("image/jpeg");
          }}
        />
      </div>
    );
  }

  return (
    <div className={boxClass} style={boxStyle}>
      <p className="max-h-full overflow-auto px-2 text-center text-xs text-gray-600" title={parsed.text.slice(0, 120)}>
        No se pudo interpretar la firma como imagen (no es URL ni Base64 de imagen reconocible).
      </p>
    </div>
  );
}
