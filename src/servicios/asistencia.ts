import { prisma } from "@/lib/bd";
import { registrarAuditoria } from "./auditoria";

export type RegistroDiaAsistencia = {
  dia: number;
  entrada: Date | null;
  salida: Date | null;
  horas: number;
};

export type ReporteAsistenciaMensual = {
  anio: number;
  mes: number;
  diasDelMes: number;
  usuarios: Array<{
    id: number;
    name: string;
    studentId: string | null;
    role: string;
    registros: RegistroDiaAsistencia[];
  }>;
};

export async function obtenerReporteAsistenciaMensual(
  anio: number,
  mes: number
): Promise<ReporteAsistenciaMensual> {
  const inicio = new Date(anio, mes - 1, 1);
  const fin = new Date(anio, mes, 1);
  const diasDelMes = new Date(anio, mes, 0).getDate();

  const [usuarios, asistencias] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["STUDENT", "SERVICE"] } },
      select: { id: true, name: true, studentId: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.attendance.findMany({
      where: { checkIn: { gte: inicio, lt: fin } },
      select: { userId: true, checkIn: true, checkOut: true },
      orderBy: { checkIn: "asc" },
    }),
  ]);

  const registrosPorUsuario = new Map<number, RegistroDiaAsistencia[]>();
  for (const a of asistencias) {
    const dia = a.checkIn.getDate();
    const horas = a.checkOut
      ? Math.round(((a.checkOut.getTime() - a.checkIn.getTime()) / 3600000) * 100) / 100
      : 0;
    const lista = registrosPorUsuario.get(a.userId) ?? [];
    lista.push({ dia, entrada: a.checkIn, salida: a.checkOut, horas });
    registrosPorUsuario.set(a.userId, lista);
  }

  return {
    anio,
    mes,
    diasDelMes,
    usuarios: usuarios.map((u) => ({
      id: u.id,
      name: u.name,
      studentId: u.studentId,
      role: u.role,
      registros: registrosPorUsuario.get(u.id) ?? [],
    })),
  };
}

export async function registrarEntrada(usuarioId: number, tipo: string = "research") {
  const tipoValido = ["research", "service", "teorico"].includes(tipo) ? tipo : "research";

  const asistencia = await prisma.attendance.create({
    data: {
      userId: usuarioId,
      checkIn: new Date(),
      type: tipoValido,
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
