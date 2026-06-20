import { verificarSesion } from "@/lib/autenticacion";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await verificarSesion();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, ...session });
}
