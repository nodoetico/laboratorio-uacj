import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import type { ExperimentoDTO, AsistenciaDTO, UsoEquipoDTO } from "@/lib/tipos";
import { formatearFechaCorta, formatearFechaHora } from "@/lib/formatear";

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
    { header: "Entrada", key: "checkIn", width: 22 },
    { header: "Salida", key: "checkOut", width: 22 },
    { header: "Duración (h)", key: "duration", width: 14 },
    { header: "Tipo", key: "type", width: 18 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const r of asistencia) {
    sheet.addRow({
      user: r.userName,
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

  const headers = ["Usuario", "Entrada", "Salida", "Duración (h)", "Tipo"];
  const rows = asistencia.map((r) => [
    r.userName,
    formatearFechaHora(r.checkIn),
    r.checkOut ? formatearFechaHora(r.checkOut) : "En laboratorio",
    r.duration !== null ? `${r.duration.toFixed(2)}` : "",
    TIPO_MAPA[r.type] || r.type,
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
    { header: "Inicio", key: "start", width: 22 },
    { header: "Fin", key: "end", width: 22 },
    { header: "Descripción", key: "description", width: 40 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const u of uso) {
    sheet.addRow({
      equipment: u.equipmentName,
      user: u.userName,
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

  const headers = ["Equipo", "Usuario", "Inicio", "Fin", "Descripción"];
  const rows = uso.map((u) => [
    u.equipmentName,
    u.userName,
    formatearFechaHora(u.startAt),
    u.endAt ? formatearFechaHora(u.endAt) : "",
    u.description.length > 45 ? `${u.description.substring(0, 45)}...` : u.description,
  ]);

  drawPdfTable(doc, headers, rows, doc.y);

  return pdfToBuffer(doc);
}
