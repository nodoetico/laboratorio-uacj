import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import type { ExperimentoDTO, AsistenciaDTO, UsoEquipoDTO, ReactivoDTO } from "@/lib/tipos";
import type { ReporteAsistenciaMensual } from "@/servicios/asistencia";
import { formatearFechaCorta, formatearFechaHora, formatearHora } from "@/lib/formatear";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// ---------------------------------------------------------------------------
// Utilidades PDF
// ---------------------------------------------------------------------------

function pdfToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

// Caracteres fuera de WinAnsi (la fuente base Helvetica no los soporta).
const MAPA_UNICODE: Record<string, string> = {
  "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4",
  "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9",
  "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4",
  "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9",
  "–": "-", "—": "-", "“": '"', "”": '"', "‘": "'", "’": "'",
  "…": "...", "•": "-", "×": "x", "·": ".", "°": "°",
};

function sanitizarPDF(texto: string | null | undefined): string {
  if (!texto) return "";
  let limpio = "";
  for (const ch of String(texto)) {
    const code = ch.codePointAt(0) ?? 0;
    if (code <= 0x00ff) {
      limpio += ch;
    } else {
      limpio += MAPA_UNICODE[ch] ?? "";
    }
  }
  return limpio.replace(/\s+/g, " ").trim();
}

type Alineacion = "left" | "center" | "right";

type ColumnaPDF = {
  header: string;
  width: number; // ancho relativo en puntos; se normaliza al ancho útil
  align?: Alineacion;
};

type TablaPDFConfig = {
  columnas: ColumnaPDF[];
  filas: string[][];
  startY: number;
  fontSize?: number;
  headerFill?: string;
  zebraFill?: string;
  textColor?: string;
  borderColor?: string;
  padX?: number;
  padY?: number;
};

const COLOR_TITULO = "#1F4E78";
const COLOR_TEXTO = "#1A1A1A";
const COLOR_ENCABEZADO = "#1F4E78";
const COLOR_ZEBRA = "#F2F6FB";
const COLOR_BORDE = "#9AA4B0";

function dibujarTituloPDF(doc: PDFKit.PDFDocument, titulo: string, subtitulo?: string) {
  doc.fontSize(17).font("Helvetica-Bold").fillColor(COLOR_TITULO).text(sanitizarPDF(titulo), { align: "center" });
  if (subtitulo) {
    doc.fontSize(9).font("Helvetica").fillColor("#666666").text(sanitizarPDF(subtitulo), { align: "center" });
  }
  doc.moveDown(0.8);
}

