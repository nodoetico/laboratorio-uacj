import { solicitarRecuperacion } from "@/servicios/usuarios";
import { redirect } from "next/navigation";

export default async function RecuperarPage(props: {
  searchParams?: Promise<{ error?: string; enviado?: string; token?: string }>;
}) {
  const searchParams = await props.searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm border border-zinc-200">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-zinc-900">Recuperar contraseña</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Ingresa tu correo para recibir un enlace de restablecimiento
          </p>
        </div>

        {searchParams?.error === "nohay" && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-700">
            No encontramos una cuenta con ese correo.
          </div>
        )}

        {searchParams?.enviado === "1" && searchParams?.token ? (
          <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">
            <p className="mb-2">
              En producción este enlace se envía por correo electrónico. Como el SMTP aún no está
              configurado, aquí tienes el enlace directo:
            </p>
            <a
              href={`/restablecer?token=${searchParams.token}`}
              className="inline-block rounded-lg bg-green-600 px-3 py-2 text-white hover:bg-green-700 transition-colors"
            >
              Restablecer contraseña
            </a>
            <p className="mt-2 text-xs text-green-600">El enlace es válido por 1 hora.</p>
          </div>
        ) : (
          <form action={handleRecuperar} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="estudiante@uacj.mx"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Enviar enlace
            </button>
          </form>
        )}

        <p className="mt-4 text-xs text-center text-zinc-400">
          ¿Recordaste tu contraseña?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Iniciar sesión
          </a>
        </p>
      </div>
    </div>
  );
}

async function handleRecuperar(formData: FormData) {
  "use server";
  const email = formData.get("email") as string;
  const token = await solicitarRecuperacion(email);

  if (!token) {
    redirect("/recuperar?error=nohay");
  }
  redirect(`/recuperar?enviado=1&token=${token}`);
}
