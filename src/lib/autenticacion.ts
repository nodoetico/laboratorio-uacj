import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "./bd";
import { registrarSesionActiva, eliminarSesionActiva } from "./sesionesActivas";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "laboratorio-uacj-secret-key-change-in-production"
);

const COOKIE_SESION = "session";

type DatosSesion = {
  userId: number;
  role: string;
  expiresAt: Date;
};

export async function cifrar(payload: DatosSesion) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function descifrar(token: string): Promise<DatosSesion | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as DatosSesion;
  } catch {
    return null;
  }
}

export async function crearSesion(userId: number, role: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const token = await cifrar({ userId, role, expiresAt });
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_SESION, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });

  await registrarSesionActiva(userId, token);
}

export async function eliminarSesion() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_SESION)?.value;
  cookieStore.delete(COOKIE_SESION);
  if (token) {
    await eliminarSesionActiva(token);
  }
}

export const verificarSesion = cache(async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_SESION)?.value;
  if (!token) return null;

  const payload = await descifrar(token);
  if (!payload) return null;

  return { userId: payload.userId, role: payload.role };
});

export async function hashearContrasena(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verificarContrasena(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function autenticarUsuario(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) return null;

  const valid = await verificarContrasena(password, user.password);
  if (!valid) return null;

  await crearSesion(user.id, user.role);
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
