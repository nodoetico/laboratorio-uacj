"use client";

import { useState } from "react";

export function EditarMedicion({
  medicionId,
  experimentoId,
  tiempo,
  absorbancia,
  accion,
}: {
  medicionId: number;
  experimentoId: number;
  tiempo: number;
  absorbancia: number;
  accion: (formData: FormData) => Promise<void>;
}) {
  const [editando, setEditando] = useState(false);

  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => setEditando(true)}
        className="text-xs text-blue-500 hover:underline mr-2"
      >
        Editar
      </button>
    );
  }

  return (
    <form action={accion} className="inline-flex items-center gap-1.5 justify-end flex-wrap">
      <input type="hidden" name="medicionId" value={medicionId} />
      <input type="hidden" name="experimentoId" value={experimentoId} />
      <input
        name="tiempoHoras"
        type="number"
        step="0.1"
        defaultValue={tiempo}
        aria-label="Tiempo (h)"
        className="w-16 rounded border border-zinc-300 px-1.5 py-1 text-xs text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
      <input
        name="absorbancia"
        type="number"
        step="0.0001"
        defaultValue={absorbancia}
        aria-label="Absorbancia"
        className="w-20 rounded border border-zinc-300 px-1.5 py-1 text-xs text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
      />
      <button type="submit" className="text-xs text-green-600 hover:underline">
        Guardar
      </button>
      <button
        type="button"
        onClick={() => setEditando(false)}
        className="text-xs text-zinc-400 hover:underline"
      >
        Cancelar
      </button>
    </form>
  );
}
