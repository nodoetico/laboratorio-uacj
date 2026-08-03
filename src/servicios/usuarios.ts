import { prisma } from "@/lib/bd";
import { hashearContrasena } from "@/lib/autenticacion";
import { registrarAuditoria } from "./auditoria";
import crypto from "crypto";

export async function registrarUsuario(datos: {
  name: string;
  email: string;
  studentId?: string;
  password: string;
}) {
  const email = datos.email.trim().toLowerCase();

  const existente = await prisma.user.findFirst({
    where: { OR: [{ email }, { studentId: datos.studentId || undefined }] },
  });
  if (existente) {
    throw new Error("Ya existe una cuenta con ese correo o matrícula");
  }

  const usuario = await prisma.user.create({
    data: {
      name: datos.name.trim(),
      email,
      studentId: datos.studentId?.trim() || null,
      password: await hashearContrasena(datos.password),
      role: "STUDENT",
      active: true,
    },
  });

  await registrarAuditoria(
    usuario.id,
    "CREAR",
    "User",
    usuario.id,
    `Cuenta creada mediante registro: ${usuario.email}`
  );

  return usuario;
}

export async function solicitarRecuperacion(email: string): Promise<string | null> {
  const usuario = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true },
  });
  if (!usuario) return null;

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: usuario.id, token, expiresAt },
  });

  return token;
}

export async function restablecerContrasena(
  token: string,
  nuevaContrasena: string
): Promise<boolean> {
  const registro = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!registro || registro.used || registro.expiresAt < new Date()) {
    return false;
  }

  const hash = await hashearContrasena(nuevaContrasena);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: registro.userId },
      data: { password: hash },
    }),
    prisma.passwordResetToken.update({
      where: { id: registro.id },
      data: { used: true },
    }),
    prisma.activeSession.deleteMany({ where: { userId: registro.userId } }),
  ]);

  await registrarAuditoria(
    registro.userId,
    "ACTUALIZAR",
    "User",
    registro.userId,
    "Contraseña restablecida"
  );

  return true;
}
