import { verificarSesion } from "@/lib/autenticacion";
import { obtenerExperimento } from "@/lib/datos";
import { agregarMedicion, actualizarMedicion, finalizarExperimento, eliminarMedicion } from "@/servicios/experimentos";
import { calcularCinetico } from "@/servicios/cineticos";
import { calcularAvanzado } from "@/servicios/cineticos-avanzados";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { HelpButton } from "./HelpModal";
import { Grafica } from "./Grafica";
import { EditarMedicion } from "./EditarMedicion";

export default async function ExperimentDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await verificarSesion();
  if (!session) redirect("/login");

  const experimentId = parseInt(id);
  if (isNaN(experimentId)) notFound();

  const experiment = await obtenerExperimento(experimentId);
  if (!experiment) notFound();

  const isOwner = experiment.user.id === session.userId || session.role === "ADMIN";
  if (!isOwner) return <p className="text-zinc-400">No tienes acceso a este experimento</p>;

  const V = experiment.solutionVolume / 1000;
  const m = experiment.materialMass;
  const calcAvanzado = calcularAvanzado(
    experiment.replicates,
    experiment.initialConcentration,
    V,
    m
  );

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/experiments" className="text-sm text-blue-600 hover:underline mb-1 inline-block">← Volver</Link>
          <h1 className="text-2xl font-bold text-zinc-900">{experiment.title}</h1>
          <p className="text-sm text-zinc-500">
            {experiment.contaminant} · C₀ = {experiment.initialConcentration} mg/L · {experiment.user.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <HelpButton />
          {experiment.status === "in_progress" && (
            <form action={handleFinalizarExperimento}>
              <input type="hidden" name="id" value={experiment.id} />
              <button type="submit"
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors">
                Finalizar experimento
              </button>
            </form>
          )}
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${
            experiment.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
          }`}>
            {experiment.status === "completed" ? "Completado" : "En progreso"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
        <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-200">
          <span className="text-zinc-400 text-xs">Masa</span>
          <p className="font-medium">{experiment.materialMass} g</p>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-200">
          <span className="text-zinc-400 text-xs">Volumen</span>
          <p className="font-medium">{experiment.solutionVolume} mL</p>
        </div>
        <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-200">
          <span className="text-zinc-400 text-xs">C₀</span>
          <p className="font-medium">{experiment.initialConcentration} mg/L</p>
        </div>
        {experiment.agitation !== null && (
          <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-200">
            <span className="text-zinc-400 text-xs">Agitación</span>
            <p className="font-medium">{experiment.agitation} rpm</p>
          </div>
        )}
        {experiment.temperature !== null && (
          <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-200">
            <span className="text-zinc-400 text-xs">Temperatura</span>
            <p className="font-medium">{experiment.temperature} °C</p>
          </div>
        )}
        {experiment.ph !== null && (
          <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-200">
            <span className="text-zinc-400 text-xs">pH</span>
            <p className="font-medium">{experiment.ph}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
        <p><strong>Cálculos cinéticos disponibles.</strong> Las tablas muestran resultados de primer orden (por réplica) y segundo orden (promediado). Presiona <strong>?</strong> para más detalles.</p>
      </div>

      <Grafica replicas={experiment.replicates} />

      {experiment.replicates.map((replicate) => {
        const calc = calcularCinetico(replicate.measurements);
        return (
        <div key={replicate.id} className="rounded-xl bg-white border border-zinc-200 p-5">
          <h3 className="font-semibold text-zinc-900 mb-3">Réplica {replicate.replicateNum}</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-2 text-zinc-500 font-medium whitespace-nowrap">Tiempo (h)</th>
                  <th className="text-left py-2 text-zinc-500 font-medium whitespace-nowrap">Absorbancia</th>
                  <th className="text-right py-2 text-zinc-500 font-medium">Acción</th>
                </tr>
              </thead>
              <tbody>
                {replicate.measurements.map((m) => (
                  <tr key={m.id} className="border-b border-zinc-50">
                    <td className="py-2 text-zinc-900">{m.timeHours}</td>
                    <td className="py-2 text-zinc-900">{m.absorbance}</td>
                    <td className="py-2 text-right whitespace-nowrap">
                      <EditarMedicion
                        medicionId={m.id}
                        experimentoId={experiment.id}
                        tiempo={m.timeHours}
                        absorbancia={m.absorbance}
                        accion={handleEditarMedicion}
                      />
                      <form action={handleEliminarMedicion} className="inline">
                        <input type="hidden" name="medicionId" value={m.id} />
                        <input type="hidden" name="experimentoId" value={experiment.id} />
                        <button type="submit" className="text-xs text-red-500 hover:underline">Eliminar</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {calc.K !== null ? (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5 text-center">
                <span className="text-xs text-blue-500 font-medium">K (h⁻¹)</span>
                <p className="text-sm font-bold text-blue-700">{calc.K}</p>
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5 text-center">
                <span className="text-xs text-blue-500 font-medium">R²</span>
                <p className="text-sm font-bold text-blue-700">{calc.R2}</p>
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5 text-center">
                <span className="text-xs text-blue-500 font-medium">Vida media (h)</span>
                <p className="text-sm font-bold text-blue-700">{calc.vidaMedia}</p>
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5 text-center">
                <span className="text-xs text-blue-500 font-medium">ln(A₀)</span>
                <p className="text-sm font-bold text-blue-700">{calc.lnA0}</p>
              </div>
            </div>
          ) : calc.puntosValidos >= 1 ? (
            <div className="mt-3 rounded-lg bg-yellow-50 border border-yellow-200 p-2.5 text-center">
              <span className="text-xs text-yellow-600">{calc.mensaje} ({calc.puntosValidos} válida{calc.puntosValidos !== 1 ? "s" : ""})</span>
            </div>
          ) : (
            <div className="mt-3 rounded-lg bg-zinc-50 border border-zinc-200 p-2.5 text-center">
              <span className="text-xs text-zinc-400">Agrega mediciones para ver cálculos cinéticos</span>
            </div>
          )}

          <form action={handleAgregarMedicion} className="mt-3 flex items-end gap-2">
            <input type="hidden" name="replicaId" value={replicate.id} />
            <input type="hidden" name="experimentoId" value={experiment.id} />
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Tiempo (h)</label>
              <input name="tiempoHoras" type="number" step="0.1" required
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 w-24 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Absorbancia</label>
              <input name="absorbancia" type="number" step="0.0001" required
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-900 w-28 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
            </div>
            <button type="submit"
              className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-white hover:bg-zinc-900 transition-colors">
              + Agregar
            </button>
          </form>
        </div>
        );
      })}

      {calcAvanzado.puntos.length > 0 && (
        <div className="rounded-xl bg-white border border-zinc-200 p-5">
          <h3 className="font-semibold text-zinc-900 mb-1">Cálculos promediados (cinética de segundo orden)</h3>
          <p className="text-xs text-zinc-400 mb-3">
            Promedio de absorbancia por tiempo · Ce = (Abs/Abs₀) × C₀ · qe = (C₀ − Ce) × V / m · A = t/qe
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200">
                  <th className="text-left py-2 text-zinc-500 font-medium whitespace-nowrap">t (h)</th>
                  <th className="text-left py-2 text-zinc-500 font-medium whitespace-nowrap">Abs A</th>
                  <th className="text-left py-2 text-zinc-500 font-medium whitespace-nowrap">Abs B</th>
                  <th className="text-left py-2 text-zinc-500 font-medium whitespace-nowrap">Abs C</th>
                  <th className="text-left py-2 text-zinc-500 font-medium whitespace-nowrap">Promedio</th>
                  <th className="text-left py-2 text-zinc-500 font-medium whitespace-nowrap">Ce (mg/L)</th>
                  <th className="text-left py-2 text-zinc-500 font-medium whitespace-nowrap">qe (mg/g)</th>
                  <th className="text-left py-2 text-zinc-500 font-medium whitespace-nowrap">A = t/qe</th>
                </tr>
              </thead>
              <tbody>
                {calcAvanzado.puntos.map((p, i) => (
                  <tr key={i} className="border-b border-zinc-50">
                    <td className="py-2 text-zinc-900 font-mono">{p.timeHours}</td>
                    {[0, 1, 2].map((idx) => (
                      <td key={idx} className="py-2 text-zinc-600 font-mono">
                        {p.absorbancias[idx]?.toFixed(4) ?? "—"}
                      </td>
                    ))}
                    <td className="py-2 text-zinc-900 font-mono font-semibold">
                      {p.promedio?.toFixed(4) ?? "—"}
                    </td>
                    <td className="py-2 text-zinc-900 font-mono">
                      {p.ce?.toFixed(4) ?? "—"}
                    </td>
                    <td className="py-2 text-zinc-900 font-mono">
                      {p.qe?.toFixed(4) ?? "—"}
                    </td>
                    <td className="py-2 text-zinc-900 font-mono">
                      {p.tDivQe?.toFixed(4) ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-4">
            <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-center flex-1">
              <span className="text-xs text-purple-500 font-medium">K₂ (g·mg⁻¹·h⁻¹)</span>
              <p className="text-lg font-bold text-purple-700">{calcAvanzado.k2 ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-center flex-1">
              <span className="text-xs text-purple-500 font-medium">R² (segundo orden)</span>
              <p className="text-lg font-bold text-purple-700">{calcAvanzado.r2 ?? "—"}</p>
            </div>
            <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-center flex-1">
              <span className="text-xs text-purple-500 font-medium">Volumen</span>
              <p className="text-lg font-bold text-purple-700">{V} L</p>
            </div>
            <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-center flex-1">
              <span className="text-xs text-purple-500 font-medium">Masa</span>
              <p className="text-lg font-bold text-purple-700">{m} g</p>
            </div>
          </div>

          {calcAvanzado.mensaje && (
            <div className="mt-3 rounded-lg bg-yellow-50 border border-yellow-200 p-2.5 text-center">
              <span className="text-xs text-yellow-600">{calcAvanzado.mensaje}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

async function handleAgregarMedicion(formData: FormData) {
  "use server";
  const session = await verificarSesion();
  if (!session) throw new Error("No autorizado");

  const replicaId = parseInt(formData.get("replicaId") as string);
  const experimentoId = formData.get("experimentoId") as string;

  await agregarMedicion(
    session.userId,
    replicaId,
    parseFloat(formData.get("tiempoHoras") as string),
    parseFloat(formData.get("absorbancia") as string)
  );

  revalidatePath(`/dashboard/experiments/${experimentoId}`);
}

async function handleEditarMedicion(formData: FormData) {
  "use server";
  const session = await verificarSesion();
  if (!session) throw new Error("No autorizado");

  const medicionId = parseInt(formData.get("medicionId") as string);
  const experimentoId = formData.get("experimentoId") as string;

  await actualizarMedicion(
    session.userId,
    medicionId,
    parseFloat(formData.get("tiempoHoras") as string),
    parseFloat(formData.get("absorbancia") as string)
  );

  revalidatePath(`/dashboard/experiments/${experimentoId}`);
}

async function handleEliminarMedicion(formData: FormData) {
  "use server";
  const session = await verificarSesion();
  if (!session) throw new Error("No autorizado");

  const medicionId = parseInt(formData.get("medicionId") as string);
  const experimentoId = formData.get("experimentoId") as string;

  await eliminarMedicion(session.userId, session.role, medicionId);
  revalidatePath(`/dashboard/experiments/${experimentoId}`);
}

async function handleFinalizarExperimento(formData: FormData) {
  "use server";
  const session = await verificarSesion();
  if (!session) throw new Error("No autorizado");

  const id = parseInt(formData.get("id") as string);
  await finalizarExperimento(session.userId, id);

  revalidatePath(`/dashboard/experiments/${id}`);
}
