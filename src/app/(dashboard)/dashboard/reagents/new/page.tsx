import { verificarSesion } from "@/lib/autenticacion";
import { crearReactivo } from "@/servicios/reactivos";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";

export default async function NewReagentPage() {
  const session = await verificarSesion();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href="/dashboard/reagents"
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        &larr; Volver al inventario
      </Link>

      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Nuevo reactivo</h1>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
            Nombre del reactivo *
          </label>
          <input
            id="name"
            name="name"
            required
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Ej: Ácido clorhídrico"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-700">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Concentración, presentación, etc."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-zinc-700">
              Cantidad inicial *
            </label>
            <input
              id="quantity"
              name="quantity"
              type="number"
              step="0.01"
              required
              defaultValue="0"
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-zinc-700">
              Unidad *
            </label>
            <select
              id="unit"
              name="unit"
              required
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="g">g</option>
              <option value="mg">mg</option>
              <option value="kg">kg</option>
              <option value="mL">mL</option>
              <option value="L">L</option>
              <option value="mol">mol</option>
              <option value="pz">pz</option>
              <option value="caja">caja</option>
              <option value="botella">botella</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="minStock" className="block text-sm font-medium text-zinc-700">
              Stock mínimo *
            </label>
            <input
              id="minStock"
              name="minStock"
              type="number"
              step="0.01"
              required
              defaultValue="0"
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-zinc-700">
              Ubicación
            </label>
            <input
              id="location"
              name="location"
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Ej: Estante A3"
            />
          </div>
        </div>

        <div>
          <label htmlFor="expiresAt" className="block text-sm font-medium text-zinc-700">
            Fecha de vencimiento
          </label>
          <input
            id="expiresAt"
            name="expiresAt"
            type="date"
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Guardar reactivo
        </button>
      </form>
    </div>
  );
}

async function handleSubmit(formData: FormData) {
  "use server";
  const session = await verificarSesion();
  if (!session || session.role !== "ADMIN") throw new Error("No autorizado");

  const expiresAt = formData.get("expiresAt")
    ? new Date(formData.get("expiresAt") as string)
    : undefined;

  await crearReactivo(session.userId, {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
    quantity: parseFloat(formData.get("quantity") as string),
    unit: formData.get("unit") as string,
    minStock: parseFloat(formData.get("minStock") as string),
    location: (formData.get("location") as string) || undefined,
    expiresAt,
  });

  revalidatePath("/dashboard/reagents");
  redirect("/dashboard/reagents");
}
