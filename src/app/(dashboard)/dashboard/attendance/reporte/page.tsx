import { verificarSesion } from "@/lib/autenticacion";
import { obtenerReporteAsistenciaMensual } from "@/servicios/asistencia";
import { obtenerUsuarios } from "@/lib/datos";
import { formatearHora } from "@/lib/formatear";
import { redirect } from "next/navigation";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default async function ReporteAsistenciaPage(props: {
  searchParams: Promise<{ anio?: string; mes?: string; usuario?: string }>;
}) {
  const session = await verificarSesion();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") redirect("/dashboard");

  const searchParams = await props.searchParams;
  const ahora = new Date();
  const anio = parseInt(searchParams.anio ?? "") || ahora.getFullYear();
  const mes = parseInt(searchParams.mes ?? "") || ahora.getMonth() + 1;
  const usuarioId = searchParams.usuario ? parseInt(searchParams.usuario) : undefined;

  const [reporte, usuarios] = await Promise.all([
    obtenerReporteAsistenciaMensual(anio, mes),
    obtenerUsuarios(),
  ]);

  const usuariosEstudiantes = usuarios.filter((u) =>
    u.role === "STUDENT" || u.role === "SERVICE"
  );

  const usuarioSeleccionado = usuarioId
    ? reporte.usuarios.find((u) => u.id === usuarioId)
    : undefined;

  const registrosPorDia = new Map<number, (typeof reporte.usuarios)[number]["registros"][number]>();
  if (usuarioSeleccionado) {
    for (const r of usuarioSeleccionado.registros) {
      registrosPorDia.set(r.dia, r);
    }
  }

  const exportarUrl = (formato: string) =>
    `/api/exportar/asistencia-mensual?anio=${anio}&mes=${mes}&formato=${formato}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Formato de Asistencia Mensual</h1>
          <p className="text-sm text-zinc-500">
            {MESES[mes - 1]} {anio} · Tabla de {reporte.diasDelMes} días (ISO 17025)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={exportarUrl("excel")}
            target="_blank"
            className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
          >
            Excel
          </a>
          <a
            href={exportarUrl("pdf")}
            target="_blank"
            className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
          >
            PDF
          </a>
        </div>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl bg-white border border-zinc-200 p-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Mes</label>
          <select name="mes" defaultValue={mes} className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900">
            {MESES.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Año</label>
          <select name="anio" defaultValue={anio} className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900">
            {[ahora.getFullYear() - 1, ahora.getFullYear(), ahora.getFullYear() + 1].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700">Estudiante</label>
          <select name="usuario" defaultValue={usuarioId ?? ""} className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900">
            <option value="">Todos</option>
            {usuariosEstudiantes.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-900 transition-colors"
        >
          Ver reporte
        </button>
      </form>

      {usuarioSeleccionado ? (
        <div className="rounded-xl bg-white border border-zinc-200 overflow-x-auto">
          <div className="p-4 border-b border-zinc-200">
            <h2 className="font-semibold text-zinc-900">
              {usuarioSeleccionado.name}
              {usuarioSeleccionado.studentId && (
                <span className="text-zinc-400 font-mono text-sm ml-2">
                  {usuarioSeleccionado.studentId}
                </span>
              )}
            </h2>
          </div>
          <table className="w-full text-sm min-w-[400px]">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Día</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Entrada</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Salida</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Horas</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-500">Firma</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {Array.from({ length: reporte.diasDelMes }, (_, i) => i + 1).map((dia) => {
                const r = registrosPorDia.get(dia);
                return (
                  <tr key={dia} className={r ? "hover:bg-zinc-50" : "text-zinc-300"}>
                    <td className="px-4 py-2 font-medium">{dia}</td>
                    <td className="px-4 py-2">{r ? formatearHora(r.entrada) : ""}</td>
                    <td className="px-4 py-2">{r ? formatearHora(r.salida) : ""}</td>
                    <td className="px-4 py-2">{r ? `${r.horas.toFixed(2)}` : ""}</td>
                    <td className="px-4 py-2"></td>
                  </tr>
                );
              })}
              <tr className="bg-zinc-50 font-bold text-zinc-900">
                <td className="px-4 py-2">TOTAL</td>
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2">
                  {usuarioSeleccionado.registros.reduce((acc, r) => acc + r.horas, 0).toFixed(2)}
                </td>
                <td className="px-4 py-2"></td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl bg-white border border-zinc-200 overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-zinc-500 sticky left-0 bg-zinc-50">Estudiante</th>
                {Array.from({ length: reporte.diasDelMes }, (_, i) => i + 1).map((d) => (
                  <th key={d} className="text-center px-1 py-2 font-medium text-zinc-400 w-8">{d}</th>
                ))}
                <th className="text-center px-2 py-2 font-medium text-zinc-500">Días</th>
                <th className="text-center px-2 py-2 font-medium text-zinc-500">Horas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {reporte.usuarios.map((u) => {
                const porDia = new Map<number, typeof u.registros[number]>();
                for (const r of u.registros) porDia.set(r.dia, r);
                const totalHoras = u.registros.reduce((acc, r) => acc + r.horas, 0);
                const diasAsistidos = new Set(u.registros.map((r) => r.dia)).size;
                return (
                  <tr key={u.id} className="hover:bg-zinc-50">
                    <td className="px-3 py-1.5 font-medium text-zinc-900 sticky left-0 bg-white whitespace-nowrap">
                      {u.name}
                    </td>
                    {Array.from({ length: reporte.diasDelMes }, (_, i) => i + 1).map((d) => {
                      const r = porDia.get(d);
                      return (
                        <td key={d} className="text-center px-1 py-1.5">
                          {r ? (
                            <span
                              className="inline-block w-5 h-5 rounded-full bg-green-100 text-green-700 text-[10px] leading-5"
                              title={`${formatearHora(r.entrada)} - ${formatearHora(r.salida)} (${r.horas.toFixed(2)} h)`}
                            >
                              ✓
                            </span>
                          ) : ""}
                        </td>
                      );
                    })}
                    <td className="text-center px-2 py-1.5 font-medium text-zinc-700">{diasAsistidos}</td>
                    <td className="text-center px-2 py-1.5 font-mono text-zinc-700">{totalHoras.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
