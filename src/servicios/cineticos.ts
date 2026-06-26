export type CalculosCineticos = {
  K: number | null;
  R2: number | null;
  vidaMedia: number | null;
  semivida: number | null;
  lnA0: number | null;
  puntosValidos: number;
  mensaje: string | null;
};

type Medicion = { timeHours: number; absorbance: number };

export function calcularCinetico(mediciones: Medicion[]): CalculosCineticos {
  const validas = mediciones.filter((m) => m.absorbance > 0 && m.timeHours >= 0);

  if (validas.length < 2) {
    return {
      K: null,
      R2: null,
      vidaMedia: null,
      semivida: null,
      lnA0: null,
      puntosValidos: validas.length,
      mensaje: validas.length === 0
        ? "No hay mediciones válidas (A > 0)"
        : "Se necesitan al menos 2 mediciones válidas",
    };
  }

  const n = validas.length;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  for (const m of validas) {
    const x = m.timeHours;
    const y = Math.log(m.absorbance);
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
      K: null,
      R2: null,
      vidaMedia: null,
      semivida: null,
      lnA0: null,
      puntosValidos: n,
      mensaje: "Las mediciones tienen el mismo tiempo (varianza cero)",
    };
  }

  const m = Sxy / Sxx;
  const b = (sumY - m * sumX) / n;
  const K = -m;
  const lnA0 = b;
  const R2 = (Sxy * Sxy) / (Sxx * Syy);
  const vidaMedia = K > 0 ? Math.LN2 / K : null;
  const semivida = vidaMedia;

  return {
    K: Math.round(K * 1000000) / 1000000,
    R2: Math.round(R2 * 1000000) / 1000000,
    vidaMedia: vidaMedia !== null ? Math.round(vidaMedia * 10000) / 10000 : null,
    semivida: semivida !== null ? Math.round(semivida * 10000) / 10000 : null,
    lnA0: Math.round(lnA0 * 1000000) / 1000000,
    puntosValidos: n,
    mensaje: null,
  };
}