function drawPdfTable(doc: PDFKit.PDFDocument, cfg: TablaPDFConfig): number {
  const mL = doc.page.margins.left;
  const mR = doc.page.margins.right;
  const usable = doc.page.width - mL - mR;
  const pageBottom = doc.page.height - doc.page.margins.bottom;

  const fontSize = cfg.fontSize ?? 9;
  const padX = cfg.padX ?? 4;
  const padY = cfg.padY ?? 5;
  const headerFill = cfg.headerFill ?? COLOR_ENCABEZADO;
  const zebraFill = cfg.zebraFill ?? COLOR_ZEBRA;
  const borderColor = cfg.borderColor ?? COLOR_BORDE;

  const totalAncho = cfg.columnas.reduce((s, c) => s + c.width, 0);
  const widths = cfg.columnas.map((c) => Math.max(20, (c.width / totalAncho) * usable));
  const xs: number[] = [];
  let acc = mL;
  for (const w of widths) {
    xs.push(acc);
    acc += w;
  }
  const rightEdge = mL + usable;

  const medirTexto = (texto: string, ancho: number) =>
    doc.heightOfString(texto, { width: ancho - 2 * padX });

  let y = cfg.startY;

  const dibujarEncabezado = () => {
    doc.font("Helvetica-Bold").fontSize(fontSize);
    const alto = Math.max(...cfg.columnas.map((c, i) => medirTexto(sanitizarPDF(c.header), widths[i]))) + 2 * padY;

    if (y + alto > pageBottom) {
      doc.addPage();
      y = doc.page.margins.top;
    }

    doc.save();
    doc.fillColor(headerFill);
    cfg.columnas.forEach((c, i) => {
      doc.rect(xs[i], y, widths[i], alto).fill();
    });
    doc.restore();

    doc.save();
    doc.font("Helvetica-Bold").fontSize(fontSize);
    cfg.columnas.forEach((c, i) => {
      const tw = widths[i] - 2 * padX;
      const th = medirTexto(sanitizarPDF(c.header), widths[i]);
      const ty = y + Math.max(0, (alto - th) / 2);
      doc.fillColor("#FFFFFF").text(sanitizarPDF(c.header), xs[i] + padX, ty, {
        width: tw,
        align: "center",
      });
    });
    doc.restore();

    dibujarRejilla(y, alto, widths.length);
    y += alto;
  };

  const dibujarRejilla = (yTop: number, alto: number, numCols: number) => {
    doc.save();
    doc.lineWidth(0.6).strokeColor(borderColor);
    for (let i = 0; i <= numCols; i++) {
      const x = i === 0 ? mL : i === numCols ? rightEdge : xs[i];
      doc.moveTo(x, yTop).lineTo(x, yTop + alto).stroke();
    }
    doc.moveTo(mL, yTop).lineTo(rightEdge, yTop).stroke();
    doc.moveTo(mL, yTop + alto).lineTo(rightEdge, yTop + alto).stroke();
    doc.restore();
  };

  dibujarEncabezado();

  doc.font("Helvetica").fontSize(fontSize);
  for (let r = 0; r < cfg.filas.length; r++) {
    const fila = cfg.filas[r].map((c) => sanitizarPDF(c));

    doc.font("Helvetica").fontSize(fontSize);
    let alto = 0;
    fila.forEach((txt, i) => {
      alto = Math.max(alto, medirTexto(txt, widths[i]));
    });
    alto += 2 * padY;

    if (y + alto > pageBottom) {
      doc.addPage();
      y = doc.page.margins.top;
      doc.font("Helvetica-Bold").fontSize(fontSize);
      const altoHdr = Math.max(...cfg.columnas.map((c, i) => medirTexto(sanitizarPDF(c.header), widths[i]))) + 2 * padY;
      doc.save();
      doc.fillColor(headerFill);
      cfg.columnas.forEach((c, i) => doc.rect(xs[i], y, widths[i], altoHdr).fill());
      doc.restore();
      doc.save();
      doc.font("Helvetica-Bold").fontSize(fontSize);
      cfg.columnas.forEach((c, i) => {
        const tw = widths[i] - 2 * padX;
        const th = medirTexto(sanitizarPDF(c.header), widths[i]);
        doc.fillColor("#FFFFFF").text(sanitizarPDF(c.header), xs[i] + padX, y + Math.max(0, (altoHdr - th) / 2), {
          width: tw,
          align: "center",
        });
      });
      doc.restore();
      dibujarRejilla(y, altoHdr, widths.length);
      y += altoHdr;
    }

    if (r % 2 === 1) {
      doc.save();
      doc.fillColor(zebraFill);
      doc.rect(mL, y, usable, alto).fill();
      doc.restore();
    }

    doc.font("Helvetica").fontSize(fontSize);
    fila.forEach((txt, i) => {
      const tw = widths[i] - 2 * padX;
      const th = medirTexto(txt, widths[i]);
      const align = cfg.columnas[i].align ?? "left";
      const ty = y + Math.max(0, (alto - th) / 2);
      doc.fillColor(COLOR_TEXTO).text(txt, xs[i] + padX, ty, { width: tw, align });
    });

    dibujarRejilla(y, alto, widths.length);
    y += alto;
  }

  doc.x = mL;
  return y + 6;
}

// ---------------------------------------------------------------------------
// Utilidades Excel
// ---------------------------------------------------------------------------

type ColumnaExcel = {
  header: string;
  key: string;
  width: number;
  align?: Alineacion;
  wrap?: boolean;
};

const EXCEL_HEADER_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } } as const;
const EXCEL_ZEBRA_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F6FB" } } as const;
const EXCEL_BORDE = {
  top: { style: "thin", color: { argb: "FFC9D3E0" } },
  left: { style: "thin", color: { argb: "FFC9D3E0" } },
  bottom: { style: "thin", color: { argb: "FFC9D3E0" } },
  right: { style: "thin", color: { argb: "FFC9D3E0" } },
} as ExcelJS.Borders;

