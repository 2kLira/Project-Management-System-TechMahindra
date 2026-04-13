# Project Management System - TechMahindra (contexto local)

## Stack
- Frontend: React 19 → `project/my-app/` (puerto 3000)
- Backend: Express 5 → `project/node_runtime/` (puerto 8080)
- DB: Supabase PostgreSQL

## Comandos
- Backend: `cd project/node_runtime && npm run dev`
- Frontend: `cd project/my-app && npm start`

## Roles del sistema
- `admin` → ve todos los proyectos, crea usuarios
- `pm` → ve/gestiona solo sus proyectos
- `viewer` → ve solo proyectos a los que está vinculado

## Convenciones de ramas
- Formato: `SCRUM-XX-HU-YY-descripcion`
- Main branch: `main`

## Estructura de API
- Auth: POST /auth/login | POST /auth/register | GET /auth/verify | POST /auth/logout
- Projects: GET /projects | GET /projects/managers | GET /projects/viewers | POST /projects/create
- Middleware auth: cookie HttpOnly con JWT (1h), validado en authUser + requireRole

## DB — tablas clave
- `users`, `role` → autenticación y roles
- `project`, `project_member` → proyectos y vinculación viewers
- `sprint`, `sprint_plan`, `sprint_progress` → sprints (DB existe, sin implementar)
- `audit_log`, `auditory`, `project_update` → auditoría
- `budget`, `spend` → presupuesto (DB existe, sin implementar)
- `semaphore`, `risk`, `notifications` → semáforo/riesgo/alertas (DB existe, sin implementar)
- `gamification`, `scorehistory` → gamificación (DB existe, sin implementar)

## Pendientes críticos
1. NO existe tabla `work_items` en DB (historias, tareas, bugs) — bloqueante para RF-07 a RF-13
2. `GET /projects` devuelve todos los proyectos sin filtrar por rol (viola RF-06)
3. Registro público asigna rol `pm` automáticamente — debería ser solo admin quien crea usuarios (RF-03)

## SRS — HUs implementadas
- HU-01: Login/Register ✅
- HU-03: Crear proyecto ✅
- HU-04: Asignar PM ✅
- HU-08: Vincular viewers ✅ (rama actual: SCRUM-11-HU-08)

## Próximas HUs
- HU-06: Sprints
- HU-07: Work items (historias/tareas/bugs)
- HU-10: Viewer actualiza estado de ítems
