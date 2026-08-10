import { prisma } from "@/lib/bd";
import { registrarAuditoria } from "./auditoria";
import { notificarAdmin } from "./notificaciones";
import { notificarExperimentoCompletado } from "./email";

export async function crearExperimento(
  usuarioId: number,
  datos: {
    titulo: string;
    contaminante: string;
    masaMaterial: number;
    volumenSolucion: number;
    concentracionInicial: number;
    agitacion?: number;
    temperatura?: number;
    ph?: number;
  }
) {
  const experimento = await prisma.experiment.create({
    data: {
      userId: usuarioId,
      title: datos.titulo,
      contaminant: datos.contaminante,
      materialMass: datos.masaMaterial,
      solutionVolume: datos.volumenSolucion,
      initialConcentration: datos.concentracionInicial,
      agitation: datos.agitacion ?? null,
      temperature: datos.temperatura ?? null,
      ph: datos.ph ?? null,
      replicates: {
        create: [
          { replicateNum: 1 },
          { replicateNum: 2 },
          { replicateNum: 3 },
        ],
      },
    },
  });

  await registrarAuditoria(
    usuarioId,
    "CREAR",
    "Experimento",
    experimento.id,
    `Experimento "${datos.titulo}" creado con 3 réplicas`
  );

  return experimento;
}

export async function agregarMedicion(
  usuarioId: number,
  replicaId: number,
  tiempoHoras: number,
  absorbancia: number
) {
  const medicion = await prisma.measurement.create({
    data: {
      replicateId: replicaId,
      timeHours: tiempoHoras,
      absorbance: absorbancia,
    },
  });

  await registrarAuditoria(
    usuarioId,
    "AGREGAR_MEDICION",
    "Measurement",
    medicion.id,
    `Medición: t=${tiempoHoras}h, Abs=${absorbancia}`
  );

  return medicion;
}

export async function actualizarMedicion(
  usuarioId: number,
  medicionId: number,
  tiempoHoras: number,
  absorbancia: number
) {
  const medicion = await prisma.measurement.findUnique({
    where: { id: medicionId },
    include: { replicate: { include: { experiment: { select: { userId: true } } } } },
  });

  if (!medicion) throw new Error("Medición no encontrada");
  const propietario = medicion.replicate.experiment.userId;
  if (propietario !== usuarioId) throw new Error("No autorizado");

  const actualizada = await prisma.measurement.update({
    where: { id: medicionId },
    data: { timeHours: tiempoHoras, absorbance: absorbancia },
  });

  await registrarAuditoria(
    usuarioId,
    "ACTUALIZAR",
    "Measurement",
    medicionId,
    `Medición editada: t=${tiempoHoras}h, Abs=${absorbancia}`
  );

  return actualizada;
}

export async function eliminarExperimento(
  usuarioId: number,
  role: string,
  experimentoId: number
) {
  if (role !== "ADMIN") throw new Error("Solo el administrador puede eliminar experimentos");

  const experimento = await prisma.experiment.findUnique({
    where: { id: experimentoId },
    select: { title: true },
  });
  if (!experimento) throw new Error("Experimento no encontrado");

  await prisma.measurement.deleteMany({
    where: { replicate: { experimentId: experimentoId } },
  });
  await prisma.experimentReplicate.deleteMany({
    where: { experimentId: experimentoId },
  });
  await prisma.experiment.delete({ where: { id: experimentoId } });

  await registrarAuditoria(
    usuarioId,
    "ELIMINAR",
    "Experimento",
    experimentoId,
    `Experimento "${experimento.title}" eliminado por administrador`
  );

  return { success: true };
}

export async function eliminarMedicion(
  usuarioId: number,
  role: string,
  medicionId: number
) {
  const medicion = await prisma.measurement.findUnique({
    where: { id: medicionId },
    include: { replicate: { include: { experiment: { select: { userId: true, title: true } } } } },
  });

  if (!medicion) throw new Error("Medición no encontrada");

  const propietario = medicion.replicate.experiment.userId;
  if (propietario !== usuarioId && role !== "ADMIN") {
    throw new Error("No autorizado");
  }

  await prisma.measurement.delete({ where: { id: medicionId } });

  await registrarAuditoria(
    usuarioId,
    "ELIMINAR",
    "Measurement",
    medicionId,
    `Medición eliminada: t=${medicion.timeHours}h, Abs=${medicion.absorbance} del experimento "${medicion.replicate.experiment.title}"`
  );

  return { success: true };
}

export async function finalizarExperimento(
  usuarioId: number,
  experimentoId: number
) {
  const experimento = await prisma.experiment.update({
    where: { id: experimentoId },
    data: { status: "completed", completedAt: new Date() },
    include: { user: { select: { name: true } } },
  });

  await registrarAuditoria(
    usuarioId,
    "FINALIZAR",
    "Experimento",
    experimentoId,
    `Experimento "${experimento.title}" finalizado`
  );

  await notificarAdmin(
    "experimento_completado",
    `Experimento completado: ${experimento.title}`,
    `${experimento.user.name} finalizó el experimento "${experimento.title}"`,
    `/dashboard/experiments/${experimentoId}`
  );

  try {
    await notificarExperimentoCompletado(experimento.user.name, experimento.title, experimentoId);
  } catch (error) {
    console.error("Error al enviar notificación por email:", error);
  }

  return experimento;
}
