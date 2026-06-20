import { prisma } from "@/lib/bd";
import { registrarAuditoria } from "./auditoria";

export async function registrarEntrada(usuarioId: number) {
  const asistencia = await prisma.attendance.create({
    data: {
      userId: usuarioId,
      checkIn: new Date(),
      type: "research",
    },
  });

  await registrarAuditoria(
    usuarioId,
    "ENTRADA",
    "Attendance",
    asistencia.id,
    "Registro de entrada al laboratorio"
  );

  return asistencia;
}

export async function registrarSalida(usuarioId: number) {
  const ultimaEntrada = await prisma.attendance.findFirst({
    where: { userId: usuarioId, checkOut: null },
    orderBy: { checkIn: "desc" },
  });

  if (!ultimaEntrada) return null;

  const asistencia = await prisma.attendance.update({
    where: { id: ultimaEntrada.id },
    data: { checkOut: new Date() },
  });

  const duracion = Math.round(
    (new Date().getTime() - asistencia.checkIn.getTime()) / 3600000 * 100
  ) / 100;

  await registrarAuditoria(
    usuarioId,
    "SALIDA",
    "Attendance",
    asistencia.id,
    `Registro de salida. Duración: ${duracion}h`
  );

  return asistencia;
}