function crearHojaExcel(
  workbook: ExcelJS.Workbook,
  nombreHoja: string,
  columnas: ColumnaExcel[],
  filas: Record<string, unknown>[]
): ExcelJS.Worksheet {
  const sheet = workbook.addWorksheet(nombreHoja, {
    views: [{ state: "frozen", ySplit: 1 }],
  });

  sheet.columns = columnas.map((c) => ({ header: c.header, key: c.key, width: c.width }));

  const headerRow = sheet.getRow(1);
  headerRow.height = 24;
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
    cell.fill = EXCEL_HEADER_FILL as ExcelJS.Fill;
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = EXCEL_BORDE;
  });

  const calcularAltura = (fila: Record<string, unknown>): number => {
    let lineas = 1;
    columnas.forEach((c) => {
      const valor = fila[c.key];
      if (!c.wrap || valor === null || valor === undefined) return;
      const texto = String(valor);
      const porLinea = Math.max(8, Math.floor(c.width * 0.9));
      lineas = Math.max(lineas, Math.ceil(texto.length / porLinea));
    });
    return Math.max(18, lineas * 15);
  };

  filas.forEach((fila, i) => {
    const row = sheet.addRow(fila);
    row.height = calcularAltura(fila);
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const col = columnas[colNumber - 1];
      cell.border = EXCEL_BORDE;
      cell.alignment = {
        vertical: "middle",
        horizontal: col?.align ?? "left",
        wrapText: col?.wrap ?? false,
      };
      if (i % 2 === 1) {
        cell.fill = EXCEL_ZEBRA_FILL as ExcelJS.Fill;
      }
    });
  });

  if (filas.length > 0) {
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: filas.length + 1, column: columnas.length },
    };
  }

  sheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
  };

  return sheet;
}

// === EXPERIMENTOS ===

export async function exportarExperimentosExcel(experimentos: ExperimentoDTO[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  crearHojaExcel(
    workbook,
    "Resumen",
    [
      { header: "ID", key: "id", width: 8, align: "center" },
      { header: "Título", key: "title", width: 30, wrap: true },
      { header: "Estudiante", key: "student", width: 22, wrap: true },
      { header: "Contaminante", key: "contaminant", width: 22, wrap: true },
      { header: "Masa (g)", key: "mass", width: 12, align: "right" },
      { header: "Volumen (mL)", key: "volume", width: 13, align: "right" },
      { header: "Conc. inicial (mg/L)", key: "concentration", width: 18, align: "right" },
      { header: "Fecha creación", key: "createdAt", width: 15, align: "center" },
      { header: "Fecha finalización", key: "completedAt", width: 15, align: "center" },
    ],
    experimentos.map((exp) => ({
      id: exp.id,
      title: exp.title,
      student: exp.user.name,
      contaminant: exp.contaminant,
      mass: exp.materialMass,
      volume: exp.solutionVolume,
      concentration: exp.initialConcentration,
      createdAt: formatearFechaCorta(exp.createdAt),
      completedAt: exp.completedAt ? formatearFechaCorta(exp.completedAt) : "",
    }))
  );

  const measRows: Record<string, unknown>[] = [];
  for (const exp of experimentos) {
    for (const rep of exp.replicates) {
      for (const m of rep.measurements) {
        measRows.push({
          expId: exp.id,
          title: exp.title,
          student: exp.user.name,
          replica: rep.replicateNum,
          time: m.timeHours,
          absorbance: m.absorbance,
        });
      }
    }
  }

  crearHojaExcel(
    workbook,
    "Mediciones",
    [
      { header: "Experimento ID", key: "expId", width: 14, align: "center" },
      { header: "Título", key: "title", width: 30, wrap: true },
      { header: "Estudiante", key: "student", width: 22, wrap: true },
      { header: "Réplica", key: "replica", width: 9, align: "center" },
      { header: "Tiempo (h)", key: "time", width: 12, align: "right" },
      { header: "Absorbancia", key: "absorbance", width: 14, align: "right" },
    ],
    measRows
  );

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function exportarExperimentosPDF(experimentos: ExperimentoDTO[]): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 30, size: "LETTER" });
  doc.lineGap(4);
  doc.fillColor(COLOR_TEXTO);

  dibujarTituloPDF(doc, "Experimentos Completados", `Generado: ${formatearFechaHora(new Date())}`);

  doc.fontSize(11).font("Helvetica-Bold").fillColor(COLOR_TITULO).text("Resumen");
  doc.moveDown(0.3);

  const headers = ["ID", "Título", "Estudiante", "Contaminante", "Creado", "Completado"];
  const rows = experimentos.map((exp) => [
    String(exp.id),
    exp.title,
    exp.user.name,
    exp.contaminant,
    formatearFechaCorta(exp.createdAt),
    exp.completedAt ? formatearFechaCorta(exp.completedAt) : "",
  ]);

  const y = drawPdfTable(doc, {
    columnas: [
      { header: headers[0], width: 42, align: "center" },
      { header: headers[1], width: 152 },
      { header: headers[2], width: 112 },
      { header: headers[3], width: 110 },
      { header: headers[4], width: 68, align: "center" },
      { header: headers[5], width: 68, align: "center" },
    ],
    filas: rows,
    startY: doc.y,
  });
  doc.y = y;

  for (const exp of experimentos) {
    if (doc.y > doc.page.height - 100) {
      doc.addPage();
    }

    doc.fontSize(11).font("Helvetica-Bold").fillColor(COLOR_TITULO).text(
      sanitizarPDF(`${exp.title} — ${exp.user.name}`)
    );
    doc.moveDown(0.3);

    for (const rep of exp.replicates) {
      if (rep.measurements.length === 0) continue;

      if (doc.y > doc.page.height - 80) {
        doc.addPage();
      }

      doc.fontSize(10).font("Helvetica-Bold").fillColor("#444444").text(`Réplica ${rep.replicateNum}`);
      doc.moveDown(0.2);

      const mRows = rep.measurements.map((m) => [String(m.timeHours), String(m.absorbance)]);
      doc.y = drawPdfTable(doc, {
        columnas: [
          { header: "Tiempo (h)", width: 276, align: "center" },
          { header: "Absorbancia", width: 276, align: "center" },
        ],
        filas: mRows,
        startY: doc.y,
      });
    }
  }

  return pdfToBuffer(doc);
}

