import { NextRequest, NextResponse } from "next/server";
import { eliminarReactivo } from "@/servicios/reactivos";
import { verificarSesion } from "@/lib/autenticacion";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verificarSesion();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  try {
    await eliminarReactivo(session.userId, parseInt(id));
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Error al eliminar" },
      { status: 500 }
    );
  }
}
