import { verificarSesion } from "@/lib/autenticacion";
import { obtenerExperimento } from "@/lib/datos";
import { agregarMedicion, finalizarExperimento } from "@/servicios/experimentos";
import { prisma } from "@/lib/bd";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function ExperimentDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const session = await verificarSesion();
  if (!session) redirect("/login");

  const experimentId = parseInt(id);
  if (isNaN(experimentId)) return <p className="text-zinc-400">ID de experimento inválido</p>;

  const experiment = await obtenerExperimento(experimentId);
  if (!experiment) return <p className="text-zinc-400">Experimento no encontrado</p>;

  const isOwner = experiment.user.id === session.userId || session.role === "ADMIN";
  if (!isOwner) return <p className="text-zinc-400">No tienes acceso a este experimento</p>;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/experiments" className="text-sm text-blue-600 hover:underline mb-1 inline-block">← Volver</Link>
          <h1 className="text-2xl font-bold text-zinc-900">{experiment.title}</h1>
          <p className="text-sm text-zinc-500">
            {experiment.contaminant} · C₀ = {experiment.initialConcentration} · {experiment.user.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
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

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-200"><span className="text-zinc-400">Masa</span><p className="font-medium">{experiment.materialMass} g</p></div>
        <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-200"><span className="text-zinc-400">Volumen</span><p className="font-medium">{experiment.solutionVolume} mL</p></div>
        <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-200"><span className="text-zinc-400">C₀</span><p className="font-medium">{experiment.initialConcentration}</p></div>
      </div>

      {experiment.replicates.map((replicate) => (
        <div key={replicate.id} className="rounded-xl bg-white border border-zinc-200 p-5">
          <h3 className="font-semibold text-zinc-900 mb-3">Réplica {replicate.replicateNum}</h3>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="text-left py-2 text-zinc-500 font-medium">Tiempo (h)</th>
                <th className="text-left py-2 text-zinc-500 font-medium">Absorbancia</th>
                <th className="text-right py-2 text-zinc-500 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {replicate.measurements.map((m) => (
                <tr key={m.id} className="border-b border-zinc-50">
                  <td className="py-2 text-zinc-900">{m.timeHours}</td>
                  <td className="py-2 text-zinc-900">{m.absorbance}</td>
                  <td className="py-2 text-right">
                    <form action={handleEliminarMedicion}>
                      <input type="hidden" name="medicionId" value={m.id} />
                      <input type="hidden" name="experimentoId" value={experiment.id} />
                      <button type="submit" className="text-xs text-red-500 hover:underline">Eliminar</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

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
      ))}
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

async function handleEliminarMedicion(formData: FormData) {
  "use server";
  const session = await verificarSesion();
  if (!session) throw new Error("No autorizado");

  const medicionId = parseInt(formData.get("medicionId") as string);
  const experimentoId = formData.get("experimentoId") as string;

  await prisma.measurement.delete({ where: { id: medicionId } });
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