// === ASISTENCIA ===

const TIPO_MAPA: Record<string, string> = {
  research: "Investigación",
  service: "Servicio Social",
  teorico: "Teórico",
};

export async function exportarAsistenciaExcel(asistencia: AsistenciaDTO[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  crearHojaExcel(
    workbook,
    "Asistencia",
    [
      { header: "Usuario", key: "user", width: 26, wrap: true },
      { header: "Matrícula", key: "studentId", width: 14, align: "center" },
      { header: "Entrada", key: "checkIn", width: 20, align: "center" },
      { header: "Salida", key: "checkOut", width: 20, align: "center" },
      { header: "Duración (h)", key: "duration", width: 13, align: "right" },
      { header: "Tipo", key: "type", width: 18, align: "center" },
    ],
    asistencia.map((r) => ({
      user: r.userName,
      studentId: r.userStudentId || "",
      checkIn: formatearFechaHora(r.checkIn),
      checkOut: r.checkOut ? formatearFechaHora(r.checkOut) : "En laboratorio",
      duration: r.duration !== null ? Number(r.duration.toFixed(2)) : "",
      type: TIPO_MAPA[r.type] || r.type,
    }))
  );

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function exportarAsistenciaPDF(asistencia: AsistenciaDTO[]): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 30, size: "LETTER" });
  doc.lineGap(4);
  doc.fillColor(COLOR_TEXTO);

  dibujarTituloPDF(doc, "Registro de Asistencia", `Generado: ${formatearFechaHora(new Date())}`);

  const rows = asistencia.map((r) => [
    r.userName,
    r.userStudentId || "",
    formatearFechaHora(r.checkIn),
    r.checkOut ? formatearFechaHora(r.checkOut) : "En laboratorio",
    r.duration !== null ? `${r.duration.toFixed(2)}` : "",
    TIPO_MAPA[r.type] || r.type,
  ]);

  drawPdfTable(doc, {
    columnas: [
      { header: "Usuario", width: 120 },
      { header: "Matrícula", width: 62, align: "center" },
      { header: "Entrada", width: 92, align: "center" },
      { header: "Salida", width: 92, align: "center" },
      { header: "Duración (h)", width: 68, align: "center" },
      { header: "Tipo", width: 118, align: "center" },
    ],
    filas: rows,
    startY: doc.y,
  });

  return pdfToBuffer(doc);
}

// === ASISTENCIA MENSUAL ===

