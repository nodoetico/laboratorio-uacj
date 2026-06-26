import { verificarSesion } from "@/lib/autenticacion";
import { obtenerExperimentos, obtenerUsuarios, obtenerAsistencia, obtenerEquipos } from "@/lib/datos";
import { obtenerSesionesActivas, contarSesionesActivas, limpiarSesionesExpiradas } from "@/lib/sesionesActivas";
import { formatearHora, esMismoDia } from "@/lib/formatear";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await verificarSesion();
  if (!session) return null;

  const isAdmin = session.role === "ADMIN";
  const experiments = await obtenerExperimentos(isAdmin ? undefined : session.userId);
  const users = isAdmin ? await obtenerUsuarios() : [];
  const equipments = await obtenerEquipos();
  const attendance = isAdmin ? await obtenerAsistencia() : [];

  const activeExperiments = experiments.filter((e) => e.status === "in_progress");
  const completedExperiments = experiments.filter((e) => e.status === "completed");

  const todayEntries = attendance.filter((r) => esMismoDia(r.checkIn));
  const inLab = todayEntries.filter((r) => !r.checkOut);
  const checkedOut = todayEntries.filter((r) => r.checkOut);

  if (isAdmin) {
    await limpiarSesionesExpiradas();
  }

  const [activeSessions, sessionCount] = isAdmin
    ? await Promise.all([obtenerSesionesActivas(), contarSesionesActivas()])
    : [[], 0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-zinc-500 text-sm">
          {isAdmin ? "Vista general del laboratorio" : "Mis experimentos"}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
        <StatCard label="Experimentación" value={`${activeExperiments.length} activos`} sub={`${completedExperiments.length} completados`} color="blue" />
        <StatCard label="Equipos" value={`${equipments.length} registrados`} sub="Ver estado" color="green" />
        {isAdmin && <StatCard label="Usuarios" value={`${users.length} registrados`} sub="Estudiantes y personal" color="purple" />}
        <StatCard label="Hoy en laboratorio" value={`${inLab.length} presentes`} sub={`${checkedOut.length} salidas · ${todayEntries.length} total`} color="amber" />
        {isAdmin && <StatCard label="Sesiones activas" value={`${sessionCount} ahora`} sub="Usuarios en el sistema" color="cyan" />}
      </div>

      {isAdmin && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="rounded-xl bg-white border border-zinc-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-zinc-900">En laboratorio ahora</h2>
                <Link href="/dashboard/attendance" className="text-xs text-blue-600 hover:underline">Ver todas</Link>
              </div>
              {inLab.length === 0 ? (
                <p className="text-sm text-zinc-400">Nadie en el laboratorio en este momento</p>
              ) : (
                <div className="space-y-2">
                  {inLab.map((r) => (
                    <div key={r.id} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-sm font-medium text-zinc-900">{r.userName}</span>
                      </div>
                      <span className="text-xs text-zinc-400">{formatearHora(r.checkIn)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl bg-white border border-zinc-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-zinc-900">Sesiones activas</h2>
                <span className="text-xs text-zinc-400">Heartbeat &lt; 5 min</span>
              </div>
              {activeSessions.length === 0 ? (
                <p className="text-sm text-zinc-400">Nadie conectado en este momento</p>
              ) : (
                <div className="space-y-2">
                  {activeSessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-sm font-medium text-zinc-900">{s.userName}</span>
                      </div>
                      <span className="text-xs text-zinc-400">
                        {s.userRole === "ADMIN" ? "Admin" : s.userRole === "SERVICE" ? "Servicio" : "Estudiante"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="rounded-xl bg-white border border-zinc-200 p-5">
            <h2 className="font-semibold text-zinc-900 mb-3">Experimentación en curso</h2>
            {activeExperiments.length === 0 ? (
              <p className="text-sm text-zinc-400">Sin experimentos activos</p>
            ) : (
              <div className="space-y-2">
                {activeExperiments.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                    <div>
                      <Link href={`/dashboard/experiments/${exp.id}`} className="font-medium text-sm text-zinc-900 hover:text-blue-600">
                        {exp.title}
                      </Link>
                      <p className="text-xs text-zinc-400">{exp.user.name} · {exp.contaminant}</p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">En progreso</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl bg-white border border-zinc-200 p-5">
            <h2 className="font-semibold text-zinc-900 mb-3">Usuarios registrados</h2>
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{u.name}</p>
                    <p className="text-xs text-zinc-400">{u.email}</p>
                  </div>
                  <span className={`text-xs rounded-full px-2 py-0.5 ${
                    u.role === "ADMIN" ? "bg-purple-100 text-purple-700" :
                    u.role === "SERVICE" ? "bg-blue-100 text-blue-700" :
                    "bg-green-100 text-green-700"
                  }`}>
                    {u.role === "ADMIN" ? "Administrador" : u.role === "SERVICE" ? "Servicio Social" : "Estudiante"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <section className="rounded-xl bg-white border border-zinc-200 p-5">
        <h2 className="font-semibold text-zinc-900 mb-3">Acceso rápido</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link href="/dashboard/experiments/new" className="rounded-lg border border-zinc-200 p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <span className="text-lg">🔬</span>
            <p className="font-medium text-sm text-zinc-900 mt-1">Nuevo experimento</p>
            <p className="text-xs text-zinc-400">Registrar datos cinéticos</p>
          </Link>
          <Link href="/dashboard/equipment" className="rounded-lg border border-zinc-200 p-4 hover:border-green-300 hover:bg-green-50 transition-colors">
            <span className="text-lg">⚙️</span>
            <p className="font-medium text-sm text-zinc-900 mt-1">Uso de equipos</p>
            <p className="text-xs text-zinc-400">Bitácora digital</p>
          </Link>
          <Link href="/dashboard/attendance" className="rounded-lg border border-zinc-200 p-4 hover:border-purple-300 hover:bg-purple-50 transition-colors">
            <span className="text-lg">📋</span>
            <p className="font-medium text-sm text-zinc-900 mt-1">Asistencia</p>
            <p className="text-xs text-zinc-400">Check-in / Check-out</p>
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50",
    green: "border-green-200 bg-green-50",
    purple: "border-purple-200 bg-purple-50",
    amber: "border-amber-200 bg-amber-50",
    cyan: "border-cyan-200 bg-cyan-50",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-bold text-zinc-900 mt-1">{value}</p>
      <p className="text-xs text-zinc-400 mt-0.5">{sub}</p>
    </div>
  );
}
