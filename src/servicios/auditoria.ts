import { prisma } from "@/lib/bd";
import type { Prisma } from "@/generated/prisma/client";

export async function registrarAuditoria(
  usuarioId: number,
  accion: string,
  entidad: string,
  entidadId?: number,
  detalle?: string
) {
  await prisma.auditLog.create({
    data: {
      userId: usuarioId,
      accion,
      entidad,
      entidadId,
      detalle,
    },
  });
}

export async function obtenerHistorial(
  entidad?: string,
  entidadId?: number
) {
  const where: Prisma.AuditLogWhereInput = {};
  if (entidad) where.entidad = entidad;
  if (entidadId) where.entidadId = entidadId;

  return prisma.auditLog.findMany({
    where,
    include: {
      user: { select: { name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
