import { prisma } from "@/lib/bd";
import type { Prisma } from "@/generated/prisma/client";
import type { HistorialDTO } from "@/lib/tipos";

export async function registrarAuditoria(
  usuarioId: number,
  accion: string,
  entidad: string,
  entidadId?: number,
  detalle?: string
) {
  const usuario = await prisma.user.findUnique({
    where: { id: usuarioId },
    select: { hidden: true },
  });
  if (usuario?.hidden) return;

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

export type OpcionesHistorial = {
  entidad?: string;
  entidadId?: number;
  pagina?: number;
  porPagina?: number;
};

export async function obtenerHistorial(
  opciones: OpcionesHistorial = {}
): Promise<{ registros: HistorialDTO[]; total: number; paginas: number }> {
  const { entidad, entidadId } = opciones;
  const pagina = Math.max(1, opciones.pagina ?? 1);
  const porPagina = Math.min(100, Math.max(1, opciones.porPagina ?? 25));

  const where: Prisma.AuditLogWhereInput = {};
  if (entidad) where.entidad = entidad;
  if (entidadId) where.entidadId = entidadId;

  const [registros, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    registros: registros.map((r) => ({
      id: r.id,
      accion: r.accion,
      entidad: r.entidad,
      entidadId: r.entidadId,
      detalle: r.detalle,
      createdAt: r.createdAt,
      usuario: r.user
        ? { name: r.user.name, email: r.user.email, role: r.user.role }
        : null,
    })),
    total,
    paginas: Math.max(1, Math.ceil(total / porPagina)),
  };
}
