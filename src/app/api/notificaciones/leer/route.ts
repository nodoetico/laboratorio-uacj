import { NextRequest, NextResponse } from "next/server";
import { verificarSesion } from "@/lib/autenticacion";
import { marcarComoLeida } from "@/servicios/notificaciones";

export async function POST(request: NextRequest) {
  const session = await verificarSesion();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await request.json();
  await marcarComoLeida(id);
  return NextResponse.json({ success: true });
}
