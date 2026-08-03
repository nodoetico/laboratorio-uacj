import { NextRequest, NextResponse } from "next/server";
import { verificarSesion } from "@/lib/autenticacion";
import { obtenerReactivos } from "@/servicios/reactivos";
import { exportarReactivosExcel, exportarReactivosPDF } from "@/servicios/exportar";

export async function GET(request: NextRequest) {
  try {
    const session = await verificarSesion();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Solo administradores" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const formato = searchParams.get("formato") || "excel";

    const reactivos = await obtenerReactivos();

    if (reactivos.length === 0) {
      return NextResponse.json({ error: "No hay reactivos en el inventario" }, { status: 404 });
    }

    if (formato === "pdf") {
      const buffer = await exportarReactivosPDF(reactivos);
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="inventario-reactivos.pdf"',
        },
      });
    }

    const buffer = await exportarReactivosExcel(reactivos);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="inventario-reactivos.xlsx"',
      },
    });
  } catch (error) {
    console.error("Error al exportar reactivos:", error);
    return NextResponse.json({ error: "Error al exportar reactivos" }, { status: 500 });
  }
}
