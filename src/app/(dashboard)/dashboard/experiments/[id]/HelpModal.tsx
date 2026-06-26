"use client";

import { useState } from "react";

export function HelpButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
        title="Ayuda"
      >
        ?
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-800 rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-700 max-w-lg w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Cómo usar el sistema</h2>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                aria-label="Cerrar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300">
              <section>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Experimentación</h3>
                <p>Crea un experimento con tus parámetros iniciales. El sistema genera automáticamente 3 réplicas (triplicado).</p>
              </section>

              <section>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Mediciones</h3>
                <p>Agrega mediciones de tiempo (horas) y absorbancia en cada réplica. Necesitas al menos 2 mediciones válidas (A &gt; 0).</p>
              </section>

              <section>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Cálculos cinéticos</h3>
                <p>Al agregar mediciones, el sistema calcula automáticamente:</p>
                <ul className="list-disc pl-5 mt-1 space-y-0.5">
                  <li><strong>K</strong> — Constante de velocidad (h⁻¹)</li>
                  <li><strong>R²</strong> — Coeficiente de determinación (bondad de ajuste)</li>
                  <li><strong>Vida media</strong> — Tiempo para reducir la concentración a la mitad (h)</li>
                  <li><strong>ln(A₀)</strong> — Logaritmo natural de la absorbancia inicial estimada</li>
                </ul>
                <p className="mt-1">Los cálculos aparecen en una tarjeta azul debajo de la tabla de mediciones de cada réplica.</p>
              </section>

              <section>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Finalizar experimento</h3>
                <p>Cuando termines de agregar mediciones, presiona &quot;Finalizar experimento&quot;. El Dr. Torres podrá ver los resultados en su Dashboard.</p>
              </section>

              <section>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Asistencia</h3>
                <p>Registra tu entrada al laboratorio y no olvides registrar tu salida al irte.</p>
              </section>

              <section>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Equipos</h3>
                <p>Registra el uso de equipos del laboratorio con descripción y horario.</p>
              </section>

              <section>
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Reactivos (solo admin)</h3>
                <p>Administra el inventario de reactivos y registra movimientos de entrada/salida.</p>
              </section>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-900 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
