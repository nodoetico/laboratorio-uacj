import { verificarSesion } from "@/lib/autenticacion";
import { obtenerHistorial } from "@/servicios/auditoria";
import { formatearFechaHora } from "@/lib/formatear";
import { Paginacion } from "@/components/Paginacion";
import { redirect } from "next/navigation";

const ENTIDADES = [
  "Experimento",
  "Measurement",
  "EquipmentUsage",
  "Attendance",
  "Reagent",
  "ReagentMovement",
  "User",
];

const COLOR_ACCION: Record<string, string> = {
  CREAR: "bg-blue-100 text-blue-700",
  ACTUALIZAR: "bg-amber-100 text-amber-700",
  ELIMINAR: "bg-red-100 text-red-700",
  FINALIZAR: "bg-green-100 text-green-700",
  AGREGAR_MEDICION: "bg-teal-100 text-teal-700",
  REGISTRAR_USO: "bg-cyan-100 text-cyan-700",
  ENTRADA: "bg-green-100 text-green-700",
  SALIDA: "bg-red-100 text-red-700",
  ENTRADA_REACTIVO: "bg-green-100 text-green-700",
  SALIDA_REACTIVO: "bg-red-100 text-red-700",
  AJUSTAR_CANTIDAD: "bg-amber-100 text-amber-700",
};

const NOMBRE_ENTIDAD: Record<string, string> = {
  Experimento: "Experimento",
  Measurement: "Medición",
  EquipmentUsage: "Uso de equipo",
  Attendance: "Asistencia",
  Reagent: "Reactivo",
  ReagentMovement: "Movimiento de reactivo",
  User: "Usuario",
};

export default async function AuditoriaPage(props: {
  searchParams: Promise<{ entidad?: string; pagina?: string }>;
}) {
  const session = await verificarSesion();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const searchParams = await props.searchParams;
  const entidad = searchParams.entidad && ENTIDADES.includes(searchParams.entidad)
    ? searchParams.entidad
    : undefined;
  const pagina = parseInt(searchParams.pagina ?? "1");
  const paginaValida = isNaN(pagina) ? 1 : pagina;

  const { registros, total, paginas } = await obtenerHistorial({
    entidad,
    pagina: paginaValida,
    porPagina: 25,
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Auditoría (ISO 17025)</h1>
          <p className="text-sm text-zinc-500">
            Trazabilidad de todas las operaciones · {total} registros
          </p>
        </div>
      </div>

      <form method="get" className="flex items-center gap-3">
        <label className="text-sm text-zinc-500">Filtrar por entidad:</label>
        <select
          name="entidad"
          defaultValue={entidad ?? ""}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Todas</option>
          {ENTIDADES.map((e) => (
            <option key={e} value={e}>
              {NOMBRE_ENTIDAD[e] ?? e}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-900 transition-colors"
        >
          Aplicar filtro
        </button>
      </form>

      <div className="rounded-xl bg-white border border-zinc-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-zinc-500">Fecha</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-500">Usuario</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-500">Acción</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-500">Entidad</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-500">Detalle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {registros.map((r) => (
              <tr key={r.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 text-zinc-600 whitespace-nowrap text-xs">
                  {formatearFechaHora(r.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900">{r.usuario?.name ?? "—"}</p>
                  <p className="text-xs text-zinc-400">{r.usuario?.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${COLOR_ACCION[r.accion] ?? "bg-zinc-100 text-zinc-600"}`}>
                    {r.accion}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {NOMBRE_ENTIDAD[r.entidad] ?? r.entidad}
                  {r.entidadId ? ` #${r.entidadId}` : ""}
                </td>
                <td className="px-4 py-3 text-zinc-500 text-xs">{r.detalle ?? "—"}</td>
              </tr>
            ))}
            {registros.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                  No hay registros de auditoría
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Paginacion pagina={paginaValida} totalPaginas={paginas} />
    </div>
  );
}
