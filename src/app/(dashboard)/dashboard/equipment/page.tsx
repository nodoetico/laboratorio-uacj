import { verificarSesion } from "@/lib/autenticacion";
import { obtenerEquipos, obtenerUsoEquiposPaginado } from "@/lib/datos";
import { registrarUsoEquipo, configurarMantenimiento } from "@/servicios/equipos";
import { formatearFechaHora, formatearFechaCorta } from "@/lib/formatear";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Paginacion } from "@/components/Paginacion";

export default async function EquipmentPage(props: {
  searchParams: Promise<{ desde?: string; hasta?: string; pagina?: string }>;
}) {
  const session = await verificarSesion();
  if (!session) redirect("/login");

  const searchParams = await props.searchParams;
  const desde = searchParams.desde ? new Date(`${searchParams.desde}T00:00:00`) : undefined;
  const hasta = searchParams.hasta ? new Date(`${searchParams.hasta}T23:59:59`) : undefined;
  const pagina = parseInt(searchParams.pagina ?? "1");
  const paginaValida = isNaN(pagina) ? 1 : pagina;

  const equipments = await obtenerEquipos();
  const { registros: usage, total, paginas } = await obtenerUsoEquiposPaginado({
    from: desde && !isNaN(desde.getTime()) ? desde : undefined,
    to: hasta && !isNaN(hasta.getTime()) ? hasta : undefined,
    pagina: paginaValida,
    porPagina: 15,
  });
  const ahora = new Date();
  const isAdmin = session.role === "ADMIN";

  const equiposConEstado = equipments.map((eq) => ({
    ...eq,
    necesitaMantenimiento: eq.lastMaintenance
      ? (ahora.getTime() - eq.lastMaintenance.getTime()) / 86400000 > eq.maintenanceDays
      : true,
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Equipos</h1>
          <p className="text-sm text-zinc-500">Bitácora digital de uso de equipos</p>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-1">
            <a
              href="/api/exportar/equipos?formato=excel"
              target="_blank"
              className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
            >
              Excel
            </a>
            <a
              href="/api/exportar/equipos?formato=pdf"
              target="_blank"
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              PDF
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {equiposConEstado.map((eq) => (
            <div key={eq.id} className="rounded-xl bg-white border border-zinc-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-zinc-900">{eq.name}</h3>
                  {eq.model && <p className="text-xs text-zinc-400">{eq.model}</p>}
                  {eq.lastMaintenance && (
                    <p className="text-xs text-zinc-400 mt-1">
                      Último mantenimiento: {formatearFechaCorta(eq.lastMaintenance)} · intervalo: {eq.maintenanceDays} días
                    </p>
                  )}
                </div>
                <span className={`text-xs rounded-full px-2 py-0.5 ${
                  eq.necesitaMantenimiento ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                }`}>
                  {eq.necesitaMantenimiento ? "Mantenimiento requerido" : "OK"}
                </span>
              </div>

              {isAdmin && (
                <form action={handleConfigurarMantenimiento} className="mt-2 flex items-end gap-2">
                  <input type="hidden" name="equipoId" value={eq.id} />
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Intervalo de mantenimiento (días)</label>
                    <input
                      name="dias"
                      type="number"
                      min="1"
                      step="1"
                      defaultValue={eq.maintenanceDays}
                      className="w-28 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
                  >
                    Guardar
                  </button>
                </form>
              )}

              <form action={handleRegistrarUso} className="mt-3 grid grid-cols-2 gap-2">
                <input type="hidden" name="equipoId" value={eq.id} />
                <div className="col-span-2">
                  <label className="block text-xs text-zinc-400 mb-1">Descripción de uso</label>
                  <input name="descripcion" required
                    className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Ej: Pesaje de muestra X" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-zinc-400 mb-1">Sustancia</label>
                  <input name="sustancia"
                    className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Ej: Azul de metileno" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Inicio</label>
                  <input name="inicio" type="datetime-local" required
                    className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900" />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Fin</label>
                  <input name="fin" type="datetime-local"
                    className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900" />
                </div>
                <button type="submit" className="col-span-2 rounded-lg bg-zinc-800 py-1.5 text-sm text-white hover:bg-zinc-900 transition-colors">
                  Registrar uso
                </button>
              </form>
            </div>
        ))}
      </div>

      <section className="rounded-xl bg-white border border-zinc-200 p-5">
        <h2 className="font-semibold text-zinc-900 mb-3">Últimos usos registrados</h2>
        <form method="get" className="mb-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Desde</label>
            <input
              name="desde"
              type="date"
              defaultValue={searchParams.desde ?? ""}
              className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Hasta</label>
            <input
              name="hasta"
              type="date"
              defaultValue={searchParams.hasta ?? ""}
              className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-white hover:bg-zinc-900 transition-colors"
          >
            Filtrar
          </button>
          {(searchParams.desde || searchParams.hasta) && (
            <a
              href="/dashboard/equipment"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Limpiar
            </a>
          )}
        </form>
        {usage.length === 0 ? (
          <p className="text-sm text-zinc-400">Sin registros</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="border-b border-zinc-200">
                <tr>
                  <th className="text-left py-2 text-zinc-500 font-medium">Equipo</th>
                  <th className="text-left py-2 text-zinc-500 font-medium">Usuario</th>
                  <th className="text-left py-2 text-zinc-500 font-medium">Matrícula</th>
                  <th className="text-left py-2 text-zinc-500 font-medium">Sustancia</th>
                  <th className="text-left py-2 text-zinc-500 font-medium">Inicio</th>
                  <th className="text-left py-2 text-zinc-500 font-medium">Fin</th>
                  <th className="text-left py-2 text-zinc-500 font-medium">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {usage.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2 text-zinc-900">{u.equipmentName}</td>
                    <td className="py-2 text-zinc-600">{u.userName}</td>
                    <td className="py-2 text-zinc-600 font-mono text-xs">{u.userStudentId ?? "—"}</td>
                    <td className="py-2 text-zinc-600">{u.substance ?? "—"}</td>
                    <td className="py-2 text-zinc-600">{formatearFechaHora(u.startAt)}</td>
                    <td className="py-2 text-zinc-600">{u.endAt ? formatearFechaHora(u.endAt) : "\u2014"}</td>
                    <td className="py-2 text-zinc-600">{u.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Paginacion pagina={paginaValida} totalPaginas={paginas} />
          </div>
        )}
      </section>
    </div>
  );
}

async function handleRegistrarUso(formData: FormData) {
  "use server";
  const session = await verificarSesion();
  if (!session) throw new Error("No autorizado");

  await registrarUsoEquipo(
    session.userId,
    parseInt(formData.get("equipoId") as string),
    formData.get("descripcion") as string,
    new Date(formData.get("inicio") as string),
    formData.get("fin") ? new Date(formData.get("fin") as string) : undefined,
    (formData.get("sustancia") as string) || undefined
  );

  revalidatePath("/dashboard/equipment");
}

async function handleConfigurarMantenimiento(formData: FormData) {
  "use server";
  const session = await verificarSesion();
  if (!session) throw new Error("No autorizado");

  await configurarMantenimiento(
    session.userId,
    session.role,
    parseInt(formData.get("equipoId") as string),
    parseInt(formData.get("dias") as string)
  );

  revalidatePath("/dashboard/equipment");
}
