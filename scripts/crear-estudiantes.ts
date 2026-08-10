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

type Estudiante = { matricula: string; nombre: string; correo: string };

const estudiantes: Estudiante[] = [
  { matricula: "161520", nombre: "LESLYE DANIELA ALMANZA QUEZADA", correo: "al161520@alumnos.uacj.mx" },
  { matricula: "185744", nombre: "ANA KAREN RAMIREZ GALVAN", correo: "al185744@alumnos.uacj.mx" },
  { matricula: "196586", nombre: "CRIZTAL RIVERA RANGEL", correo: "al196586@alumnos.uacj.mx" },
  { matricula: "203371", nombre: "EMMA LORENA PEÑA DIAZ", correo: "al203371@alumnos.uacj.mx" },
  { matricula: "204932", nombre: "BRENDA JAQUELINE FRANCISCO JIMENEZ", correo: "al204932@alumnos.uacj.mx" },
  { matricula: "205308", nombre: "JENNY ITZEEL CABRERA RAMIREZ", correo: "al205308@alumnos.uacj.mx" },
  { matricula: "209341", nombre: "NELVA JOANNA MUÑOZ CALDERON", correo: "al209341@alumnos.uacj.mx" },
  { matricula: "211534", nombre: "NAHOMI ANGELICA PEREZ MARTINEZ", correo: "al211534@alumnos.uacj.mx" },
  { matricula: "213800", nombre: "STEPHANIE ESMERALDA RODRÍGUEZ ISLAS", correo: "al213800@alumnos.uacj.mx" },
  { matricula: "237255", nombre: "ANA MARIA GUADIAN GARCIA", correo: "al237255@alumnos.uacj.mx" },
  { matricula: "264142", nombre: "DAFNE MARTINEZ HERNANDEZ", correo: "al264142@alumnos.uacj.mx" },
  { matricula: "276943", nombre: "PAULA JAEL PEREZ PICHARDO", correo: "al276943@alumnos.uacj.mx" },
];

function generarContrasena(matricula: string): string {
  return `${matricula.slice(-3)}uacj`;
}

async function main() {
  await prisma.$connect();
  console.log("Conexión a la base de datos establecida");

  for (const estudiante of estudiantes) {
    const contrasena = generarContrasena(estudiante.matricula);
    const password = await bcrypt.hash(contrasena, 12);

    await prisma.user.upsert({
      where: { email: estudiante.correo },
      update: {
        name: estudiante.nombre,
        studentId: estudiante.matricula,
        password,
        role: "STUDENT",
        active: true,
      },
      create: {
        email: estudiante.correo,
        name: estudiante.nombre,
        studentId: estudiante.matricula,
        password,
        role: "STUDENT",
        active: true,
      },
    });

    console.log(
      `Creado/actualizado: ${estudiante.matricula} — ${estudiante.nombre} — usuario: ${estudiante.matricula} — contraseña: ${contrasena}`
    );
  }

  console.log(`Listo: ${estudiantes.length} cuentas de estudiante.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
