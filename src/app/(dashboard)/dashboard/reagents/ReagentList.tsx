"use client";

import Link from "next/link";
import { formatearFechaCorta } from "@/lib/formatear";
import type { ReactivoDTO } from "@/lib/tipos";
import { Paginacion } from "@/components/Paginacion";

export function ReagentList({
  reagents,
  isAdmin,
  total,
  pagina,
  paginas,
}: {
  reagents: ReactivoDTO[];
  isAdmin: boolean;
  total: number;
  pagina: number;
  paginas: number;
}) {
  const stockBajo = reagents.filter((r) => r.stockBajo);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Inventario de Reactivos</h1>
          <p className="text-sm text-zinc-500">
            {total} reactivos registrados
            {stockBajo.length > 0 && (
              <span className="text-red-500 font-medium">
                {" · "}{stockBajo.length} con stock bajo
              </span>
            )}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <a
              href="/api/exportar/reactivos?formato=excel"
              target="_blank"
              className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm font-medium text-green-700 hover:bg-green-100 transition-colors"
            >
              Excel
            </a>
            <a
              href="/api/exportar/reactivos?formato=pdf"
              target="_blank"
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
            >
              PDF
            </a>
            <Link
              href="/dashboard/reagents/new"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              + Nuevo reactivo
            </Link>
          </div>
        )}
      </div>

      <div>
        <input
          type="text"
          placeholder="Buscar reactivo por nombre, descripción o ubicación..."
          className="w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          onChange={(e) => {
            const q = e.target.value.toLowerCase();
            document.querySelectorAll("[data-reagent-card]").forEach((el) => {
              const card = el as HTMLElement;
              const text = card.dataset.search?.toLowerCase() ?? "";
              card.style.display = text.includes(q) ? "" : "none";
            });
          }}
        />
      </div>

      {stockBajo.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <h2 className="text-sm font-semibold text-red-700 mb-2">Stock bajo</h2>
          <div className="space-y-1">
            {stockBajo.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <Link
                  href={`/dashboard/reagents/${r.id}`}
                  className="text-red-700 hover:underline font-medium"
                >
                  {r.name}
                </Link>
                <span className="text-red-600">
                  {r.quantity} {r.unit} / mínimo {r.minStock} {r.unit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
        {reagents.map((r) => (
          <Link
            key={r.id}
            href={`/dashboard/reagents/${r.id}`}
            className="rounded-xl bg-white border border-zinc-200 p-4 hover:border-blue-300 transition-colors block"
            data-reagent-card
            data-search={`${r.name} ${r.description ?? ""} ${r.location ?? ""}`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-zinc-900">{r.name}</h3>
              <span
                className={`text-xs rounded-full px-2 py-0.5 shrink-0 ${
                  r.stockBajo
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {r.stockBajo ? "Stock bajo" : "OK"}
              </span>
            </div>
            {r.description && (
              <p className="text-xs text-zinc-400 mb-2 line-clamp-2">{r.description}</p>
            )}
            <div className="flex items-center gap-3 text-sm">
              <span className="font-mono font-bold text-zinc-900">
                {r.quantity} {r.unit}
              </span>
              <span className="text-xs text-zinc-400">
                {r.containers} {r.containers === 1 ? "envase" : "envases"}
              </span>
              {r.location && (
                <span className="text-xs text-zinc-400">{r.location}</span>
              )}
            </div>
            {r.expiresAt && (
              <p className="text-xs text-zinc-400 mt-1">
                Vence: {formatearFechaCorta(r.expiresAt)}
              </p>
            )}
          </Link>
        ))}
        {reagents.length === 0 && (
          <div className="col-span-full text-center py-12">
            <p className="text-zinc-400">No hay reactivos registrados</p>
            {isAdmin && (
              <Link
                href="/dashboard/reagents/new"
                className="text-blue-600 hover:underline text-sm mt-1 inline-block"
              >
                Registrar primer reactivo
              </Link>
            )}
          </div>
        )}
      </div>

      <Paginacion pagina={pagina} totalPaginas={paginas} />
    </div>
  );
}
