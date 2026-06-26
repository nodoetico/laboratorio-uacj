import { NextResponse } from "next/server";

export async function POST() {
  const { cookies } = await import("next/headers");
  const token = (await cookies()).get("session")?.value;
  if (!token) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const { actualizarHeartbeat } = await import("@/lib/sesionesActivas");
  await actualizarHeartbeat(token);
  return NextResponse.json({ ok: true });
}
