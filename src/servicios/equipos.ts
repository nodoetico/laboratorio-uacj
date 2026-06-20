import { prisma } from "@/lib/bd";
import { registrarAuditoria } from "./auditoria";

export async function registrarUsoEquipo(
  usuarioId: number,
  equipoId: number,
  descripcion: string,
  inicio: Date,
  fin?: Date
) {
  const uso = await prisma.equipmentUsage.create({
    data: {
      equipmentId: equipoId,
      userId: usuarioId,
      description: descripcion,
      startAt: inicio,
      endAt: fin ?? null,
    },
  });

  await registrarAuditoria(
    usuarioId,
    "REGISTRAR_USO",
    "EquipmentUsage",
    uso.id,
    `Uso de equipo #${equipoId}: ${descripcion}`
  );

  return uso;
}

export async function obtenerEquiposConEstado() {
  return prisma.equipment.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}
