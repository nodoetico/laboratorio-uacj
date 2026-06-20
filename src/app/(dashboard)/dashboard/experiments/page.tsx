import { verificarSesion } from "@/lib/autenticacion";
import { obtenerExperimentos } from "@/lib/datos";
import Link from "next/link";

export default async function ExperimentsPage() {
  const session = await verificarSesion();
  const isAdmin = session?.role === "ADMIN";
  const experiments = await obtenerExperimentos(isAdmin ? undefined : session?.userId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Experimentación</h1>
          <p className="text-sm text-zinc-500">Registro de datos cinéticos</p>
        </div>
        <Link
          href="/dashboard/experiments/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          + Nuevo experimento
        </Link>
      </div>

      {experiments.length === 0 ? (
        <div className="rounded-xl bg-white border border-zinc-200 p-8 text-center">
          <p className="text-zinc-400">No hay experimentos registrados</p>
          <Link href="/dashboard/experiments/new" className="text-sm text-blue-600 hover:underline mt-2 inline-block">
            Crear el primero
          </Link>
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-zinc-200 overflow-hidden">
          <table className="w-full text-sm">
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
                  <td className="px-4 py-3 text-zinc-400 text-xs">
                    {new Date(exp.createdAt).toLocaleDateString("es-MX")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/dashboard/experiments/${exp.id}`} className="text-blue-600 hover:underline text-xs">
                      Ver detalle
                    </Link>
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
