import { verificarSesion } from "@/lib/autenticacion";
import { obtenerExperimentos } from "@/lib/datos";
import { formatearFechaCorta } from "@/lib/formatear";
import Link from "next/link";
import { DeleteButton } from "./DeleteButton";

export default async function ExperimentsPage() {
  const session = await verificarSesion();
  const isAdmin = session?.role === "ADMIN";
  const experiments = await obtenerExperimentos(isAdmin ? undefined : session?.userId);
  const hasCompleted = experiments.filter((e) => e.status === "completed").length > 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Experimentación</h1>
          <p className="text-sm text-zinc-500">Registro de datos cinéticos</p>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && hasCompleted && (
            <div className="flex items-center gap-1">
              <a
                href="/api/exportar/experimentos?formato=excel"
                target="_blank"
                className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
              >
                Excel
              </a>
              <a
                href="/api/exportar/experimentos?formato=pdf"
                target="_blank"
                className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
              >
                PDF
              </a>
            </div>
          )}
          <Link
            href="/dashboard/experiments/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            + Nuevo experimento
          </Link>
        </div>
      </div>

      {experiments.length === 0 ? (
        <div className="rounded-xl bg-white border border-zinc-200 p-8 text-center">
          <p className="text-zinc-400">No hay experimentos registrados</p>
          <Link href="/dashboard/experiments/new" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            Crear el primero
          </Link>
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-zinc-200 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Título</th>
                {isAdmin && <th className="text-left px-4 py-3 font-medium text-zinc-500">Estudiante</th>}
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Contaminante</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Estado</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Fecha</th>
                <th className="text-right px-4 py-3 font-medium text-zinc-500">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {experiments.map((exp) => (
                <tr key={exp.id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-zinc-900">{exp.title}</td>
                  {isAdmin && <td className="px-4 py-3 text-zinc-500">{exp.user.name}</td>}
                  <td className="px-4 py-3 text-zinc-600">{exp.contaminant}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      exp.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                    }`}>
                      {exp.status === "completed" ? "Completado" : "En progreso"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                    {formatearFechaCorta(exp.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right flex items-center justify-end gap-2">
                    <Link href={`/dashboard/experiments/${exp.id}`} className="text-blue-600 hover:underline text-xs">
                      Ver detalle
                    </Link>
                    {isAdmin && <DeleteButton experimentId={exp.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
