import { prisma } from "@/lib/bd";
import { registrarAuditoria } from "./auditoria";
import type { ReactivoDTO, MovimientoReactivoDTO } from "@/lib/tipos";

export async function obtenerReactivos(): Promise<ReactivoDTO[]> {
  const reactivos = await prisma.reagent.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return reactivos.map((r) => ({
    ...r,
    stockBajo: r.quantity <= r.minStock,
  }));
}

export async function obtenerReactivo(id: number): Promise<ReactivoDTO | null> {
  const r = await prisma.reagent.findUnique({ where: { id } });
  if (!r) return null;
  return { ...r, stockBajo: r.quantity <= r.minStock };
}

export async function obtenerMovimientos(
  reagentId: number
): Promise<MovimientoReactivoDTO[]> {
  return prisma.reagentMovement
    .findMany({
      where: { reagentId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    })
    .then((rows) =>
      rows.map((m) => ({
        id: m.id,
        reagentId: m.reagentId,
        userId: m.userId,
        userName: m.user.name,
        type: m.type,
        quantity: m.quantity,
        notes: m.notes,
        createdAt: m.createdAt,
      }))
    );
}

export async function crearReactivo(
  usuarioId: number,
  data: {
    name: string;
    description?: string;
    quantity: number;
    unit: string;
    minStock: number;
    location?: string;
    expiresAt?: Date;
  }
) {
  const reactivo = await prisma.reagent.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      quantity: data.quantity,
      unit: data.unit,
      minStock: data.minStock,
      location: data.location ?? null,
      expiresAt: data.expiresAt ?? null,
    },
  });

  if (data.quantity > 0) {
    await prisma.reagentMovement.create({
      data: {
        reagentId: reactivo.id,
        userId: usuarioId,
        type: "IN",
        quantity: data.quantity,
        notes: "Inventario inicial",
      },
    });
  }

  await registrarAuditoria(
    usuarioId,
    "CREAR",
    "Reagent",
    reactivo.id,
    `Reactivo creado: ${data.name}, ${data.quantity} ${data.unit}`
  );

  return reactivo;
}

export async function registrarMovimiento(
  usuarioId: number,
  reagentId: number,
  type: "IN" | "OUT",
  quantity: number,
  notes?: string
) {
  const reactivo = await prisma.reagent.findUnique({
    where: { id: reagentId },
  });
  if (!reactivo) throw new Error("Reactivo no encontrado");

  if (type === "OUT" && reactivo.quantity < quantity) {
    throw new Error("Stock insuficiente");
  }

  const [movimiento] = await prisma.$transaction([
    prisma.reagentMovement.create({
      data: {
        reagentId,
        userId: usuarioId,
        type,
        quantity,
        notes: notes ?? null,
      },
    }),
    prisma.reagent.update({
      where: { id: reagentId },
      data: {
        quantity:
          type === "IN"
            ? { increment: quantity }
            : { decrement: quantity },
      },
    }),
  ]);

  await registrarAuditoria(
    usuarioId,
    type === "IN" ? "ENTRADA_REACTIVO" : "SALIDA_REACTIVO",
    "ReagentMovement",
    movimiento.id,
    `${type === "IN" ? "Entrada" : "Salida"} de ${quantity} ${reactivo.unit} de ${reactivo.name}${notes ? `: ${notes}` : ""}`
  );

  return movimiento;
}

export async function actualizarReactivo(
  usuarioId: number,
  id: number,
  data: {
    name?: string;
    description?: string;
    unit?: string;
    minStock?: number;
    location?: string;
    expiresAt?: Date | null;
  }
) {
  const reactivo = await prisma.reagent.update({
    where: { id },
    data,
  });

  await registrarAuditoria(
    usuarioId,
    "ACTUALIZAR",
    "Reagent",
    id,
    `Reactivo actualizado: ${reactivo.name}`
  );

  return reactivo;
}

export async function obtenerReactivosStockBajo(): Promise<ReactivoDTO[]> {
  const todos = await prisma.reagent.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return todos
    .filter((r) => r.quantity <= r.minStock)
    .map((r) => ({ ...r, stockBajo: true }));
}

export async function contarReactivos(): Promise<number> {
  return prisma.reagent.count({ where: { active: true } });
}

export async function contarReactivosStockBajo(): Promise<number> {
  const todos = await prisma.reagent.findMany({
    where: { active: true },
    select: { quantity: true, minStock: true },
  });
  return todos.filter((r) => r.quantity <= r.minStock).length;
}
