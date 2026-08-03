import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import type { ExperimentoDTO, AsistenciaDTO, UsoEquipoDTO, ReactivoDTO } from "@/lib/tipos";
import type { ReporteAsistenciaMensual } from "@/servicios/asistencia";
import { formatearFechaCorta, formatearFechaHora, formatearHora } from "@/lib/formatear";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function pdfToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

function drawPdfTable(
  doc: PDFKit.PDFDocument,
  headers: string[],
  rows: string[][],
  startY: number,
): number {
  const marginLeft = doc.page.margins.left;
  const pageWidth = doc.page.width - marginLeft - doc.page.margins.right;
  const colWidth = pageWidth / headers.length;
  const rowHeight = 20;
  let y = startY;

  const drawHeader = (yPos: number) => {
    doc.font("Helvetica-Bold").fontSize(8);
    headers.forEach((h, i) => {
      doc.text(h, marginLeft + i * colWidth + 2, yPos + 4, { width: colWidth - 4, align: "left" });
    });
    doc.moveTo(marginLeft, yPos + rowHeight - 2)
      .lineTo(marginLeft + pageWidth, yPos + rowHeight - 2)
      .stroke();
  };

  drawHeader(y);
  y += rowHeight;

  doc.font("Helvetica").fontSize(8);
  for (const row of rows) {
    if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      y = doc.page.margins.top;
      drawHeader(y);
      y += rowHeight;
      doc.font("Helvetica").fontSize(8);
    }
    row.forEach((cell, i) => {
      doc.text(cell, marginLeft + i * colWidth + 2, y + 4, { width: colWidth - 4, align: "left" });
    });
    y += rowHeight;
  }

  return y;
}

// === EXPERIMENTOS ===

