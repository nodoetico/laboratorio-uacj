import { verificarSesion } from "@/lib/autenticacion";
import { obtenerReactivo, actualizarReactivo, ajustarCantidadReactivo } from "@/servicios/reactivos";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditReagentPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const session = await verificarSesion();
  if (!session || session.role !== "ADMIN") redirect("/dashboard");

  const id = parseInt(params.id);
  const reactivo = await obtenerReactivo(id);
  if (!reactivo) notFound();

  return (
    <div className="max-w-lg mx-auto">
      <Link
        href={`/dashboard/reagents/${id}`}
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        &larr; Volver al reactivo
      </Link>

      <h1 className="text-2xl font-bold text-zinc-900 mb-6">
        Editar reactivo
      </h1>

      <form action={handleSubmit.bind(null, id)} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
            Nombre del reactivo *
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={reactivo.name}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
            defaultValue={reactivo.description ?? ""}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
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
              defaultValue={reactivo.quantity}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="containers" className="block text-sm font-medium text-zinc-700">
              Número de envases
            </label>
            <input
              id="containers"
              name="containers"
              type="number"
              min="1"
              step="1"
              defaultValue={reactivo.containers}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <p className="text-xs text-zinc-400 -mt-2">
          Si cambias la cantidad se registrará un ajuste de inventario con trazabilidad (ISO 17025).
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="unit" className="block text-sm font-medium text-zinc-700">
              Unidad *
            </label>
            <select
              id="unit"
              name="unit"
              required
              defaultValue={reactivo.unit}
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
              defaultValue={reactivo.minStock}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-zinc-700">
            Ubicación
          </label>
          <input
            id="location"
            name="location"
            defaultValue={reactivo.location ?? ""}
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="expiresAt" className="block text-sm font-medium text-zinc-700">
            Fecha de vencimiento
          </label>
          <input
            id="expiresAt"
            name="expiresAt"
            type="date"
            defaultValue={
              reactivo.expiresAt
                ? reactivo.expiresAt.toISOString().split("T")[0]
                : ""
            }
            className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          Guardar cambios
        </button>
      </form>
    </div>
  );
}

async function handleSubmit(id: number, formData: FormData) {
  "use server";
  const session = await verificarSesion();
  if (!session || session.role !== "ADMIN") throw new Error("No autorizado");

  const expiresAt = formData.get("expiresAt")
    ? new Date(formData.get("expiresAt") as string)
    : null;

  await actualizarReactivo(session.userId, id, {
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || undefined,
    containers: parseInt(formData.get("containers") as string) || 1,
    unit: formData.get("unit") as string,
    minStock: parseFloat(formData.get("minStock") as string),
    location: (formData.get("location") as string) || undefined,
    expiresAt,
  });

  const cantidad = parseFloat(formData.get("quantity") as string);
  if (!isNaN(cantidad)) {
    await ajustarCantidadReactivo(session.userId, id, cantidad);
  }

  revalidatePath("/dashboard/reagents");
  redirect(`/dashboard/reagents/${id}`);
}
