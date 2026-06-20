import { eliminarSesion } from "@/lib/autenticacion";
import { redirect } from "next/navigation";

export async function GET() {
  await eliminarSesion();
  redirect("/login");
}