export async function exportarAsistenciaMensualExcel(
  reporte: ReporteAsistenciaMensual
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  for (const usuario of reporte.usuarios) {
    const registrosPorDia = new Map<number, (typeof usuario.registros)[number]>();
    for (const r of usuario.registros) {
      registrosPorDia.set(r.dia, r);
    }

    const filas: Record<string, unknown>[] = [];
    for (let dia = 1; dia <= reporte.diasDelMes; dia++) {
      const r = registrosPorDia.get(dia);
      filas.push({
        dia,
        entrada: r ? formatearHora(r.entrada) : "",
        salida: r ? formatearHora(r.salida) : "",
        horas: r ? Number(r.horas.toFixed(2)) : "",
        firma: "",
      });
    }

    const totalHoras = usuario.registros.reduce((acc, r) => acc + r.horas, 0);
    filas.push({ dia: "TOTAL", entrada: "", salida: "", horas: Number(totalHoras.toFixed(2)), firma: "" });

    const hoja = crearHojaExcel(
      workbook,
      usuario.name.length > 28 ? usuario.name.substring(0, 28) : usuario.name,
      [
        { header: "Día", key: "dia", width: 8, align: "center" },
        { header: "Entrada", key: "entrada", width: 14, align: "center" },
        { header: "Salida", key: "salida", width: 14, align: "center" },
        { header: "Horas", key: "horas", width: 10, align: "center" },
        { header: "Firma", key: "firma", width: 20 },
      ],
      filas
    );

    const totalRow = hoja.getRow(hoja.rowCount);
    totalRow.font = { bold: true };
    totalRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDDE7F3" } } as ExcelJS.Fill;
    });
  }

  const resumenRows = reporte.usuarios.map((usuario) => {
    const diasAsistidos = new Set(usuario.registros.map((r) => r.dia)).size;
    const totalHoras = usuario.registros.reduce((acc, r) => acc + r.horas, 0);
    return {
      name: usuario.name,
      studentId: usuario.studentId ?? "",
      dias: diasAsistidos,
      horas: Number(totalHoras.toFixed(2)),
    };
  });

  crearHojaExcel(
    workbook,
    "Resumen",
    [
      { header: "Estudiante", key: "name", width: 32, wrap: true },
      { header: "Matrícula", key: "studentId", width: 14, align: "center" },
      { header: "Días asistidos", key: "dias", width: 14, align: "center" },
      { header: "Total horas", key: "horas", width: 12, align: "center" },
    ],
    resumenRows
  );

  workbook.title = `Formato de Asistencia Mensual - ${MESES[reporte.mes - 1]} ${reporte.anio}`;

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function exportarAsistenciaMensualPDF(
  reporte: ReporteAsistenciaMensual
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });
  doc.lineGap(4);
  doc.fillColor(COLOR_TEXTO);

  dibujarTituloPDF(
    doc,
    `Formato de Asistencia Mensual - ${MESES[reporte.mes - 1]} ${reporte.anio}`,
    `Generado: ${formatearFechaHora(new Date())}`
  );

  for (const usuario of reporte.usuarios) {
    if (doc.y > doc.page.height - 120) {
      doc.addPage();
    }

    doc.fontSize(11).font("Helvetica-Bold").fillColor(COLOR_TITULO).text(
      sanitizarPDF(`${usuario.name}${usuario.studentId ? ` - Matrícula: ${usuario.studentId}` : ""}`)
    );
    doc.moveDown(0.3);

    const registrosPorDia = new Map<number, (typeof usuario.registros)[number]>();
    for (const r of usuario.registros) {
      registrosPorDia.set(r.dia, r);
    }

    const rows = Array.from({ length: reporte.diasDelMes }, (_, i) => i + 1).map((dia) => {
      const r = registrosPorDia.get(dia);
      return [
        String(dia),
        r ? formatearHora(r.entrada) : "",
        r ? formatearHora(r.salida) : "",
        r ? `${r.horas.toFixed(2)}` : "",
        "",
      ];
    });

    const totalHoras = usuario.registros.reduce((acc, r) => acc + r.horas, 0);
    rows.push(["TOTAL", "", "", `${totalHoras.toFixed(2)}`, ""]);

    doc.y = drawPdfTable(doc, {
      columnas: [
        { header: "Día", width: 60, align: "center" },
        { header: "Entrada", width: 175, align: "center" },
        { header: "Salida", width: 175, align: "center" },
        { header: "Horas", width: 120, align: "center" },
        { header: "Firma", width: 252 },
      ],
      filas: rows,
      startY: doc.y,
    });
  }

  return pdfToBuffer(doc);
}

// === REACTIVOS ===

