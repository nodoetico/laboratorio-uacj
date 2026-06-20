import { autenticarUsuario, verificarSesion } from "@/lib/autenticacion";
import { redirect } from "next/navigation";

export default async function LoginPage(props: { searchParams?: Promise<{ error?: string }> }) {
  const session = await verificarSesion();
  if (session) redirect("/dashboard");

  const searchParams = await props.searchParams;
  const error = searchParams?.error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm border border-zinc-200">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-zinc-900">LabControl UACJ</h1>
          <p className="mt-1 text-sm text-zinc-500">Sistema de Gestión de Laboratorio</p>
        </div>
        {error === "invalid" && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            Credenciales inválidas. Verifica tu correo y contraseña.
          </div>
        )}
        <form action={handleLogin} className="space-y-4">
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
              placeholder="doctor@uacj.mx"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            Iniciar sesión
          </button>
        </form>
        <p className="mt-4 text-xs text-center text-zinc-400">
          Demo: doctor@uacj.mx / admin123
        </p>
      </div>
    </div>
  );
}

async function handleLogin(formData: FormData) {
  "use server";
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const user = await autenticarUsuario(email, password);
  if (!user) {
    redirect("/login?error=invalid");
  }
  redirect("/dashboard");
}
