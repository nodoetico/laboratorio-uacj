import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "doctor@uacj.mx" },
    update: {},
    create: {
      email: "doctor@uacj.mx",
      name: "Dr. Torres",
      password,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "estudiante@uacj.mx" },
    update: {},
    create: {
      email: "estudiante@uacj.mx",
      name: "Estudiante Demo",
      password,
      role: "STUDENT",
    },
  });

  await prisma.user.upsert({
    where: { email: "servicio@uacj.mx" },
    update: {},
    create: {
      email: "servicio@uacj.mx",
      name: "Servicio Social Demo",
      password,
      role: "SERVICE",
    },
  });

  const equipments = [
    { name: "Balanza Analítica", model: "Ohaus AX224", maintenanceDays: 180 },
    { name: "Espectrómetro UV-Vis", model: "Thermo Scientific Genesys 150", maintenanceDays: 180 },
    { name: "pH-metro", model: "Hanna HI5522", maintenanceDays: 180 },
    { name: "Agitador Magnético", model: "Thermo Scientific Cimarec", maintenanceDays: 180 },
    { name: "Estufa de Secado", model: "Riossa ECH-30", maintenanceDays: 180 },
  ];

  for (const eq of equipments) {
    await prisma.equipment.upsert({
      where: { name: eq.name },
      update: {},
      create: eq,
    });
  }

  console.log("Seed completed successfully");
  console.log(`Admin: doctor@uacj.mx / admin123`);
  console.log(`Student: estudiante@uacj.mx / admin123`);
  console.log(`Service: servicio@uacj.mx / admin123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
