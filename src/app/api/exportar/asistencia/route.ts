import { NextRequest, NextResponse } from "next/server";
import { verificarSesion } from "@/lib/autenticacion";
import { obtenerAsistencia } from "@/lib/datos";
import { exportarAsistenciaExcel, exportarAsistenciaPDF } from "@/servicios/exportar";

export async function GET(request: NextRequest) {
  const session = await verificarSesion();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const formato = searchParams.get("formato") || "excel";

  const isAdmin = session.role === "ADMIN";
  const records = await obtenerAsistencia(isAdmin ? undefined : session.userId);

  if (records.length === 0) {
    return NextResponse.json({ error: "No hay registros de asistencia" }, { status: 404 });
  }

  if (formato === "pdf") {
    const buffer = await exportarAsistenciaPDF(records);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="asistencia.pdf"',
      },
    });
  }

  const buffer = await exportarAsistenciaExcel(records);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="asistencia.xlsx"',
    },
  });
}
