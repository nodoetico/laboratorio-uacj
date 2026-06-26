import { verificarSesion } from "@/lib/autenticacion";
import { obtenerReactivo, obtenerMovimientos } from "@/servicios/reactivos";
import { formatearFechaHora, formatearFechaCorta } from "@/lib/formatear";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ReagentDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await verificarSesion();
  if (!session) return null;

  const isAdmin = session.role === "ADMIN";
  const id = parseInt(params.id);
  const reactivo = await obtenerReactivo(id);
  if (!reactivo) notFound();

  const movimientos = await obtenerMovimientos(id);

  return (
    <div className="space-y-5">
      <Link
        href="/dashboard/reagents"
        className="text-sm text-blue-600 hover:underline inline-block"
      >
        &larr; Volver al inventario
      </Link>

      <div className="rounded-xl bg-white border border-zinc-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{reactivo.name}</h1>
            {reactivo.description && (
              <p className="text-sm text-zinc-500 mt-1">{reactivo.description}</p>
            )}
          </div>
          <span
            className={`text-sm rounded-full px-3 py-1 shrink-0 ${
              reactivo.stockBajo
                ? "bg-red-100 text-red-700 font-semibold"
                : "bg-green-100 text-green-700"
            }`}
          >
            {reactivo.stockBajo ? "Stock bajo" : "Stock suficiente"}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wide">Cantidad</p>
            <p className="text-lg font-bold text-zinc-900 font-mono">
              {reactivo.quantity} {reactivo.unit}
            </p>
          </div>
          <div>
            <p className="text-xs text-zinc-400 uppercase tracking-wide">Stock mínimo</p>
            <p className="text-lg font-bold text-zinc-900 font-mono">
              {reactivo.minStock} {reactivo.unit}
            </p>
          </div>
          {reactivo.location && (
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wide">Ubicación</p>
              <p className="text-lg font-bold text-zinc-900">{reactivo.location}</p>
            </div>
          )}
          {reactivo.expiresAt && (
            <div>
              <p className="text-xs text-zinc-400 uppercase tracking-wide">Vence</p>
              <p className="text-lg font-bold text-zinc-900">
                {formatearFechaCorta(reactivo.expiresAt)}
              </p>
            </div>
          )}
        </div>

        {isAdmin && (
          <div className="flex gap-2 mt-4">
            <Link
              href={`/dashboard/reagents/${reactivo.id}/movement`}
              className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-900 transition-colors"
            >
              Registrar movimiento
            </Link>
          </div>
        )}
      </div>

      <section className="rounded-xl bg-white border border-zinc-200 p-5">
        <h2 className="font-semibold text-zinc-900 mb-3">Historial de movimientos</h2>
        {movimientos.length === 0 ? (
          <p className="text-sm text-zinc-400">Sin movimientos registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[400px]">
              <thead className="border-b border-zinc-200">
                <tr>
                  <th className="text-left py-2 text-zinc-500 font-medium">Fecha</th>
                  <th className="text-left py-2 text-zinc-500 font-medium">Tipo</th>
                  <th className="text-right py-2 text-zinc-500 font-medium">Cantidad</th>
                  <th className="text-left py-2 text-zinc-500 font-medium">Usuario</th>
                  <th className="text-left py-2 text-zinc-500 font-medium">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {movimientos.map((m) => (
                  <tr key={m.id}>
                    <td className="py-2 text-zinc-600 whitespace-nowrap">
                      {formatearFechaHora(m.createdAt)}
                    </td>
                    <td className="py-2">
                      <span
                        className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                          m.type === "IN"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {m.type === "IN" ? "Entrada" : "Salida"}
                      </span>
                    </td>
                    <td className={`py-2 text-right font-mono font-bold ${
                      m.type === "IN" ? "text-green-600" : "text-red-600"
                    }`}>
                      {m.type === "IN" ? "+" : "-"}
                      {m.quantity} {reactivo.unit}
                    </td>
                    <td className="py-2 text-zinc-600">{m.userName}</td>
                    <td className="py-2 text-zinc-500">{m.notes ?? "\u2014"}</td>
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
