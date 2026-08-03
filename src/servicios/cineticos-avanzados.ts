import type { ReplicaDTO } from "@/lib/tipos";

export type PuntoCalculado = {
  timeHours: number;
  absorbancias: number[];
  promedio: number | null;
  ce: number | null;
  qe: number | null;
  tDivQe: number | null;
};

export type CalculosAvanzados = {
  puntos: PuntoCalculado[];
  k2: number | null;
  r2: number | null;
  mensaje: string | null;
};

export function calcularAvanzado(
  replicas: ReplicaDTO[],
  c0: number,
  volumenLitros: number,
  masaGramos: number
): CalculosAvanzados {
  // Group measurements by time across all replicates
  const timeMap = new Map<number, number[]>();

  for (const rep of replicas) {
    for (const m of rep.measurements) {
      const t = Math.round(m.timeHours * 10000) / 10000; // avoid float issues
      if (!timeMap.has(t)) timeMap.set(t, []);
      timeMap.get(t)!.push(m.absorbance);
    }
  }

  const times = Array.from(timeMap.keys()).sort((a, b) => a - b);

  if (times.length === 0) {
    return { puntos: [], k2: null, r2: null, mensaje: "No hay mediciones" };
  }

  // Find initial time (t=0) to get Abs₀
  const t0 = times.find((t) => Math.abs(t) < 0.001);
  const abs0 = t0 !== undefined
    ? timeMap.get(t0)!.reduce((s, v) => s + v, 0) / timeMap.get(t0)!.length
    : null;

  const puntos: PuntoCalculado[] = [];

  for (const t of times) {
    const absorbancias = timeMap.get(t)!;
    const promedio = absorbancias.reduce((s, v) => s + v, 0) / absorbancias.length;

    let ce: number | null = null;
    let qe: number | null = null;
    let tDivQe: number | null = null;

    if (abs0 !== null && abs0 > 0) {
      ce = (promedio / abs0) * c0;
    }

    if (ce !== null && volumenLitros > 0 && masaGramos > 0) {
      qe = ((c0 - ce) * volumenLitros) / masaGramos;
    }

    if (qe !== null && qe > 0 && t > 0) {
      tDivQe = t / qe;
    }

    puntos.push({ timeHours: t, absorbancias, promedio, ce, qe, tDivQe });
  }

  // Pseudo-second-order: linear regression of t vs t/qe
  // Only use t > 0 points where tDivQe is valid
  const validos = puntos.filter((p) => p.tDivQe !== null && p.timeHours > 0);

  if (validos.length < 2) {
    return {
      puntos,
      k2: null,
      r2: null,
      mensaje: validos.length === 0
        ? "No hay suficientes puntos para cinética de segundo orden"
        : "Se necesitan al menos 2 puntos (t>0) para segundo orden",
    };
  }

  const n = validos.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  for (const p of validos) {
    const x = p.timeHours;
    const y = p.tDivQe!;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const Sxy = sumXY - (sumX * sumY) / n;
  const Sxx = sumX2 - (sumX * sumX) / n;
  const Syy = sumY2 - (sumY * sumY) / n;

  if (Math.abs(Sxx) < 1e-15) {
    return {
      puntos,
      k2: null,
      r2: null,
      mensaje: "Varianza cero en los tiempos (segundo orden)",
    };
  }

  const pendiente = Sxy / Sxx; // = 1/qe_calc
  const intercepto = (sumY - pendiente * sumX) / n; // = 1/(K2 * qe²)
  const r2 = (Sxy * Sxy) / (Sxx * Syy);

  // K2 = 1 / (intercepto * qe_calc²) where qe_calc = 1/pendiente
  const qeCalc = 1 / pendiente;
  const k2 = qeCalc > 0 && intercepto > 0
    ? 1 / (intercepto * qeCalc * qeCalc)
    : null;

  return {
    puntos,
    k2: k2 !== null ? Math.round(k2 * 1000000) / 1000000 : null,
    r2: Math.round(r2 * 1000000) / 1000000,
    mensaje: null,
  };
}
