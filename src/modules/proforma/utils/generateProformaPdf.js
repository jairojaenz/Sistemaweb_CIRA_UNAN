import { jsPDF, GState } from "jspdf";
import { applyPlugin } from "jspdf-autotable";
import ciraLogo from "../../../assets/CIRA.png";

applyPlugin(jsPDF);

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve({
        dataUrl: canvas.toDataURL("image/png"),
        width: img.width,
        height: img.height,
      });
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function formatMoney(amount) {
  if (amount == null) return "C$ 0.00";
  return `C$ ${Number(amount).toLocaleString("es-NI", {
    minimumFractionDigits: 2,
  })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("es-NI", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ── Color palette ──
const BLUE = [62, 80, 109];
const HEADER_BG = [75, 98, 128];
const DARK_TEXT = [26, 26, 26];
const BG_LIGHT = [240, 244, 248];
const GRAY_TEXT = [107, 114, 128];
const GRAY_BORDER = [209, 213, 219];
const WHITE = [255, 255, 255];

const PAGE_WIDTH = 215.9;
const PAGE_HEIGHT = 279.4;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

export async function generateProformaPdf(proforma) {
  const [ciraImage] = await Promise.all([loadImage(ciraLogo)]);

  const doc = new jsPDF("p", "mm", "letter");
  let y = MARGIN;

  // ══════════════════════════════════════════════
  // HEADER
  // ══════════════════════════════════════════════

  // Fondo del header
  doc.setFillColor(...HEADER_BG);
  doc.rect(0, 0, PAGE_WIDTH, 28, "F");

  // Logo institucional (izquierda)
  if (ciraImage) {
    const { dataUrl, width: imgW, height: imgH } = ciraImage;
    const logoH = 14;
    const logoW = (imgW / imgH) * logoH;
    doc.addImage(dataUrl, "PNG", MARGIN, y - 2, logoW, logoH);
  }

  // Título + validez (derecha)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...WHITE);
  doc.text("PROFORMA DE SERVICIOS", PAGE_WIDTH - MARGIN, y + 3.5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(200, 210, 220);
  doc.text("Validez: 30 días calendario", PAGE_WIDTH - MARGIN, y + 7.5, { align: "right" });

  y = 28;

  // ══════════════════════════════════════════════
  // METADATA BLOCK (3 columnas con fondo gris claro)
  // ══════════════════════════════════════════════

  const colWidth = CONTENT_WIDTH / 3;
  const numero = proforma.numeroProforma || "—";

  function drawInfoBox(label, value, x) {
    doc.setFillColor(...BG_LIGHT);
    doc.rect(x, y, colWidth, 13, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...GRAY_TEXT);
    doc.text(label, x + 3, y + 4.5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...DARK_TEXT);
    doc.text(String(value ?? "—"), x + 3, y + 10.5);
  }

  drawInfoBox("PROFORMA NO.", numero, MARGIN);
  drawInfoBox("NO. SOLICITUD", proforma.numeroSolicitud || proforma.noSolicitud || "—", MARGIN + colWidth);
  drawInfoBox("FECHA DE EMISIÓN", formatDate(proforma.fechaProforma), MARGIN + 2 * colWidth);

  y += 16;

  // ══════════════════════════════════════════════
  // CLIENT IDENTIFICATION (línea divisoria + grid 2x2)
  // ══════════════════════════════════════════════

  doc.setDrawColor(...GRAY_BORDER);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 3.5;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(...BLUE);
  doc.text("IDENTIFICACIÓN DEL CLIENTE", MARGIN, y);
  y += 4.5;

  function drawClientField(label, value, x, yPos) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...GRAY_TEXT);
    doc.text(label, x, yPos);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...DARK_TEXT);
    doc.text(String(value ?? "—"), x, yPos + 3.5);
  }

  const fieldWidth = CONTENT_WIDTH / 2;

  drawClientField(
    "NOMBRE O RAZÓN SOCIAL",
    `${proforma.cliente?.nombreCliente ?? ""} ${proforma.cliente?.apellidoCliente ?? ""}`.trim(),
    MARGIN,
    y,
  );
  drawClientField(
    "NIT / DOCUMENTO",
    proforma.cliente?.cedulaCliente || proforma.cliente?.numeroRuc,
    MARGIN + fieldWidth,
    y,
  );
  y += 8;

  drawClientField("DIRECCIÓN DE CONTACTO", proforma.cliente?.direccionCliente, MARGIN, y);
  drawClientField("CORREO ELECTRÓNICO", proforma.cliente?.correoCliente, MARGIN + fieldWidth, y);
  y += 11;

  // ══════════════════════════════════════════════
  // SERVICES TABLE (jspdf-autotable con theme plain)
  // ══════════════════════════════════════════════

  if (proforma.detalles?.length > 0) {
    y += 1;

    const head = [["CANT.", "SERVICIO", "TÉCNICA", "PRECIO UNIT.", "TOTAL"]];
    const body = proforma.detalles.map((d) => [
      String(d.cantidadDetalleProforma ?? 0),
      d.nombreAnalisis || "—",
      d.nombreTecnica || "—",
      formatMoney(d.precioUnitarioDetalle),
      formatMoney(d.totalDetalleProforma),
    ]);

    doc.autoTable({
      head,
      body,
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      theme: "plain",
      headStyles: {
        fillColor: [...BG_LIGHT],
        textColor: [...DARK_TEXT],
        fontSize: 7,
        fontStyle: "bold",
        halign: "center",
        cellPadding: 2,
      },
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 14, halign: "center" },
        1: { cellWidth: 65, halign: "left" },
        2: { cellWidth: 50, halign: "left" },
        3: { cellWidth: 28, halign: "right" },
        4: { halign: "right" },
      },
      didParseCell(data) {
        if (data.section === "body" && data.column.index === 1) {
          const detalle = proforma.detalles[data.row.index];
          const desc = detalle.descripcionAnalisis || "";
          data.cell._descripcion = desc;
          data.cell.text = [];

          if (desc) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(6.5);
            const colW = data.cell.width - 4;
            const descLines = doc.splitTextToSize(String(desc), Math.max(colW, 10));
            const descH = descLines.length * 2.5;
            data.row.height = Math.max(10, 3 + descH + 4);
          } else {
            data.row.height = 10;
          }
        }
      },
      didDrawCell(data) {
        // Línea horizontal entre filas
        if (data.column.index === 0) {
          doc.setDrawColor(...GRAY_BORDER);
          doc.setLineWidth(0.1);
          doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + CONTENT_WIDTH, data.cell.y + data.cell.height);
        }

        // Texto enriquecido para columna SERVICIO
        if (data.section === "body" && data.column.index === 1) {
          const padding = 2;
          const name = String(data.cell.raw || "—");

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(...DARK_TEXT);
          doc.text(name, data.cell.x + padding, data.cell.y + padding + 3);

          if (data.cell._descripcion) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(6.5);
            doc.setTextColor(...GRAY_TEXT);
            const descLines = doc.splitTextToSize(String(data.cell._descripcion), data.cell.width - padding * 2);
            doc.text(descLines, data.cell.x + padding, data.cell.y + padding + 8);
          }
        }
      },
    });

    y = doc.lastAutoTable.finalY + 3;
  }

  // ══════════════════════════════════════════════
  // BIFURCATED SECTION (Especificaciones + Notas)
  // ══════════════════════════════════════════════

  const sectionHeight = 30;

  if (y + sectionHeight + 28 > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    y = MARGIN + 5;
  }

  const leftColW = CONTENT_WIDTH * 0.58;
  const rightColW = CONTENT_WIDTH * 0.38;
  const midGap = CONTENT_WIDTH * 0.04;

  // ── Columna izquierda: Especificaciones Técnicas ──
  doc.setFillColor(...BG_LIGHT);
  doc.rect(MARGIN, y, leftColW, sectionHeight, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...BLUE);
  doc.text("ESPECIFICACIONES TÉCNICAS", MARGIN + 3, y + 4);

  const specX = MARGIN + 3;

  function drawSpecField(label, value, yPos) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6);
    doc.setTextColor(...GRAY_TEXT);
    doc.text(label, specX, yPos);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...DARK_TEXT);
    doc.text(String(value ?? "—"), specX + 3, yPos + 3.5);
  }

  drawSpecField("MATRIZ", proforma.matrices?.map((m) => m.nombreMatriz).join(" / "), y + 9);
  drawSpecField("TIPO MUESTREO", proforma.tiposMuestreo || "—", y + 16);
  drawSpecField("FECHA MUESTREO", formatDate(proforma.fechaMuestreoProforma), y + 23);

  // ── Columna derecha: Notas Administrativas ──
  const rightX = MARGIN + leftColW + midGap;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...BLUE);
  doc.text("NOTAS ADMINISTRATIVAS", rightX, y + 4);

  const notasText =
    proforma.notasAdministrativas ||
    "Los precios incluyen la entrega de informes firmados digitalmente. El plazo debe realizarse mediante transferencia bancaria antes del inicio del procesamiento. Sujeto a términos y condiciones generales de servicios académicos v2024.";

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...DARK_TEXT);
  const notasLines = doc.splitTextToSize(notasText, rightColW - 3);
  doc.text(notasLines, rightX + 1.5, y + 9);

  y += sectionHeight + 4;

  // ══════════════════════════════════════════════
  // TOTALS (Subtotal, IVA 15%, Total banner)
  // ══════════════════════════════════════════════

  if (y + 28 > PAGE_HEIGHT - MARGIN) {
    doc.addPage();
    y = MARGIN + 5;
  }

  const tx = PAGE_WIDTH - MARGIN - 75;
  const tw = 75;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...DARK_TEXT);
  doc.text("SUBTOTAL", tx, y + 3.5);
  doc.text(formatMoney(proforma.subTotalProforma), tx + tw, y + 3.5, { align: "right" });
  y += 5.5;

  doc.text("IVA (15%)", tx, y + 3.5);
  doc.text(formatMoney(proforma.ivaProforma), tx + tw, y + 3.5, { align: "right" });
  y += 5.5;

  doc.setDrawColor(...GRAY_BORDER);
  doc.setLineWidth(0.3);
  doc.line(tx, y, tx + tw, y);
  y += 3;

  // ── Banner Total a Pagar ──
  doc.setFillColor(...BLUE);
  doc.rect(tx - 3, y + 1, tw + 6, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...WHITE);
  doc.text("TOTAL A PAGAR", tx, y + 6);
  doc.text(formatMoney(proforma.totalProforma), tx + tw, y + 6, { align: "right" });
  y += 12;

  // ══════════════════════════════════════════════
  // NORMA DE REFERENCIA
  // ══════════════════════════════════════════════

  if (proforma.compararResultadosNorma) {
    if (y + 15 > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...BLUE);
    doc.text("NORMA DE REFERENCIA", MARGIN, y);
    y += 1;
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y + 1, PAGE_WIDTH - MARGIN, y + 1);
    y += 4.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...DARK_TEXT);
    const normaLines = doc.splitTextToSize(proforma.compararResultadosNorma, CONTENT_WIDTH);
    doc.text(normaLines, MARGIN, y);
    y += normaLines.length * 3.5 + 4;
  }

  // ══════════════════════════════════════════════
  // OBSERVATIONS
  // ══════════════════════════════════════════════

  if (proforma.observacionProforma) {
    if (y + 20 > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...BLUE);
    doc.text("OBSERVACIONES", MARGIN, y);
    y += 1;
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, y + 1, PAGE_WIDTH - MARGIN, y + 1);
    y += 4.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...DARK_TEXT);
    const obsLines = doc.splitTextToSize(proforma.observacionProforma, CONTENT_WIDTH);
    doc.text(obsLines, MARGIN, y);
    y += obsLines.length * 3.5 + 4;
  }

  // ══════════════════════════════════════════════
  // WATERMARK (aprobada / rechazada)
  // ══════════════════════════════════════════════

  if (proforma.estado === "Aprobada" || proforma.estado === "Rechazada") {
    const stampColor = proforma.estado === "Aprobada" ? [22, 163, 74] : [220, 38, 38];

    doc.saveGraphicsState();
    doc.setGState(new GState({ opacity: 0.1 }));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(42);
    doc.setTextColor(...stampColor);
    doc.text(proforma.estado, PAGE_WIDTH / 2, 145, {
      align: "center",
      angle: -30,
    });
    doc.restoreGraphicsState();
  }

  // ══════════════════════════════════════════════
  // FOOTER (todas las páginas)
  // ══════════════════════════════════════════════

  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setDrawColor(...GRAY_BORDER);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, 262, PAGE_WIDTH - MARGIN, 262);

    doc.setFontSize(6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRAY_TEXT);
    doc.text(
      `Documento generado por el sistema CIRA UNAN — ${new Date().toLocaleDateString("es-NI", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })} ${new Date().toLocaleTimeString("es-NI", {
        hour: "2-digit",
        minute: "2-digit",
      })}`,
      MARGIN,
      267,
    );
    doc.text(`Página ${i} de ${totalPages}`, PAGE_WIDTH - MARGIN, 267, {
      align: "right",
    });
  }

  doc.save(`Proforma_${numero.replace(/[/\\]/g, "-")}.pdf`);
}
