"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function Paginacion({
  pagina,
  totalPaginas,
}: {
  pagina: number;
  totalPaginas: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPaginas <= 1) return null;

  const construirHref = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("pagina", String(p));
    return `${pathname}?${params.toString()}`;
  };

  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-center gap-1 py-4">
      {pagina > 1 ? (
        <Link
          href={construirHref(pagina - 1)}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          ← Anterior
        </Link>
      ) : (
        <span className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-300 cursor-not-allowed">
          ← Anterior
        </span>
      )}

      <div className="flex items-center gap-1">
        {paginas.map((p) => (
          <Link
            key={p}
            href={construirHref(p)}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              p === pagina
                ? "bg-blue-600 text-white font-medium"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            {p}
          </Link>
        ))}
      </div>

      {pagina < totalPaginas ? (
        <Link
          href={construirHref(pagina + 1)}
          className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
        >
          Siguiente →
        </Link>
      ) : (
        <span className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-300 cursor-not-allowed">
          Siguiente →
        </span>
      )}
    </div>
  );
}
