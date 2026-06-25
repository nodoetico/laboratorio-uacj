import { NextRequest, NextResponse } from "next/server";
import { verificarSesion } from "@/lib/autenticacion";
import { obtenerExperimentos } from "@/lib/datos";
import { exportarExperimentosExcel, exportarExperimentosPDF } from "@/servicios/exportar";

export async function GET(request: NextRequest) {
  const session = await verificarSesion();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (session.role !== "ADMIN") {
    return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const formato = searchParams.get("formato") || "excel";

  const experimentos = await obtenerExperimentos();
  const completados = experimentos.filter((e) => e.status === "completed");

  if (completados.length === 0) {
    return NextResponse.json({ error: "No hay experimentos completados" }, { status: 404 });
  }

  try {
    if (formato === "pdf") {
      const buffer = await exportarExperimentosPDF(completados);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="experimentos-completados.pdf"',
        },
      });
    }

    const buffer = await exportarExperimentosExcel(completados);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="experimentos-completados.xlsx"',
      },
    });
  } catch (error) {
    console.error("Error al exportar:", error);
    return NextResponse.json({ error: "Error al generar el archivo de exportación" }, { status: 500 });
  }
}