export async function exportarExperimentosExcel(experimentos: ExperimentoDTO[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  const summarySheet = workbook.addWorksheet("Resumen");
  summarySheet.columns = [
    { header: "ID", key: "id", width: 8 },
    { header: "Título", key: "title", width: 30 },
    { header: "Estudiante", key: "student", width: 20 },
    { header: "Contaminante", key: "contaminant", width: 20 },
    { header: "Masa (g)", key: "mass", width: 12 },
    { header: "Volumen (mL)", key: "volume", width: 14 },
    { header: "Concentración inicial (mg/L)", key: "concentration", width: 26 },
    { header: "Fecha creación", key: "createdAt", width: 16 },
    { header: "Fecha finalización", key: "completedAt", width: 16 },
  ];
  summarySheet.getRow(1).font = { bold: true };

  for (const exp of experimentos) {
    summarySheet.addRow({
      id: exp.id,
      title: exp.title,
      student: exp.user.name,
      contaminant: exp.contaminant,
      mass: exp.materialMass,
      volume: exp.solutionVolume,
      concentration: exp.initialConcentration,
      createdAt: formatearFechaCorta(exp.createdAt),
      completedAt: exp.completedAt ? formatearFechaCorta(exp.completedAt) : "",
    });
  }

  const measSheet = workbook.addWorksheet("Mediciones");
  measSheet.columns = [
    { header: "Experimento ID", key: "expId", width: 14 },
    { header: "Título", key: "title", width: 30 },
    { header: "Estudiante", key: "student", width: 20 },
    { header: "Réplica", key: "replica", width: 8 },
    { header: "Tiempo (h)", key: "time", width: 12 },
    { header: "Absorbancia", key: "absorbance", width: 14 },
  ];
  measSheet.getRow(1).font = { bold: true };

  for (const exp of experimentos) {
    for (const rep of exp.replicates) {
      for (const m of rep.measurements) {
        measSheet.addRow({
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

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function exportarExperimentosPDF(experimentos: ExperimentoDTO[]): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 30, size: "LETTER" });

  doc.fontSize(16).font("Helvetica-Bold").text("Experimentos Completados", { align: "center" });
  doc.fontSize(8).font("Helvetica").text(`Generado: ${formatearFechaHora(new Date())}`, { align: "center" });
  doc.moveDown(1);

  const headers = ["ID", "Título", "Estudiante", "Contaminante", "Creado", "Completado"];
  const rows = experimentos.map((exp) => [
    String(exp.id),
    exp.title,
    exp.user.name,
    exp.contaminant,
    formatearFechaCorta(exp.createdAt),
    exp.completedAt ? formatearFechaCorta(exp.completedAt) : "",
  ]);

  doc.fontSize(11).font("Helvetica-Bold").text("Resumen");
  doc.moveDown(0.3);
  const y = drawPdfTable(doc, headers, rows, doc.y);
  doc.y = y + 10;

  for (const exp of experimentos) {
    if (doc.y > doc.page.height - 100) {
      doc.addPage();
    }

    doc.fontSize(10).font("Helvetica-Bold").text(`${exp.title} — ${exp.user.name}`);
    doc.moveDown(0.2);

    for (const rep of exp.replicates) {
      if (rep.measurements.length === 0) continue;

      if (doc.y > doc.page.height - 80) {
        doc.addPage();
      }

      doc.fontSize(9).font("Helvetica").text(`Réplica ${rep.replicateNum}`);
      doc.moveDown(0.2);

      const mHeaders = ["Tiempo (h)", "Absorbancia"];
      const mRows = rep.measurements.map((m) => [String(m.timeHours), String(m.absorbance)]);
      doc.y = drawPdfTable(doc, mHeaders, mRows, doc.y) + 5;
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
  const sheet = workbook.addWorksheet("Asistencia");

  sheet.columns = [
    { header: "Usuario", key: "user", width: 25 },
    { header: "Matrícula", key: "studentId", width: 14 },
    { header: "Entrada", key: "checkIn", width: 22 },
    { header: "Salida", key: "checkOut", width: 22 },
    { header: "Duración (h)", key: "duration", width: 14 },
    { header: "Tipo", key: "type", width: 18 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const r of asistencia) {
    sheet.addRow({
      user: r.userName,
      studentId: r.userStudentId || "",
      checkIn: formatearFechaHora(r.checkIn),
      checkOut: r.checkOut ? formatearFechaHora(r.checkOut) : "En laboratorio",
      duration: r.duration !== null ? Number(r.duration.toFixed(2)) : "",
      type: TIPO_MAPA[r.type] || r.type,
    });
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function exportarAsistenciaPDF(asistencia: AsistenciaDTO[]): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 30, size: "LETTER" });

  doc.fontSize(16).font("Helvetica-Bold").text("Registro de Asistencia", { align: "center" });
  doc.fontSize(8).font("Helvetica").text(`Generado: ${formatearFechaHora(new Date())}`, { align: "center" });
  doc.moveDown(1);

  const headers = ["Usuario", "Matrícula", "Entrada", "Salida", "Duración (h)", "Tipo"];
  const rows = asistencia.map((r) => [
    r.userName,
    r.userStudentId || "",
    formatearFechaHora(r.checkIn),
    r.checkOut ? formatearFechaHora(r.checkOut) : "En laboratorio",
    r.duration !== null ? `${r.duration.toFixed(2)}` : "",
    TIPO_MAPA[r.type] || r.type,
  ]);

  drawPdfTable(doc, headers, rows, doc.y);

  return pdfToBuffer(doc);
}

// === ASISTENCIA MENSUAL ===

export async function exportarAsistenciaMensualExcel(
  reporte: ReporteAsistenciaMensual
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const titulo = `Formato de Asistencia Mensual - ${MESES[reporte.mes - 1]} ${reporte.anio}`;

  for (const usuario of reporte.usuarios) {
    const sheet = workbook.addWorksheet(
      usuario.name.length > 28 ? usuario.name.substring(0, 28) : usuario.name
    );

    sheet.columns = [
      { header: "Día", key: "dia", width: 8 },
      { header: "Entrada", key: "entrada", width: 14 },
      { header: "Salida", key: "salida", width: 14 },
      { header: "Horas", key: "horas", width: 10 },
      { header: "Firma", key: "firma", width: 20 },
    ];
    sheet.getRow(1).font = { bold: true };

    const registrosPorDia = new Map<number, (typeof usuario.registros)[number]>();
    for (const r of usuario.registros) {
      registrosPorDia.set(r.dia, r);
    }

    for (let dia = 1; dia <= reporte.diasDelMes; dia++) {
      const r = registrosPorDia.get(dia);
      sheet.addRow({
        dia,
        entrada: r ? formatearHora(r.entrada) : "",
        salida: r ? formatearHora(r.salida) : "",
        horas: r ? Number(r.horas.toFixed(2)) : "",
        firma: "",
      });
    }

    const totalHoras = usuario.registros.reduce((acc, r) => acc + r.horas, 0);
    sheet.addRow({
      dia: "TOTAL",
      entrada: "",
      salida: "",
      horas: Number(totalHoras.toFixed(2)),
      firma: "",
    });
    sheet.getRow(sheet.rowCount).font = { bold: true };
  }

  const resumen = workbook.addWorksheet("Resumen");
  resumen.columns = [
    { header: "Estudiante", key: "name", width: 30 },
    { header: "Matrícula", key: "studentId", width: 14 },
    { header: "Días asistidos", key: "dias", width: 14 },
    { header: "Total horas", key: "horas", width: 12 },
  ];
  resumen.getRow(1).font = { bold: true };
  for (const usuario of reporte.usuarios) {
    const diasAsistidos = new Set(usuario.registros.map((r) => r.dia)).size;
    const totalHoras = usuario.registros.reduce((acc, r) => acc + r.horas, 0);
    resumen.addRow({
      name: usuario.name,
      studentId: usuario.studentId ?? "",
      dias: diasAsistidos,
      horas: Number(totalHoras.toFixed(2)),
    });
  }
  resumen.workbook.title = titulo;

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function exportarAsistenciaMensualPDF(
  reporte: ReporteAsistenciaMensual
): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });

  doc.fontSize(16).font("Helvetica-Bold").text(
    `Formato de Asistencia Mensual — ${MESES[reporte.mes - 1]} ${reporte.anio}`,
    { align: "center" }
  );
  doc.fontSize(8).font("Helvetica").text(
    `Generado: ${formatearFechaHora(new Date())}`,
    { align: "center" }
  );
  doc.moveDown(1);

  for (const usuario of reporte.usuarios) {
    if (doc.y > doc.page.height - 120) {
      doc.addPage();
    }

    doc.fontSize(10).font("Helvetica-Bold").text(
      `${usuario.name}${usuario.studentId ? ` — Matrícula: ${usuario.studentId}` : ""}`
    );
    doc.moveDown(0.2);

    const headers = ["Día", "Entrada", "Salida", "Horas", "Firma"];
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

    doc.y = drawPdfTable(doc, headers, rows, doc.y) + 8;
  }

  return pdfToBuffer(doc);
}

// === REACTIVOS ===

export async function exportarReactivosExcel(reactivos: ReactivoDTO[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Inventario de Reactivos");

  sheet.columns = [
    { header: "Nombre", key: "name", width: 35 },
    { header: "Descripción", key: "description", width: 40 },
    { header: "Cantidad", key: "quantity", width: 12 },
    { header: "Envases", key: "containers", width: 10 },
    { header: "Unidad", key: "unit", width: 10 },
    { header: "Stock mínimo", key: "minStock", width: 14 },
    { header: "Ubicación", key: "location", width: 18 },
    { header: "Vence", key: "expiresAt", width: 14 },
    { header: "Estado", key: "status", width: 14 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const r of reactivos) {
    sheet.addRow({
      name: r.name,
      description: r.description ?? "",
      quantity: r.quantity,
      containers: r.containers,
      unit: r.unit,
      minStock: r.minStock,
      location: r.location ?? "",
      expiresAt: r.expiresAt ? formatearFechaCorta(r.expiresAt) : "",
      status: r.stockBajo ? "Stock bajo" : "OK",
    });
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function exportarReactivosPDF(reactivos: ReactivoDTO[]): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 30, size: "LETTER" });

  doc.fontSize(16).font("Helvetica-Bold").text("Inventario de Reactivos", { align: "center" });
  doc.fontSize(8).font("Helvetica").text(`Generado: ${formatearFechaHora(new Date())}`, { align: "center" });
  doc.moveDown(1);

  const headers = ["Nombre", "Cantidad", "Envases", "Unidad", "Stock mín.", "Ubicación", "Vence", "Estado"];
  const rows = reactivos.map((r) => [
    r.name.length > 30 ? `${r.name.substring(0, 30)}...` : r.name,
    String(r.quantity),
    String(r.containers),
    r.unit,
    String(r.minStock),
    r.location || "",
    r.expiresAt ? formatearFechaCorta(r.expiresAt) : "",
    r.stockBajo ? "Stock bajo" : "OK",
  ]);

  drawPdfTable(doc, headers, rows, doc.y);

  return pdfToBuffer(doc);
}

// === EQUIPOS ===

export async function exportarEquiposExcel(uso: UsoEquipoDTO[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Uso de Equipos");

  sheet.columns = [
    { header: "Equipo", key: "equipment", width: 25 },
    { header: "Usuario", key: "user", width: 25 },
    { header: "Matrícula", key: "studentId", width: 14 },
    { header: "Sustancia", key: "substance", width: 25 },
    { header: "Inicio", key: "start", width: 22 },
    { header: "Fin", key: "end", width: 22 },
    { header: "Descripción", key: "description", width: 40 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const u of uso) {
    sheet.addRow({
      equipment: u.equipmentName,
      user: u.userName,
      studentId: u.userStudentId || "",
      substance: u.substance || "",
      start: formatearFechaHora(u.startAt),
      end: u.endAt ? formatearFechaHora(u.endAt) : "",
      description: u.description,
    });
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export async function exportarEquiposPDF(uso: UsoEquipoDTO[]): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 30, size: "LETTER" });

  doc.fontSize(16).font("Helvetica-Bold").text("Bitácora de Uso de Equipos", { align: "center" });
  doc.fontSize(8).font("Helvetica").text(`Generado: ${formatearFechaHora(new Date())}`, { align: "center" });
  doc.moveDown(1);

  const headers = ["Equipo", "Usuario", "Matrícula", "Sustancia", "Inicio", "Fin", "Descripción"];
  const rows = uso.map((u) => [
    u.equipmentName,
    u.userName,
    u.userStudentId || "",
    u.substance || "",
    formatearFechaHora(u.startAt),
    u.endAt ? formatearFechaHora(u.endAt) : "",
    u.description.length > 45 ? `${u.description.substring(0, 45)}...` : u.description,
  ]);

  drawPdfTable(doc, headers, rows, doc.y);

  return pdfToBuffer(doc);
}
