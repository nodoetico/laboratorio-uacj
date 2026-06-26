import { NextResponse } from "next/server";
import { verificarSesion } from "@/lib/autenticacion";
import { marcarTodasComoLeidas } from "@/servicios/notificaciones";

export async function POST() {
  const session = await verificarSesion();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  await marcarTodasComoLeidas(session.userId);
  return NextResponse.json({ success: true });
}
