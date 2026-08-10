import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ERROR: DATABASE_URL no está definida en las variables de entorno");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const EMAIL = "superadmin@uacj.mx";
const NOMBRE = "SUPER ADMIN";
const CONTRASENA = process.env.ADMIN_INVISIBLE_PASSWORD ?? "";

if (!CONTRASENA) {
  console.error("ERROR: define la variable ADMIN_INVISIBLE_PASSWORD con la contraseña del admin invisible");
  process.exit(1);
}

async function main() {
  await prisma.$connect();
  console.log("Conexión a la base de datos establecida");

  const password = await bcrypt.hash(CONTRASENA, 12);

  await prisma.user.upsert({
    where: { email: EMAIL },
    update: {
      name: NOMBRE,
      password,
      role: "ADMIN",
      active: true,
      hidden: true,
    },
    create: {
      email: EMAIL,
      name: NOMBRE,
      password,
      role: "ADMIN",
      active: true,
      hidden: true,
    },
  });

  console.log(`Creado/actualizado admin invisible: ${EMAIL} (usuario: ${EMAIL})`);
  console.log("IMPORTANTE: no aparece en dashboards, sesiones activas ni auditoría.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
