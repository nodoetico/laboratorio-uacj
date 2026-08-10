# LabControl UACJ — Documentación del Proyecto

## URL de producción
https://laboratorio-uacj.vercel.app

## Base de datos
PostgreSQL en Neon. La conexión se define únicamente en la variable de entorno `DATABASE_URL` (en `.env` y en Vercel), nunca hardcodeada en el repositorio.

## Credenciales
- Admin: `doctor@uacj.mx` — contraseña segura entregada por separado (Dr. Jonatan Torres Pérez, único admin). **NO** usar `admin123`.
- El registro público `/register` está bloqueado en producción; las cuentas de estudiante las crea el admin vía script (`npm run crear-estudiantes`).
- Las cuentas demo `estudiante@uacj.mx` y `servicio@uacj.mx` están **desactivadas** (`active=false`).

---

## Funcionalidades Implementadas (100%)

### Autenticación
- Login JWT con sesión de 7 días
- 3 roles: ADMIN, STUDENT, SERVICE
- Middleware de protección de rutas
- Heartbeat cada 2 min, limpieza de sesiones expiradas

### Dashboard
- Tarjetas con estadísticas (equipos, reactivos, experimentos, usuarios, etc.)
- Secciones: laboratorio ahora, sesiones activas, stock bajo, acceso rápido

### Experimentos
- Crear experimento con: título, contaminante, C₀, masa, volumen, agitación (rpm), temperatura (°C), pH
- 3 réplicas automáticas por triplicado
- Agregar/eliminar mediciones (tiempo, absorbancia)
- **Cálculos cinéticos de 1er orden**: K, R², vida media, ln(A₀) por réplica
- **Cálculos cinéticos de 2do orden**: K₂, R², promedios por tiempo, Ce, qe, t/qe
- Gráfica absorbancia vs tiempo (Chart.js)
- Finalizar experimento con notificación a admin
- Botón de ayuda (?) con info de cálculos

### Equipos
- 9 equipos registrados: Balanza Analítica, Espectrómetro UV-Vis, pH-metro, Agitador Magnético, Estufa de Secado, Mufla, Agitador Rotatorio, Espectrofotómetro de microplaca, Ultracentrífuga
- Registrar uso: descripción, **sustancia**, inicio, fin
- Indicador de mantenimiento requerido (180 días)
- Columna **Matrícula** visible en tabla
- Exportar a Excel/PDF

### Asistencia
- Check-in / check-out
- Duración automática
- Resumen del día (entradas, salidas, en laboratorio)
- Columna **Matrícula** visible en tabla
- Exportar a Excel/PDF

### Reactivos
- CRUD completo (crear, editar, eliminar suave, ver detalle)
- 60 reactivos seed del inventario real del Dr. Torres
- Movimientos IN/OUT con stock actualizado atómicamente
- Validación de stock insuficiente
- Alerta de stock bajo en dashboard y listado
- Historial de movimientos por reactivo
- **Barra de búsqueda** por nombre, descripción o ubicación

### Notificaciones
- Campana con contador de no leídas
- Marcar individualmente o todas como leídas
- Notificaciones a admin cuando un estudiante completa experimento

### Exportaciones
- Experimentos a Excel/PDF (solo admin, solo completados)
- Asistencia a Excel/PDF
- Equipos a Excel/PDF

### Auditoría (ISO 17025)
- Trazabilidad de todas las operaciones en AuditLog
- **Página de auditoría visible** en `/dashboard/auditoria` (solo admin): tabla con fecha, usuario, acción, entidad y detalle, filtro por entidad y paginación. Link en el sidebar.

### Reactivos (adicionales)
- **Campo `containers`** (número de envases) en schema, formulario de creación/edición, detalle y exportación
- **Editar cantidad directamente** en la página de edición (registra ajuste de inventario con trazabilidad, auditoría `AJUSTAR_CANTIDAD`)
- **Exportación a Excel/PDF** (solo admin)

### Asistencia
- **Formato de asistencia mensual (31 días)** en `/dashboard/attendance/reporte` (solo admin): selector de mes/año/estudiante, vista por estudiante (tabla día × hora) y vista general (matriz estudiante × días)
- **Exportación del reporte mensual a Excel/PDF** (hoja por estudiante + resumen) vía `/api/exportar/asistencia-mensual`

### Equipos
- **Intervalo de mantenimiento configurable por equipo** (solo admin): campo `maintenanceDays` editable en cada tarjeta

### Autenticación
- **Registro de estudiante** en `/register` (crea cuenta STUDENT con matrícula opcional, auto-login). **Bloqueado en producción** (redirige a `/login`); en desarrollo sí funciona
- **Recuperación de contraseña** en `/recuperar` (genera token de 1 hora, modelo `PasswordResetToken`) y `/restablecer` (nueva contraseña). SMTP no configurado: el enlace se muestra en pantalla

### Mejoras de tablas
- **Filtros por fecha** (desde/hasta) en asistencia y usos de equipos
- **Paginación** en reactivos, asistencia, usos de equipos y auditoría (componente reutilizable `Paginacion`)

### Varios
- Modo oscuro
- Exportación de experimentos por email al completarse

---

## Funcionalidades Pendientes por Implementar

> Estado: los 10 pendientes del cliente (#4–#14) están **implementados** (ver secciones anteriores).

### Pendientes menores / mejoras futuras

| # | Funcionalidad | Detalle |
|---|--------------|---------|
| — | SMTP de correo | Notificaciones por email inactivas (recuperación de contraseña muestra enlace en pantalla) |
| — | Sustancia separada en exportación equipos | Verificar que el export incluya la columna Sustancia |

---

## Cambios Recientes (Última sesión)

### Migración: containers + PasswordResetToken
```prisma
model Reagent {
  ...
  containers Int @default(1)
  ...
}

model PasswordResetToken {
  id        Int      @id @default(autoincrement())
  userId    Int
  token     String   @unique
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```
Aplicado a local y Neon. Migración: `prisma/migrations/20260726000000_add_containers_y_reset/migration.sql`.

### Schema - Campo `studentId` en User
```prisma
model User {
  ...
  studentId String?  @unique
  ...
}
```
Aplicado a local y Neon via ALTER TABLE.

### Schema - Campo `substance` en EquipmentUsage
```prisma
model EquipmentUsage {
  ...
  substance   String?
  ...
}
```
Aplicado a local y Neon via ALTER TABLE.

### Seed actualizado
- Usuarios demo con matrículas: Estudiante (220000), Servicio Social (220001)
- 4 equipos agregados: Mufla, Agitador Rotatorio, Espectrofotómetro de microplaca, Ultracentrífuga

### Vistas actualizadas
- Asistencia: columna Matrícula en tabla y exportación
- Equipos: columna Matrícula, columna Sustancia, campo Sustancia en formulario
- Exportaciones Excel/PDF incluyen Matrícula y Sustancia

---

## Notas Técnicas

### Comandos útiles
```bash
# Build local
npm run build

# Deploy a Vercel (producción)
npx vercel --prod --yes

# Migración manual a Neon (ejemplo)
node --input-type=module -e "
import postgres from 'postgres';
const sql = postgres('URL_NEON');
await sql.unsafe('ALTER TABLE ...');
await sql.end();
"

# Generar Prisma client
npx prisma generate
```

### Variables de entorno en Vercel
- `DATABASE_URL` — Conexión a Neon
- `JWT_SECRET` — Secreto para tokens JWT

### Último deploy
- Aliased a: https://laboratorio-uacj.vercel.app
- Proyecto Vercel: buczek-guillermo-sebastians-projects/laboratorio-uacj