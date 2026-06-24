const ZONA = "America/Ciudad_Juarez";

export function formatearFechaHora(fecha: Date): string {
  return fecha.toLocaleString("es-MX", { timeZone: ZONA });
}

export function formatearHora(fecha: Date): string {
  return fecha.toLocaleTimeString("es-MX", { timeZone: ZONA, hour: "2-digit", minute: "2-digit" });
}

export function formatearFechaCorta(fecha: Date): string {
  return fecha.toLocaleDateString("es-MX", { timeZone: ZONA });
}

export function hoyEnZona(): Date {
  const ahora = new Date();
  const partes = ahora.toLocaleDateString("en-CA", { timeZone: ZONA }).split("-");
  return new Date(parseInt(partes[0]), parseInt(partes[1]) - 1, parseInt(partes[2]));
}

export function esMismoDia(fecha: Date): boolean {
  const hoy = hoyEnZona();
  const f = new Date(fecha.toLocaleString("en-US", { timeZone: ZONA }));
  return (
    hoy.getFullYear() === f.getFullYear() &&
    hoy.getMonth() === f.getMonth() &&
    hoy.getDate() === f.getDate()
  );
}
