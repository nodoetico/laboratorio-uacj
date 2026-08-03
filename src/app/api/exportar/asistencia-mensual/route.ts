import { NextRequest, NextResponse } from "next/server";
import { verificarSesion } from "@/lib/autenticacion";
import { obtenerReporteAsistenciaMensual } from "@/servicios/asistencia";
import { exportarAsistenciaMensualExcel, exportarAsistenciaMensualPDF } from "@/servicios/exportar";

export async function GET(request: NextRequest) {
  const session = await verificarSesion();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const formato = searchParams.get("formato") || "excel";
  const anio = parseInt(searchParams.get("anio") ?? "");
  const mes = parseInt(searchParams.get("mes") ?? "");

  if (isNaN(anio) || isNaN(mes) || mes < 1 || mes > 12) {
    return NextResponse.json({ error: "Parámetros de mes/año inválidos" }, { status: 400 });
  }

  const reporte = await obtenerReporteAsistenciaMensual(anio, mes);

  if (reporte.usuarios.length === 0) {
    return NextResponse.json({ error: "No hay usuarios registrados" }, { status: 404 });
  }

  const nombreMes = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ][mes - 1];

  if (formato === "pdf") {
    const buffer = await exportarAsistenciaMensualPDF(reporte);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="asistencia-${nombreMes}-${anio}.pdf"`,
      },
    });
  }

  const buffer = await exportarAsistenciaMensualExcel(reporte);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="asistencia-${nombreMes}-${anio}.xlsx"`,
    },
  });
}
