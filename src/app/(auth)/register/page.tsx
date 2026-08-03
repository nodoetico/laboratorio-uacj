import { registrarUsuario } from "@/servicios/usuarios";
import { crearSesion, verificarSesion } from "@/lib/autenticacion";
import { redirect } from "next/navigation";

export default async function RegisterPage(props: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await verificarSesion();
  if (session) redirect("/dashboard");

  const searchParams = await props.searchParams;
  const error = searchParams?.error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm border border-zinc-200">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-zinc-900">Crear cuenta</h1>
          <p className="mt-1 text-sm text-zinc-500">Registro de estudiante</p>
        </div>
        {error === "existe" && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            Ya existe una cuenta con ese correo o matrícula.
          </div>
        )}
        {error === "password" && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            Las contraseñas no coinciden o son muy cortas (mínimo 8 caracteres).
          </div>
        )}
        <form action={handleRegistro} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
              Nombre completo
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Juan Pérez"
            />
          </div>
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
          <div>
            <label htmlFor="studentId" className="block text-sm font-medium text-zinc-700">
              Matrícula
            </label>
            <input
              id="studentId"
              name="studentId"
              type="text"
              className="mt-1 block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="220000"
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
            Registrarse
          </button>
        </form>
        <p className="mt-4 text-xs text-center text-zinc-400">
          ¿Ya tienes cuenta?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Iniciar sesión
          </a>
        </p>
      </div>
    </div>
  );
}

async function handleRegistro(formData: FormData) {
  "use server";
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const studentId = (formData.get("studentId") as string)?.trim();
  const password = formData.get("password") as string;
  const confirm = formData.get("confirm") as string;

  if (password !== confirm || password.length < 8) {
    redirect("/register?error=password");
  }

  try {
    const usuario = await registrarUsuario({ name, email, studentId, password });
    await crearSesion(usuario.id, usuario.role);
  } catch {
    redirect("/register?error=existe");
  }
  redirect("/dashboard");
}
