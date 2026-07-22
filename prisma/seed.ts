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

async function main() {
  await prisma.$connect();
  console.log("Conexión a la base de datos establecida");
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

  const reagents = [
    { name: "Acetato de sodio", quantity: 100, unit: "g", containers: 1 },
    { name: "Ácido cítrico", quantity: 500, unit: "g", containers: 4 },
    { name: "Ácido clorhídrico 0.1 N", quantity: 1, unit: "L", containers: 3 },
    { name: "Ácido clorhídrico 2 M", quantity: 1, unit: "L", containers: 1 },
    { name: "Ácido clorhídrico 36.5-38 %", quantity: 1, unit: "L", containers: 1 },
    { name: "Ácido sulfúrico", quantity: 1, unit: "L", containers: 1 },
    { name: "Agua desionizada", quantity: 19, unit: "L", containers: 1 },
    { name: "Agua destilada", quantity: 19, unit: "L", containers: 1 },
    { name: "Aluminio", quantity: 125, unit: "mL", containers: 1 },
    { name: "Amarillo N. 5", quantity: 5, unit: "g", containers: 1 },
    { name: "Ammoniumsulfidlosung", quantity: 1, unit: "L", containers: 1 },
    { name: "Arsenito de sodio", quantity: 500, unit: "g", containers: 2 },
    { name: "Azul brillante No. 1", quantity: 5, unit: "g", containers: 1 },
    { name: "Bismuto", quantity: 125, unit: "mL", containers: 1 },
    { name: "Bromuro de hexadeciltrimetilamonio", quantity: 250, unit: "g", containers: 1 },
    { name: "Carbonato de sodio", quantity: 100, unit: "g", containers: 1 },
    { name: "Carbón activado", quantity: 200, unit: "g", containers: 5 },
    { name: "Carbón activado - reactivo analítico", quantity: 100, unit: "g", containers: 1 },
    { name: "Carbón nanotubo, multi-walled", quantity: 500, unit: "g", containers: 1 },
    { name: "Cianuro de magnesio", quantity: 100, unit: "g", containers: 1 },
    { name: "Cloruro de amonio", quantity: 500, unit: "g", containers: 1 },
    { name: "Cloruro de sodio", quantity: 100, unit: "g", containers: 1 },
    { name: "Cloruro de sodio 0.125 M", quantity: 100, unit: "mL", containers: 1 },
    { name: "Cloruro de hierro tetrahidratado (II)", quantity: 250, unit: "g", containers: 1 },
    { name: "Cristales reactivos de arseniato de sodio", quantity: 500, unit: "g", containers: 1 },
    { name: "Estaño", quantity: 125, unit: "mL", containers: 1 },
    { name: "Estándar de espectroscopia atómica", quantity: 100, unit: "mL", containers: 3 },
    { name: "Fenol", quantity: 500, unit: "g", containers: 4 },
    { name: "Fosfato de amonio dibásico", quantity: 500, unit: "g", containers: 1 },
    { name: "Gluconato de hierro (II)", quantity: 250, unit: "g", containers: 1 },
    { name: "Gluconato de hierro (II) hidratado", quantity: 250, unit: "g", containers: 1 },
    { name: "Hierro", quantity: 125, unit: "mL", containers: 1 },
    { name: "Hidróxido de amonio", quantity: 1, unit: "L", containers: 1 },
    { name: "Hidróxido de sodio 0.5 N", quantity: 100, unit: "mL", containers: 2 },
    { name: "Hidróxido de sodio 1 M", quantity: 100, unit: "mL", containers: 1 },
    { name: "Hidróxido de bario zur analyse Ba(OH)₂·8H₂O", quantity: 500, unit: "g", containers: 1 },
    { name: "Hidróxido de bario", quantity: 500, unit: "mg", containers: 1 },
    { name: "Hidróxido de potasio 1 M", quantity: 100, unit: "mL", containers: 1 },
    { name: "Indio", quantity: 125, unit: "mL", containers: 1 },
    { name: "Kalium persulfuricum", quantity: 250, unit: "g", containers: 1 },
    { name: "Kaolin, powder", quantity: 500, unit: "g", containers: 3 },
    { name: "Metafosforados stangen zur analyse (HPO₃)n", quantity: 500, unit: "g", containers: 1 },
    { name: "Metanol", quantity: 1, unit: "L", containers: 2 },
    { name: "Metanol (50 mL)", quantity: 50, unit: "mL", containers: 1 },
    { name: "Monopotasio fosfato", quantity: 50, unit: "g", containers: 1 },
    { name: "Nitrato de plata 0.01 M", quantity: 1, unit: "L", containers: 2 },
    { name: "Oro", quantity: 125, unit: "mL", containers: 1 },
    { name: "Óxido de titanio (IV)", quantity: 5, unit: "g", containers: 1 },
    { name: "PAN indicator", quantity: 10, unit: "mL", containers: 1 },
    { name: "Patrón de fenol", quantity: 125, unit: "mL", containers: 3 },
    { name: "Peróxido de hidrógeno 3%", quantity: 946, unit: "mL", containers: 2 },
    { name: "Plata", quantity: 125, unit: "mL", containers: 1 },
    { name: "Po₂ electrode electrolyte", quantity: 16, unit: "oz", containers: 1 },
    { name: "Rojo N. 40", quantity: 5, unit: "g", containers: 1 },
    { name: "Sulfato pentahidratado de cobre (II)", quantity: 250, unit: "g", containers: 1 },
    { name: "Tiocianato de amonio", quantity: 250, unit: "g", containers: 1 },
    { name: "Trióxido de arsénico", quantity: 1, unit: "lb", containers: 1 },
    { name: "Zeolita", quantity: 500, unit: "g", containers: 1 },
    { name: "Zeolita de Oaxaca", quantity: 150, unit: "g", containers: 1 },
    { name: "Zinc", quantity: 125, unit: "mL", containers: 1 },
  ];

  for (const r of reagents) {
    const totalQty = r.quantity * r.containers;
    const minStock = Math.max(totalQty * 0.1, r.unit === "g" ? 10 : r.unit === "L" ? 0.1 : 5);
    await prisma.reagent.upsert({
      where: { name: r.name },
      update: { quantity: totalQty, unit: r.unit, minStock },
      create: {
        name: r.name,
        quantity: totalQty,
        unit: r.unit,
        minStock,
      },
    });
  }

  console.log(`Seed completed successfully`);
  console.log(`Admin: doctor@uacj.mx / admin123`);
  console.log(`Student: estudiante@uacj.mx / admin123`);
  console.log(`Service: servicio@uacj.mx / admin123`);
  console.log(`Reagents: ${reagents.length} seeded from inventory`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
