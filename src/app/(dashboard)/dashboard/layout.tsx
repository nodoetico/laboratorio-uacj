import { verificarSesion, eliminarSesion } from "@/lib/autenticacion";
import { redirect } from "next/navigation";
import { SidebarNav } from "./SidebarClient";
import { MobileMenu } from "./MobileMenu";
import HeartbeatClient from "@/lib/HeartbeatClient";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await verificarSesion();
  if (!session) redirect("/login");

  const isAdmin = session.role === "ADMIN";

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <HeartbeatClient />
      <aside className="hidden md:flex w-64 bg-white border-r border-zinc-200 flex-col fixed md:static inset-y-0 left-0 z-40">
        <SidebarWidget isAdmin={isAdmin} />
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <MobileMenu isAdmin={isAdmin} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}

function SidebarWidget({ isAdmin }: { isAdmin: boolean }) {
  return (
    <>
      <div className="p-4 border-b border-zinc-200">
        <h2 className="text-lg font-bold text-zinc-900">LabControl</h2>
        <p className="text-xs text-zinc-500">{isAdmin ? "Administrador" : "Estudiante"}</p>
      </div>
      <SidebarNav />
      <div className="p-3 border-t border-zinc-200">
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 transition-colors text-left"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </>
  );
}

async function logoutAction() {
  "use server";
  await eliminarSesion();
  redirect("/login");
}