export async function exportarReactivosExcel(reactivos: ReactivoDTO[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  crearHojaExcel(
    workbook,
    "Inventario de Reactivos",
    [
      { header: "Nombre", key: "name", width: 38, wrap: true },
      { header: "Descripción", key: "description", width: 42, wrap: true },
      { header: "Cantidad", key: "quantity", width: 11, align: "right" },
      { header: "Envases", key: "containers", width: 9, align: "center" },
      { header: "Unidad", key: "unit", width: 10, align: "center" },
      { header: "Stock mínimo", key: "minStock", width: 13, align: "right" },
      { header: "Ubicación", key: "location", width: 18 },
      { header: "Vence", key: "expiresAt", width: 14, align: "center" },
      { header: "Estado", key: "status", width: 13, align: "center" },
    ],
    reactivos.map((r) => ({
      name: r.name,
      description: r.description ?? "",
      quantity: r.quantity,
      containers: r.containers,
      unit: r.unit,
      minStock: r.minStock,
      location: r.location ?? "",
      expiresAt: r.expiresAt ? formatearFechaCorta(r.expiresAt) : "",
      status: r.stockBajo ? "Stock bajo" : "OK",
    }))
  );

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function exportarReactivosPDF(reactivos: ReactivoDTO[]): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 30, size: "LETTER" });
  doc.lineGap(4);
  doc.fillColor(COLOR_TEXTO);

  dibujarTituloPDF(doc, "Inventario de Reactivos", `Generado: ${formatearFechaHora(new Date())}`);

  const rows = reactivos.map((r) => [
    r.name,
    String(r.quantity),
    String(r.containers),
    r.unit,
    String(r.minStock),
    r.location || "",
    r.expiresAt ? formatearFechaCorta(r.expiresAt) : "",
    r.stockBajo ? "Stock bajo" : "OK",
  ]);

  drawPdfTable(doc, {
    columnas: [
      { header: "Nombre", width: 158 },
      { header: "Cantidad", width: 58, align: "center" },
      { header: "Envases", width: 48, align: "center" },
      { header: "Unidad", width: 55, align: "center" },
      { header: "Stock mín.", width: 58, align: "center" },
      { header: "Ubicación", width: 72 },
      { header: "Vence", width: 55, align: "center" },
      { header: "Estado", width: 48, align: "center" },
    ],
    filas: rows,
    startY: doc.y,
  });

  return pdfToBuffer(doc);
}

// === EQUIPOS ===

export async function exportarEquiposExcel(uso: UsoEquipoDTO[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  crearHojaExcel(
    workbook,
    "Uso de Equipos",
    [
      { header: "Equipo", key: "equipment", width: 26, wrap: true },
      { header: "Usuario", key: "user", width: 26, wrap: true },
      { header: "Matrícula", key: "studentId", width: 14, align: "center" },
      { header: "Sustancia", key: "substance", width: 24, wrap: true },
      { header: "Inicio", key: "start", width: 20, align: "center" },
      { header: "Fin", key: "end", width: 20, align: "center" },
      { header: "Descripción", key: "description", width: 42, wrap: true },
    ],
    uso.map((u) => ({
      equipment: u.equipmentName,
      user: u.userName,
      studentId: u.userStudentId || "",
      substance: u.substance || "",
      start: formatearFechaHora(u.startAt),
      end: u.endAt ? formatearFechaHora(u.endAt) : "",
      description: u.description,
    }))
  );

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function exportarEquiposPDF(uso: UsoEquipoDTO[]): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 30, size: "LETTER" });
  doc.lineGap(4);
  doc.fillColor(COLOR_TEXTO);

  dibujarTituloPDF(doc, "Bitácora de Uso de Equipos", `Generado: ${formatearFechaHora(new Date())}`);

  const rows = uso.map((u) => [
    u.equipmentName,
    u.userName,
    u.userStudentId || "",
    u.substance || "",
    formatearFechaHora(u.startAt),
    u.endAt ? formatearFechaHora(u.endAt) : "",
    u.description,
  ]);

  drawPdfTable(doc, {
    columnas: [
      { header: "Equipo", width: 96 },
      { header: "Usuario", width: 92 },
      { header: "Matrícula", width: 58, align: "center" },
      { header: "Sustancia", width: 84 },
      { header: "Inicio", width: 68, align: "center" },
      { header: "Fin", width: 68, align: "center" },
      { header: "Descripción", width: 86 },
    ],
    filas: rows,
    startY: doc.y,
  });

  return pdfToBuffer(doc);
}
