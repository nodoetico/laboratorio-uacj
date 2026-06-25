"use client";

import { useFormStatus } from "react-dom";
import { eliminarExperimentoAction } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="text-xs text-red-600 hover:text-red-800 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "Eliminando..." : "Eliminar"}
    </button>
  );
}

export function DeleteButton({ experimentId }: { experimentId: number }) {
  return (
    <form
      action={eliminarExperimentoAction}
      onSubmit={(e) => {
        if (
          !confirm(
            "¿Estás seguro de eliminar este experimento? Todos los datos asociados se perderán."
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={experimentId} />
      <SubmitButton />
    </form>
  );
}
