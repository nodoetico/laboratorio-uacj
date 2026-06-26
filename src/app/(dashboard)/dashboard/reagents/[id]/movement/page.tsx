import { verificarSesion } from "@/lib/autenticacion";
import { obtenerReactivo, registrarMovimiento } from "@/servicios/reactivos";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function MovementPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await verificarSesion();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const id = parseInt(params.id);
  const reactivo = await obtenerReactivo(id);
  if (!reactivo) redirect("/dashboard/reagents");

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href={`/dashboard/reagents/${id}`}
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        &larr; Volver a {reactivo.name}
      </Link>

      <h1 className="text-2xl font-bold text-zinc-900 mb-2">Registrar movimiento</h1>
      <p className="text-sm text-zinc-500 mb-6">
        {reactivo.name} — Stock actual: {reactivo.quantity} {reactivo.unit}
      </p>

      <form action={handleSubmit} className="space-y-4">
        <input type="hidden" name="reagentId" value={id} />

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-zinc-700">
            Tipo de movimiento *
          </label>
          <select
            id="type"
            name="type"
            required
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="IN">Entrada (agregar stock)</option>
            <option value="OUT">Salida (consumir stock)</option>
          </select>
        </div>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-zinc-700">
            Cantidad *
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            step="0.01"
            required
            min="0.01"
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-zinc-700">
            Notas
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Ej: Reposición de stock, usado en experimento X, etc."
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-900 transition-colors"
        >
          Registrar movimiento
        </button>
      </form>
    </div>
  );
}

async function handleSubmit(formData: FormData) {
  "use server";
  const session = await verificarSesion();
  if (!session || session.role !== "ADMIN") throw new Error("No autorizado");

  await registrarMovimiento(
    session.userId,
    parseInt(formData.get("reagentId") as string),
    formData.get("type") as "IN" | "OUT",
    parseFloat(formData.get("quantity") as string),
    (formData.get("notes") as string) || undefined
  );

  revalidatePath("/dashboard/reagents");
  redirect(`/dashboard/reagents/${formData.get("reagentId")}`);
}
