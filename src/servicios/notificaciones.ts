import { prisma } from "@/lib/bd";

export async function crearNotificacion(
  usuarioId: number,
  tipo: string,
  titulo: string,
  mensaje: string,
  enlace?: string
) {
  return prisma.notification.create({
    data: {
      userId: usuarioId,
      type: tipo,
      title: titulo,
      message: mensaje,
      link: enlace,
    },
  });
}

export async function notificarAdmin(
  tipo: string,
  titulo: string,
  mensaje: string,
  enlace?: string
) {
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", active: true },
    select: { id: true },
  });

  for (const admin of admins) {
    await crearNotificacion(admin.id, tipo, titulo, mensaje, enlace);
  }
}

export async function obtenerNotificaciones(usuarioId: number, soloNoLeidas = false) {
  const where: { userId: number; read?: boolean } = { userId: usuarioId };
  if (soloNoLeidas) where.read = false;

  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function contarNoLeidas(usuarioId: number) {
  return prisma.notification.count({
    where: { userId: usuarioId, read: false },
  });
}

export async function marcarComoLeida(notificacionId: number) {
  return prisma.notification.update({
    where: { id: notificacionId },
    data: { read: true },
  });
}

export async function marcarTodasComoLeidas(usuarioId: number) {
  return prisma.notification.updateMany({
    where: { userId: usuarioId, read: false },
    data: { read: true },
  });
}
