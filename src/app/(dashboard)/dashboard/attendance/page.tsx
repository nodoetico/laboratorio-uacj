import { verificarSesion } from "@/lib/autenticacion";
import { obtenerAsistencia } from "@/lib/datos";
import { registrarEntrada, registrarSalida } from "@/servicios/asistencia";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export default async function AttendancePage() {
  const session = await verificarSesion();
  if (!session) redirect("/login");

  const isAdmin = session.role === "ADMIN";
  const records = await obtenerAsistencia(isAdmin ? undefined : session.userId);
  const hasOpenSession = records.some((r) => !r.checkOut && r.userId === session.userId);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Asistencia</h1>
          <p className="text-sm text-zinc-500">Registro de entrada y salida del laboratorio</p>
        </div>
        <form action={hasOpenSession ? handleRegistrarSalida : handleRegistrarEntrada}>
          <button type="submit"
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              hasOpenSession
                ? "bg-red-600 hover:bg-red-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}>
            {hasOpenSession ? "Registrar salida" : "Registrar entrada"}
          </button>
        </form>
      </div>

      {isAdmin && (
        <div className="rounded-xl bg-white border border-zinc-200 p-5">
          <h2 className="font-semibold text-zinc-900 mb-3">Resumen de hoy</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-700">{records.filter(r => {
                const today = new Date();
                return r.checkIn.toDateString() === today.toDateString();
              }).length}</p>
              <p className="text-xs text-blue-600">Entradas hoy</p>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-2xl font-bold text-green-700">{
                records.filter(r => {
                  const today = new Date();
                  return r.checkIn.toDateString() === today.toDateString() && r.checkOut;
                }).length
              }</p>
              <p className="text-xs text-green-600">Salidas hoy</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-2xl font-bold text-purple-700">{records.filter(r => !r.checkOut).length}</p>
              <p className="text-xs text-purple-600">En laboratorio</p>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white border border-zinc-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-zinc-500">Usuario</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-500">Entrada</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-500">Salida</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-500">Duración</th>
              <th className="text-left px-4 py-3 font-medium text-zinc-500">Tipo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-zinc-50">
                <td className="px-4 py-3 font-medium text-zinc-900">{r.userName}</td>
                <td className="px-4 py-3 text-zinc-600">{new Date(r.checkIn).toLocaleString("es-MX")}</td>
                <td className="px-4 py-3 text-zinc-600">
                  {r.checkOut ? new Date(r.checkOut).toLocaleString("es-MX") : (
                    <span className="text-green-600 font-medium">En laboratorio</span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {r.duration !== null ? `${r.duration.toFixed(1)} h` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-zinc-100 text-zinc-600 rounded-full px-2 py-0.5">
                    {r.type === "research" ? "Investigación" : r.type === "service" ? "Servicio Social" : "Teórico"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function handleRegistrarEntrada() {
  "use server";
  const session = await verificarSesion();
  if (!session) throw new Error("No autorizado");

  await registrarEntrada(session.userId);
  revalidatePath("/dashboard/attendance");
}

async function handleRegistrarSalida() {
  "use server";
  const session = await verificarSesion();
  if (!session) throw new Error("No autorizado");

  await registrarSalida(session.userId);
  revalidatePath("/dashboard/attendance");
}
