# LabControl UACJ — Sistema de Gestión de Laboratorio

## Sistema para el Laboratorio de Investigación del Dr. Torres — UACJ

---

## Índice

1. [Visión General](#1-visión-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Base de Datos](#3-base-de-datos)
4. [Módulos del Sistema](#4-módulos-del-sistema)
   - [4.1 Autenticación](#41-autenticación)
   - [4.2 Dashboard](#42-dashboard)
   - [4.3 Experimentación](#43-experimentación)
   - [4.4 Equipos](#44-equipos)
   - [4.5 Asistencia](#45-asistencia)
   - [4.6 Auditoría (ISO 17025)](#46-auditoría-iso-17025)
5. [Roles de Usuario](#5-roles-de-usuario)
6. [API](#6-api)
7. [ISO 17025 — Trazabilidad y Calidad](#7-iso-17025--trazabilidad-y-calidad)
8. [Cómo Ejecutar](#8-cómo-ejecutar)
9. [Estructura del Proyecto](#9-estructura-del-proyecto)
10. [Próximos Pasos](#10-próximos-pasos)

---

## 1. Visión General

**LabControl UACJ** es un sistema web para la gestión integral del laboratorio de investigación del Dr. Torres en la Universidad Autónoma de Ciudad Juárez (UACJ).

El sistema permite:
- **Estandarizar** el registro de datos experimentales (cinética de absorbancias)
- **Digitalizar** la bitácora de uso de equipos del laboratorio
- **Controlar** la asistencia de estudiantes e investigadores al laboratorio
- **Cumplir** con requisitos de trazabilidad (ISO 17025)

### Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| Base de datos | SQLite (via Prisma ORM) |
| Autenticación | JWT (jose) + bcryptjs |
| Estilos | Tailwind CSS v4 |
| Motor BD | better-sqlite3 |

---

## 2. Arquitectura del Sistema

```
laboratorio-app/
├── src/
│   ├── app/                    # Rutas y páginas (Next.js App Router)
│   │   ├── (auth)/             # Grupo de rutas públicas (login)
│   │   ├── (dashboard)/        # Grupo de rutas protegidas (dashboard)
│   │   └── api/                # API routes (sesión, logout)
│   ├── componentes/            # Componentes reutilizables
│   ├── lib/                    # Capa de acceso a datos
│   │   ├── auth.ts             # Autenticación JWT
│   │   ├── dal.ts              # Data Access Layer (consultas)
│   │   ├── db.ts               # Conexión Prisma
│   │   └── types.ts            # Tipos compartidos
│   ├── servicios/              # Capa de servicios (arquitectura modular)
│   │   ├── auditoria.ts        # Trazabilidad ISO 17025
│   │   ├── experimentos.ts     # Gestión de experimentos
│   │   ├── equipos.ts          # Gestión de equipos
│   │   └── asistencia.ts       # Control de asistencia
│   └── generated/              # Cliente Prisma generado
├── prisma/
│   ├── schema.prisma           # Modelo de datos
│   ├── seed.ts                 # Datos de prueba
│   └── migrations/             # Migraciones SQL
└── .env                        # Variables de entorno
```

### Diagrama de Flujo

```
Usuario (Navegador)
      │
      ▼
  Next.js Server
      │
      ├── Middleware (proxy.ts) → Verifica sesión JWT
      │
      ├── Server Actions → Lógica de negocio (formularios)
      │         │
      │         ▼
      │    Servicios (src/servicios/)
      │         │
      │         ▼
      │    DAL (src/lib/dal.ts) → Prisma ORM
      │
      └── API Routes → Endpoints REST (/api/auth/*)
```

---

## 3. Base de Datos

### Modelo Relacional (Prisma SQLite)

```
User (usuario)
├── Experiment (experimento)
│   └── ExperimentReplicate (réplica ×3)
│       └── Measurement (medición tiempo/absorbancia)
├── EquipmentUsage (uso de equipo) → Equipment (equipo)
├── Attendance (asistencia check-in/out)
└── AuditLog (auditoría ISO 17025)
```

### Tablas

| Tabla | Propósito |
|---|---|
| **User** | Usuarios del sistema (admin, estudiante, servicio social) |
| **Experiment** | Experimentos creados por estudiantes |
| **ExperimentReplicate** | Réplicas del experimento (siempre 3 por triplicado) |
| **Measurement** | Mediciones individuales (tiempo vs absorbancia) |
| **Equipment** | Equipos del laboratorio (5 registrados) |
| **EquipmentUsage** | Registro de uso de equipos |
| **Attendance** | Check-in / Check-out del laboratorio |
| **AuditLog** | Trazabilidad de todas las operaciones (ISO 17025) |

---

## 4. Módulos del Sistema

### 4.1 Autenticación

**Archivos:** `src/lib/auth.ts`, `src/app/(auth)/login/page.tsx`, `proxy.ts`

- Sistema de login con JWT (JSON Web Tokens)
- Sesión almacenada en cookie `session` (7 días de duración)
- Contraseñas encriptadas con bcryptjs (12 rondas)
- Middleware `proxy.ts` protege todas las rutas excepto `/login`
- 3 roles: ADMIN, STUDENT, SERVICE

**Usuarios demo:**
| Correo | Contraseña | Rol |
|---|---|---|
| doctor@uacj.mx | admin123 | ADMIN (Dr. Torres) |
| estudiante@uacj.mx | admin123 | STUDENT |
| servicio@uacj.mx | admin123 | SERVICE (Servicio Social) |

### 4.2 Dashboard

**Archivo:** `src/app/(dashboard)/dashboard/page.tsx`

Vista general del laboratorio para el administrador:

- **En laboratorio ahora** — Lista de personas actualmente con check-in activo
- **Experimentación en curso** — Experimentos activos con su estudiante y contaminante
- **Usuarios registrados** — Todos los usuarios del sistema con su rol
- **Acceso rápido** — Enlaces a Nuevo experimento, Equipos, Asistencia

Los estudiantes ven solo sus propios experimentos y estadísticas.

### 4.3 Experimentación

**Archivos:** `src/app/(dashboard)/dashboard/experiments/*`

Módulo principal para el registro de datos cinéticos.

**Flujo de trabajo:**
1. El estudiante crea un experimento con parámetros iniciales:
   - Título del experimento
   - Contaminante / Solución
   - Concentración inicial (C₀)
   - Masa de material (g)
   - Volumen de solución (mL)
2. El sistema crea automáticamente **3 réplicas** (por triplicado, como requiere el Dr.)
3. El estudiante agrega mediciones de **Tiempo (horas)** vs **Absorbancia** en cada réplica
4. Al finalizar, presiona **"Finalizar experimento"**
5. El Dr. Torres ve el resultado en su Dashboard

**Reglas de negocio:**
- Los experimentos se manejan por triplicado (3 réplicas)
- Cada medición tiene: tiempo en horas + valor de absorbancia
- Estado: `in_progress` → `completed`
- El admin puede ver todos los experimentos; los estudiantes solo los suyos

### 4.4 Equipos

**Archivo:** `src/app/(dashboard)/dashboard/equipment/page.tsx`

Bitácora digital de uso de equipos del laboratorio.

**Equipos registrados:**
| Equipo | Modelo |
|---|---|
| Balanza Analítica | Ohaus AX224 |
| Espectrómetro UV-Vis | Thermo Scientific Genesys 150 |
| pH-metro | Hanna HI5522 |
| Agitador Magnético | Thermo Scientific Cimarec |
| Estufa de Secado | Riossa ECH-30 |

**Funcionalidades:**
- Registrar uso: descripción, hora de inicio, hora de fin
- Indicador visual de **mantenimiento requerido** (basado en días desde último mantenimiento)
- Historial de los últimos 50 usos registrados
- Alerta cuando el equipo necesita mantenimiento (configurable, default 180 días)

### 4.5 Asistencia

**Archivo:** `src/app/(dashboard)/dashboard/attendance/page.tsx`

Control de entrada y salida del laboratorio.

- Botón único **"Registrar entrada"** / **"Registrar salida"**
- Tipos de asistencia: Investigación, Servicio Social, Teórico
- Vista admin: resumen del día (entradas, salidas, personas en laboratorio)
- Cálculo automático de duración en horas
- Historial de los últimos 100 registros

### 4.6 Auditoría (ISO 17025)

**Archivo:** `src/servicios/auditoria.ts`

Sistema de trazabilidad que registra todas las operaciones críticas:

| Acción | Entidad | Descripción |
|---|---|---|
| CREAR | Experimento | Nuevo experimento con sus parámetros |
| AGREGAR_MEDICION | Measurement | Medición de tiempo/absorbancia |
| FINALIZAR | Experimento | Experimento completado |
| REGISTRAR_USO | EquipmentUsage | Uso de equipo registrado |
| ENTRADA | Attendance | Check-in al laboratorio |
| SALIDA | Attendance | Check-out con duración calculada |

Cada registro de auditoría contiene:
- **Usuario** que realizó la acción
- **Tipo de acción** (CREAR, MODIFICAR, FINALIZAR, etc.)
- **Entidad** afectada (tabla y ID)
- **Detalle** descriptivo de la operación
- **Fecha y hora** exacta

---

## 5. Roles de Usuario

### Administrador (ADMIN) — Dr. Torres
- Acceso total al sistema
- Dashboard completo con todos los usuarios
- Visualización de todos los experimentos (activos y completados)
- Lista de usuarios registrados
- Quién está en el laboratorio ahora
- Resumen de asistencia del día

### Estudiante (STUDENT)
- Crea y gestiona sus propios experimentos
- Registra uso de equipos
- Check-in / Check-out de asistencia
- Solo ve sus propios datos

### Servicio Social (SERVICE)
- Check-in / Check-out de asistencia (contabilización de horas)
- Registro básico de uso de equipos

---

## 6. API

### Endpoints REST

| Método | Ruta | Propósito |
|---|---|---|
| GET | `/api/auth/session` | Verificar sesión activa |
| GET | `/api/auth/logout` | Cerrar sesión |

### Server Actions (formularios)

| Archivo | Acción |
|---|---|
| `login/page.tsx` | `handleLogin` — Autenticar usuario |
| `dashboard/layout.tsx` | `logoutAction` — Cerrar sesión |
| `experiments/new/page.tsx` | `createExperiment` — Crear experimento |
| `experiments/[id]/page.tsx` | `addMeasurement` — Agregar medición |
| `experiments/[id]/page.tsx` | `deleteMeasurement` — Eliminar medición |
| `experiments/[id]/page.tsx` | `completeExperiment` — Finalizar experimento |
| `equipment/page.tsx` | `registerUsage` — Registrar uso de equipo |
| `attendance/page.tsx` | `checkInAction` / `checkOutAction` — Asistencia |

---

## 7. ISO 17025 — Trazabilidad y Calidad

### Requisitos Cubiertos

| Requisito ISO 17025 | Implementación |
|---|---|
| **7.4** Registros de datos | Sistema web con formato estandarizado de experimentos |
| **7.5** Gestión de datos | Roles de usuario controlan acceso y modificaciones |
| **6.4** Equipamiento | Bitácora digital con historial y alertas de mantenimiento |
| **6.2** Personal | Registro de asistencia con trazabilidad de quién entra/sale |
| **7.2** Métodos | Réplicas automáticas (por triplicado) aseguran consistencia |

### Trazabilidad (AuditLog)

Todas las operaciones críticas quedan registradas en la tabla `AuditLog`:
- **Integridad:** No se eliminan registros, solo se cambia su estado
- **Atribución:** Cada cambio tiene un usuario responsable
- **Cronología:** Fecha y hora precisa de cada operación
- **Detalle:** Descripción textual de lo que se hizo

---

## 8. Cómo Ejecutar

### Requisitos
- Node.js 20+
- npm

### Instalación

```bash
cd laboratorio-app
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

### Acceso
- **Local:** http://localhost:3000
- **Login:** doctor@uacj.mx / admin123
- **Login estudiante:** estudiante@uacj.mx / admin123
- **Login servicio social:** servicio@uacj.mx / admin123

### Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Iniciar servidor de desarrollo |
| `npm run build` | Compilar para producción |
| `npm run seed` | Poblar base de datos con datos demo |
| `npm run lint` | Verificar código con ESLint |

---

## 9. Estructura del Proyecto

```
laboratorio-app/
├── .env                          # Variables de entorno
├── .gitignore
├── AGENTS.md                     # Instrucciones para el agente de IA
├── DOCUMENTACION.md              ← Este archivo
├── next.config.ts
├── package.json
├── prisma/
│   ├── schema.prisma             # Modelo de datos
│   ├── seed.ts                   # Datos de prueba
│   └── migrations/               # Migraciones de BD
├── proxy.ts                      # Middleware de autenticación
└── src/
    ├── app/
    │   ├── globals.css           # Estilos globales Tailwind
    │   ├── layout.tsx            # Layout raíz
    │   ├── page.tsx              # Redirección a /login
    │   ├── (auth)/               # Rutas públicas
    │   │   └── login/page.tsx    # Página de inicio de sesión
    │   ├── (dashboard)/          # Rutas protegidas
    │   │   └── dashboard/
    │   │       ├── layout.tsx    # Layout con sidebar
    │   │       ├── page.tsx      # Dashboard principal
    │   │       ├── experiments/  # Módulo Experimentación
    │   │       ├── equipment/    # Módulo Equipos
    │   │       └── attendance/   # Módulo Asistencia
    │   └── api/                  # API REST
    │       └── auth/
    │           ├── session/route.ts
    │           └── logout/route.ts
    ├── lib/                      # Capa de datos
    │   ├── auth.ts               # Autenticación JWT
    │   ├── dal.ts                # Data Access Layer
    │   ├── db.ts                 # Conexión Prisma
    │   └── types.ts              # Tipos TypeScript
    └── servicios/                # Capa de servicios
        ├── auditoria.ts          # Trazabilidad ISO 17025
        ├── experimentos.ts       # Gestión de experimentos
        ├── equipos.ts            # Gestión de equipos
        └── asistencia.ts         # Control de asistencia
```

---

## 10. Próximos Pasos

### Pendientes para futuras versiones

- [ ] **Inventario de Reactivos** (Módulo 4) — El Dr. Torres ya envió el Excel. Control de stock con alertas de bajo inventario
- [ ] **Notificaciones** — Avisar al Dr. cuando un estudiante completa un experimento
- [ ] **Cálculos automáticos** — Ecuaciones para obtener parámetros cinéticos (marcados en azul en el Excel)
- [ ] **Exportación a Excel/PDF** — Reportes descargables
- [ ] **Gráficas** — Visualización de curvas de absorbancia vs tiempo
- [ ] **Modo oscuro** — El CSS ya tiene variables preparadas
- [ ] **Despliegue en producción** — Migrar a PostgreSQL o Turso para Vercel/Railway

---

*Documentación generada el 4 de junio de 2026*
*Sistema desarrollado para el Laboratorio de Investigación UACJ — Dr. Torres*
