import { NextRequest, NextResponse } from "next/server";
import { verificarSesion } from "@/lib/autenticacion";
import { obtenerUsoEquipos } from "@/lib/datos";
import { exportarEquiposExcel, exportarEquiposPDF } from "@/servicios/exportar";

export async function GET(request: NextRequest) {
  const session = await verificarSesion();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const formato = searchParams.get("formato") || "excel";

  const records = await obtenerUsoEquipos();

  if (records.length === 0) {
    return NextResponse.json({ error: "No hay registros de uso de equipos" }, { status: 404 });
  }

  if (formato === "pdf") {
    const buffer = await exportarEquiposPDF(records);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="uso-equipos.pdf"',
      },
    });
  }

  const buffer = await exportarEquiposExcel(records);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="uso-equipos.xlsx"',
    },
  });
}
