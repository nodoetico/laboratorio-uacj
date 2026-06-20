import { prisma } from "@/lib/bd";
import { registrarAuditoria } from "./auditoria";

export async function crearExperimento(
  usuarioId: number,
  datos: {
    titulo: string;
    contaminante: string;
    masaMaterial: number;
    volumenSolucion: number;
    concentracionInicial: number;
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

export async function finalizarExperimento(
  usuarioId: number,
  experimentoId: number
) {
  const experimento = await prisma.experiment.update({
    where: { id: experimentoId },
    data: { status: "completed", completedAt: new Date() },
  });

  await registrarAuditoria(
    usuarioId,
    "FINALIZAR",
    "Experimento",
    experimentoId,
    `Experimento "${experimento.title}" finalizado`
  );

  return experimento;
}
