import { prisma } from "./bd";
import type { Prisma } from "../generated/prisma/client";
import type { UsuarioDTO, ExperimentoDTO, EquipoDTO, UsoEquipoDTO, AsistenciaDTO } from "./tipos";

export async function obtenerUsuarios(): Promise<UsuarioDTO[]> {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, studentId: true, role: true },
    orderBy: { name: "asc" },
  });
}

export async function obtenerUsuario(id: number): Promise<UsuarioDTO | null> {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, studentId: true, role: true },
  });
}

export async function obtenerExperimentos(userId?: number): Promise<ExperimentoDTO[]> {
  const where = userId ? { userId } : {};
  return prisma.experiment.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true, studentId: true, role: true } },
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
      user: { select: { id: true, name: true, email: true, studentId: true, role: true } },
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
      user: { select: { name: true, studentId: true } },
    },
    orderBy: { startAt: "desc" },
    take: 50,
  }).then(rows => rows.map(r => ({
    id: r.id,
    equipmentId: r.equipmentId,
    equipmentName: r.equipment.name,
    userName: r.user.name,
    userStudentId: r.user.studentId,
    substance: r.substance,
    startAt: r.startAt,
    endAt: r.endAt,
    description: r.description,
  })));
}

export async function obtenerUsoEquiposPaginado(opciones: {
  equipmentId?: number;
  from?: Date;
  to?: Date;
  pagina?: number;
  porPagina?: number;
}): Promise<{ registros: UsoEquipoDTO[]; total: number; paginas: number }> {
  const { equipmentId, from, to } = opciones;
  const pagina = Math.max(1, opciones.pagina ?? 1);
  const porPagina = Math.min(100, Math.max(1, opciones.porPagina ?? 25));

  const where: Prisma.EquipmentUsageWhereInput = {};
  if (equipmentId) where.equipmentId = equipmentId;
  if (from || to) {
    where.startAt = {};
    if (from) where.startAt.gte = from;
    if (to) where.startAt.lte = to;
  }

  const [rows, total] = await Promise.all([
    prisma.equipmentUsage.findMany({
      where,
      include: {
        equipment: { select: { id: true, name: true } },
        user: { select: { name: true, studentId: true } },
      },
      orderBy: { startAt: "desc" },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.equipmentUsage.count({ where }),
  ]);

  return {
    registros: rows.map((r) => ({
      id: r.id,
      equipmentId: r.equipmentId,
      equipmentName: r.equipment.name,
      userName: r.user.name,
      userStudentId: r.user.studentId,
      substance: r.substance,
      startAt: r.startAt,
      endAt: r.endAt,
      description: r.description,
    })),
    total,
    paginas: Math.max(1, Math.ceil(total / porPagina)),
  };
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
    include: { user: { select: { name: true, studentId: true } } },
    orderBy: { checkIn: "desc" },
    take: 100,
  }).then(rows => rows.map(r => ({
    id: r.id,
    userId: r.userId,
    userName: r.user.name,
    userStudentId: r.user.studentId,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    type: r.type,
    duration: r.checkOut
      ? Math.round((r.checkOut.getTime() - r.checkIn.getTime()) / 3600000 * 100) / 100
      : null,
  })));
}

export async function obtenerAsistenciaPaginada(opciones: {
  userId?: number;
  from?: Date;
  to?: Date;
  pagina?: number;
  porPagina?: number;
}): Promise<{ registros: AsistenciaDTO[]; total: number; paginas: number }> {
  const { userId, from, to } = opciones;
  const pagina = Math.max(1, opciones.pagina ?? 1);
  const porPagina = Math.min(100, Math.max(1, opciones.porPagina ?? 25));

  const where: Prisma.AttendanceWhereInput = {};
  if (userId) where.userId = userId;
  if (from || to) {
    where.checkIn = {};
    if (from) where.checkIn.gte = from;
    if (to) where.checkIn.lte = to;
  }

  const [rows, total] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: { user: { select: { name: true, studentId: true } } },
      orderBy: { checkIn: "desc" },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.attendance.count({ where }),
  ]);

  return {
    registros: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.user.name,
      userStudentId: r.user.studentId,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      type: r.type,
      duration: r.checkOut
        ? Math.round((r.checkOut.getTime() - r.checkIn.getTime()) / 3600000 * 100) / 100
        : null,
    })),
    total,
    paginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}
