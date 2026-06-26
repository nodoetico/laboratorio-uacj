import { prisma } from "./bd";

export type SesionActivaDTO = {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  heartbeat: Date;
  createdAt: Date;
};

const UMBRAL_ACTIVO_MIN = 5;
const UMBRAL_LIMPIEZA_MIN = 10;

export async function registrarSesionActiva(userId: number, token: string) {
  await prisma.activeSession.create({
    data: { userId, token, heartbeat: new Date() },
  });
}

export async function eliminarSesionActiva(token: string) {
  await prisma.activeSession.delete({ where: { token } }).catch(() => {});
}

export async function actualizarHeartbeat(token: string) {
  await prisma.activeSession
    .update({
      where: { token },
      data: { heartbeat: new Date() },
    })
    .catch(() => {});
}

export async function obtenerSesionesActivas(): Promise<SesionActivaDTO[]> {
  const threshold = new Date(
    Date.now() - UMBRAL_ACTIVO_MIN * 60 * 1000
  );
  const sessions = await prisma.activeSession.findMany({
    where: { heartbeat: { gte: threshold } },
    include: {
      user: { select: { name: true, email: true, role: true } },
    },
    orderBy: { heartbeat: "desc" },
  });
  return sessions.map((s) => ({
    id: s.id,
    userId: s.userId,
    userName: s.user.name,
    userEmail: s.user.email,
    userRole: s.user.role,
    heartbeat: s.heartbeat,
    createdAt: s.createdAt,
  }));
}

export async function contarSesionesActivas(): Promise<number> {
  const threshold = new Date(
    Date.now() - UMBRAL_ACTIVO_MIN * 60 * 1000
  );
  return prisma.activeSession.count({
    where: { heartbeat: { gte: threshold } },
  });
}

export async function limpiarSesionesExpiradas() {
  const threshold = new Date(
    Date.now() - UMBRAL_LIMPIEZA_MIN * 60 * 1000
  );
  await prisma.activeSession.deleteMany({
    where: { heartbeat: { lt: threshold } },
  });
}
