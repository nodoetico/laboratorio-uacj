import { verificarSesion } from "@/lib/autenticacion";
import { obtenerReactivosPaginados } from "@/servicios/reactivos";
import { ReagentList } from "./ReagentList";

export default async function ReagentsPage(props: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const session = await verificarSesion();
  if (!session) return null;

  const searchParams = await props.searchParams;
  const pagina = parseInt(searchParams.pagina ?? "1");
  const paginaValida = isNaN(pagina) ? 1 : pagina;

  const isAdmin = session.role === "ADMIN";
  const { reactivos, total, paginas } = await obtenerReactivosPaginados({
    pagina: paginaValida,
    porPagina: 12,
  });

  return (
    <ReagentList
      reagents={reactivos}
      isAdmin={isAdmin}
      total={total}
      pagina={paginaValida}
      paginas={paginas}
    />
  );
}
