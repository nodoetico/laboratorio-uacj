import { verificarSesion } from "@/lib/autenticacion";
import { obtenerEquipos, obtenerUsoEquipos } from "@/lib/datos";
import { registrarUsoEquipo } from "@/servicios/equipos";
import { formatearFechaHora } from "@/lib/formatear";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default async function EquipmentPage() {
  const session = await verificarSesion();
  if (!session) redirect("/login");

  const equipments = await obtenerEquipos();
  const usage = await obtenerUsoEquipos();
  const ahora = new Date();

  const equiposConEstado = equipments.map((eq) => ({
    ...eq,
    necesitaMantenimiento: eq.lastMaintenance
      ? (ahora.getTime() - eq.lastMaintenance.getTime()) / 86400000 > eq.maintenanceDays
      : true,
  }));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Equipos</h1>
        <p className="text-sm text-zinc-500">Bitácora digital de uso de equipos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {equiposConEstado.map((eq) => (
            <div key={eq.id} className="rounded-xl bg-white border border-zinc-200 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-zinc-900">{eq.name}</h3>
                  {eq.model && <p className="text-xs text-zinc-400">{eq.model}</p>}
                </div>
                <span className={`text-xs rounded-full px-2 py-0.5 ${
                  eq.necesitaMantenimiento ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                }`}>
                  {eq.necesitaMantenimiento ? "Mantenimiento requerido" : "OK"}
                </span>
              </div>

              <form action={handleRegistrarUso} className="mt-3 grid grid-cols-2 gap-2">
                <input type="hidden" name="equipoId" value={eq.id} />
                <div className="col-span-2">
                  <label className="block text-xs text-zinc-400 mb-1">Descripción de uso</label>
                  <input name="descripcion" required
                    className="w-full rounded-lg border border-zinc-300 px-2 py-1.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Ej: Pesaje de muestra X" />
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
        {usage.length === 0 ? (
          <p className="text-sm text-zinc-400">Sin registros</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead className="border-b border-zinc-200">
                <tr>
                  <th className="text-left py-2 text-zinc-500 font-medium">Equipo</th>
                  <th className="text-left py-2 text-zinc-500 font-medium">Usuario</th>
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
                    <td className="py-2 text-zinc-600">{formatearFechaHora(u.startAt)}</td>
                    <td className="py-2 text-zinc-600">{u.endAt ? formatearFechaHora(u.endAt) : "\u2014"}</td>
                    <td className="py-2 text-zinc-600">{u.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    formData.get("fin") ? new Date(formData.get("fin") as string) : undefined
  );

  revalidatePath("/dashboard/equipment");
}
