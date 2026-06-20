import { prisma } from "./bd";
import type { Prisma } from "../generated/prisma/client";
import type { UsuarioDTO, ExperimentoDTO, EquipoDTO, UsoEquipoDTO, AsistenciaDTO } from "./tipos";

export async function obtenerUsuarios(): Promise<UsuarioDTO[]> {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: "asc" },
  });
}

export async function obtenerExperimentos(userId?: number): Promise<ExperimentoDTO[]> {
  const where = userId ? { userId } : {};
  return prisma.experiment.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      replicates: {
        include: { measurements: true },
        orderBy: { replicateNum: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function obtenerExperimento(id: number): Promise<ExperimentoDTO | null> {
  return prisma.experiment.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      replicates: {
        include: { measurements: { orderBy: { timeHours: "asc" } } },
        orderBy: { replicateNum: "asc" },
      },
    },
  });
}

export async function obtenerEquipos(): Promise<EquipoDTO[]> {
  return prisma.equipment.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
}

export async function obtenerUsoEquipos(equipmentId?: number): Promise<UsoEquipoDTO[]> {
  const where = equipmentId ? { equipmentId } : {};
  return prisma.equipmentUsage.findMany({
    where,
    include: {
      equipment: { select: { id: true, name: true } },
      user: { select: { name: true } },
    },
    orderBy: { startAt: "desc" },
    take: 50,
  }).then(rows => rows.map(r => ({
    id: r.id,
    equipmentId: r.equipmentId,
    equipmentName: r.equipment.name,
    userName: r.user.name,
    startAt: r.startAt,
    endAt: r.endAt,
    description: r.description,
  })));
}

export async function obtenerAsistencia(
  userId?: number,
  from?: Date,
  to?: Date
): Promise<AsistenciaDTO[]> {
  const where: Prisma.AttendanceWhereInput = {};
  if (userId) where.userId = userId;
  if (from || to) {
    where.checkIn = {};
    if (from) where.checkIn.gte = from;
    if (to) where.checkIn.lte = to;
  }
  return prisma.attendance.findMany({
    where,
    include: { user: { select: { name: true } } },
    orderBy: { checkIn: "desc" },
    take: 100,
  }).then(rows => rows.map(r => ({
    id: r.id,
    userId: r.userId,
    userName: r.user.name,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    type: r.type,
    duration: r.checkOut
      ? Math.round((r.checkOut.getTime() - r.checkIn.getTime()) / 3600000 * 100) / 100
      : null,
  })));
}
