import { NextRequest, NextResponse } from "next/server";
import { verificarSesion } from "@/lib/autenticacion";
import { obtenerHistorialCompleto } from "@/servicios/auditoria";
import { exportarAuditoriaPDF } from "@/servicios/exportar";

export async function GET(request: NextRequest) {
  const session = await verificarSesion();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const entidad = searchParams.get("entidad") || undefined;

  const historial = await obtenerHistorialCompleto({ entidad });

  if (historial.length === 0) {
    return NextResponse.json({ error: "No hay registros de auditoría" }, { status: 404 });
  }

  const buffer = await exportarAuditoriaPDF(historial);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="auditoria.pdf"',
    },
  });
}
