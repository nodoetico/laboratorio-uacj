"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function DeleteReagentButton({ id }: { id: number }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm("¿Estás seguro de eliminar este reactivo? Se desactivará del inventario.")) return;
    startTransition(async () => {
      const res = await fetch(`/api/reagents/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error ?? "Error al eliminar");
        return;
      }
      router.push("/dashboard/reagents");
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {pending ? "Eliminando..." : "Eliminar"}
    </button>
  );
}
