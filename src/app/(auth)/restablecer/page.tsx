import { restablecerContrasena } from "@/servicios/usuarios";
import { redirect } from "next/navigation";

export default async function RestablecerPage(props: {
  searchParams?: Promise<{ token?: string; error?: string }>;
}) {
  const searchParams = await props.searchParams;
  const token = searchParams?.token;

  if (!token) {
    redirect("/recuperar");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm border border-zinc-200">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-zinc-900">Nueva contraseña</h1>
          <p className="mt-1 text-sm text-zinc-500">Elige una nueva contraseña para tu cuenta</p>
        </div>
        {searchParams?.error === "invalido" && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            El enlace es inválido, ya fue usado o expiró. Solicita uno nuevo.
          </div>
        )}
        {searchParams?.error === "password" && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            Las contraseñas no coinciden o son muy cortas (mínimo 8 caracteres).
          </div>
        )}
        <form action={handleRestablecer} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
              Nueva contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-zinc-700">
              Confirmar contraseña
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              minLength={8}
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Guardar contraseña
          </button>
        </form>
      </div>
    </div>
  );
}

async function handleRestablecer(formData: FormData) {
  "use server";
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (password !== confirm || password.length < 8) {
    redirect(`/restablecer?token=${token}&error=password`);
  }

  const ok = await restablecerContrasena(token, password);
  if (!ok) {
    redirect(`/restablecer?token=${token}&error=invalido`);
  }
  redirect("/login?reset=1");
}
