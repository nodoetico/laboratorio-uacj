import { prisma } from "@/lib/bd";
import { registrarAuditoria } from "./auditoria";

export async function registrarUsoEquipo(
  usuarioId: number,
  equipoId: number,
  descripcion: string,
  inicio: Date,
  fin?: Date,
  sustancia?: string
) {
  const uso = await prisma.equipmentUsage.create({
    data: {
      equipmentId: equipoId,
      userId: usuarioId,
      description: descripcion,
      substance: sustancia ?? null,
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

export async function configurarMantenimiento(
  usuarioId: number,
  role: string,
  equipoId: number,
  maintenanceDays: number
) {
  if (role !== "ADMIN") throw new Error("Solo el administrador puede configurar mantenimiento");

  const equipo = await prisma.equipment.update({
    where: { id: equipoId },
    data: { maintenanceDays: Math.max(1, Math.round(maintenanceDays)) },
    select: { id: true, name: true, maintenanceDays: true },
  });

  await registrarAuditoria(
    usuarioId,
    "ACTUALIZAR",
    "Equipment",
    equipoId,
    `Intervalo de mantenimiento configurado a ${equipo.maintenanceDays} días para "${equipo.name}"`
  );

  return equipo;
}
