"use server";

import { verificarSesion } from "@/lib/autenticacion";
import { eliminarExperimento } from "@/servicios/experimentos";
import { revalidatePath } from "next/cache";

export async function eliminarExperimentoAction(formData: FormData) {
  const session = await verificarSesion();
  if (!session) throw new Error("No autorizado");

  const id = parseInt(formData.get("id") as string);
  await eliminarExperimento(session.userId, session.role, id);

  revalidatePath("/dashboard/experiments");
}
