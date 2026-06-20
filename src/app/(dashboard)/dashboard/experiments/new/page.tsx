import { verificarSesion } from "@/lib/autenticacion";
import { crearExperimento } from "@/servicios/experimentos";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function NewExperimentPage() {
  const session = await verificarSesion();
  if (!session) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Nuevo experimento</h1>
        <p className="text-sm text-zinc-500">Registra los parámetros iniciales del experimento</p>
      </div>

      <form action={handleCrearExperimento} className="rounded-xl bg-white border border-zinc-200 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label htmlFor="titulo" className="block text-sm font-medium text-zinc-700 mb-1">Título del experimento</label>
            <input id="titulo" name="titulo" required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Ej: Degradación de azul de metileno" />
          </div>
          <div>
            <label htmlFor="contaminante" className="block text-sm font-medium text-zinc-700 mb-1">Contaminante / Solución</label>
            <input id="contaminante" name="contaminante" required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Ej: Azul de metileno" />
          </div>
          <div>
            <label htmlFor="concentracionInicial" className="block text-sm font-medium text-zinc-700 mb-1">Concentración inicial C₀</label>
            <input id="concentracionInicial" name="concentracionInicial" type="number" step="0.0001" required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Ej: 1.5000" />
          </div>
          <div>
            <label htmlFor="masaMaterial" className="block text-sm font-medium text-zinc-700 mb-1">Masa de material (g)</label>
            <input id="masaMaterial" name="masaMaterial" type="number" step="0.0001" required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Ej: 0.0500" />
          </div>
          <div>
            <label htmlFor="volumenSolucion" className="block text-sm font-medium text-zinc-700 mb-1">Volumen de solución (mL)</label>
            <input id="volumenSolucion" name="volumenSolucion" type="number" step="0.1" required
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Ej: 100.0" />
          </div>
        </div>

        <div className="border-t border-zinc-200 pt-4">
          <p className="text-sm font-medium text-zinc-700 mb-2">Réplicas</p>
          <p className="text-xs text-zinc-400 mb-3">Se crearán 3 réplicas automáticamente (por triplicado)</p>
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/dashboard/experiments"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors">
            Cancelar
          </Link>
          <button type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            Crear experimento
          </button>
        </div>
      </form>
    </div>
  );
}

async function handleCrearExperimento(formData: FormData) {
  "use server";
  const session = await verificarSesion();
  if (!session) throw new Error("No autorizado");

  const experimento = await crearExperimento(session.userId, {
    titulo: formData.get("titulo") as string,
    contaminante: formData.get("contaminante") as string,
    masaMaterial: parseFloat(formData.get("masaMaterial") as string),
    volumenSolucion: parseFloat(formData.get("volumenSolucion") as string),
    concentracionInicial: parseFloat(formData.get("concentracionInicial") as string),
  });

  revalidatePath("/dashboard/experiments");
  redirect(`/dashboard/experiments/${experimento.id}`);
}
