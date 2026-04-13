# Spec: Reorganizacion modular del proyecto TechMahindra PMS

**Fecha:** 2026-04-11
**Autor:** Mario Burgos + Claude
**Estado:** Aprobado por el usuario

---

## Objetivo

Reorganizar el proyecto de una estructura plana a una arquitectura modular por dominio (feature-based) para que el equipo de 5 personas pueda trabajar en paralelo sin conflictos de merge. Incluye fixes de seguridad criticos detectados en code review.

## Alcance

- Reestructurar backend (node_runtime) a modulos independientes
- Reestructurar frontend (my-app) a features independientes
- Corregir 5 problemas de seguridad/correctitud
- No se agrega funcionalidad nueva
- No se agregan comentarios al codigo

---

## 1. Backend — Nueva estructura

### Antes

```
node_runtime/
├── index.js              (entry point + config + routes + listen — todo junto)
├── supabase.js           (client en raiz)
└── src/
    ├── auth/
    │   ├── auth.routes.js
    │   └── auth.controller.js
    ├── projects/
    │   ├── projects.routes.js
    │   └── projects.controller.js
    ├── users/
    │   ├── users.routes.js
    │   └── users.controller.js
    └── middleware/
        ├── auth.js
        └── auth.middleware.js    (duplicado, no se usa)
```

### Despues

```
node_runtime/
├── index.js                     (solo arranca el server)
├── .env
├── .env.example
├── package.json
└── src/
    ├── app.js                   (configura Express, monta modulos, error handler)
    ├── config/
    │   ├── supabase.js          (movido desde raiz)
    │   ├── constants.js         (roles, status, mensajes)
    │   └── env.js               (validacion de variables de entorno)
    ├── shared/
    │   ├── middleware/
    │   │   └── auth.js          (authUser + requireRole — uno solo)
    │   ├── errors/
    │   │   └── errorHandler.js  (middleware global)
    │   └── validators/
    │       └── validate.js      (wrapper generico Zod)
    └── modules/
        ├── auth/
        │   ├── auth.routes.js
        │   ├── auth.controller.js
        │   └── auth.validation.js
        ├── projects/
        │   ├── projects.routes.js
        │   ├── projects.controller.js
        │   └── projects.validation.js
        └── users/
            ├── users.routes.js
            ├── users.controller.js
            └── users.validation.js
```

### Cambios detallados

| Archivo | Accion |
|---------|--------|
| `supabase.js` (raiz) | Mover a `src/config/supabase.js` |
| `index.js` | Reducir a solo `require("./src/app")` + `app.listen()` |
| Nuevo `src/app.js` | Configurar Express, CORS, cookie-parser, montar rutas, error handler |
| `src/middleware/auth.js` | Mover a `src/shared/middleware/auth.js` |
| `src/middleware/auth.middleware.js` | Eliminar (duplicado no usado) |
| `src/auth/*` | Mover a `src/modules/auth/*` |
| `src/projects/*` | Mover a `src/modules/projects/*` |
| `src/users/*` | Mover a `src/modules/users/*` |
| Nuevo `src/config/constants.js` | Centralizar roles y mensajes hardcoded |
| Nuevo `src/config/env.js` | Validar que las variables de entorno existan al arrancar |
| Nuevo `src/shared/errors/errorHandler.js` | Middleware global de errores |
| Nuevo `src/shared/validators/validate.js` | Wrapper para usar schemas Zod en routes |
| Nuevo `src/modules/*/validation.js` | Schema Zod por modulo |

### Regla de modulos

Los modulos solo importan de `config/` y `shared/`, nunca entre si. Si dos modulos necesitan la misma logica, sube a `shared/`.

---

## 2. Frontend — Nueva estructura

### Antes

```
my-app/src/
├── App.js                    (auth check + routing por estado + layout)
├── auth/
│   ├── Login.js
│   └── Login.css
├── components/
│   ├── Sidebar.js
│   └── Sidebar.css
├── dashboard/
│   ├── Dashboard.js          (god component — lista proyectos + viewers + navegacion)
│   ├── CreateProject.js
│   └── users/
│       ├── UserManagement.js
│       └── UserManagement.css
└── projects/
    └── ProjectViewers.js     (llama endpoint que no existe)
```

### Despues

```
my-app/src/
├── App.js                       (solo routing y layout)
├── config/
│   ├── api.js                   (API client centralizado)
│   └── constants.js             (roles, mensajes)
├── shared/
│   ├── components/
│   │   ├── Sidebar.js
│   │   └── Sidebar.css
│   └── hooks/
│       └── useAuth.js           (logica auth reutilizable)
└── features/
    ├── auth/
    │   ├── Login.js
    │   └── Login.css
    ├── dashboard/
    │   ├── Dashboard.js         (orquestador ligero)
    │   └── Dashboard.css
    ├── projects/
    │   ├── ProjectList.js       (extraido de Dashboard)
    │   ├── ProjectViewers.js    (corregido)
    │   ├── CreateProject.js
    │   └── projects.css
    └── users/
        ├── UserManagement.js
        └── UserManagement.css
```

### Cambios detallados

| Archivo | Accion |
|---------|--------|
| `App.js` | Simplificar a routing + layout, extraer logica auth a hook |
| Nuevo `config/api.js` | Centralizar fetch con base URL desde `.env` |
| Nuevo `config/constants.js` | Roles y rutas compartidas |
| `components/Sidebar.js` | Mover a `shared/components/Sidebar.js` |
| Nuevo `shared/hooks/useAuth.js` | Extraer logica de verificacion/login/logout |
| `dashboard/Dashboard.js` | Reducir a orquestador, extraer lista a `ProjectList.js` |
| Nuevo `features/projects/ProjectList.js` | Lista de proyectos (extraido de Dashboard) |
| `projects/ProjectViewers.js` | Mover a `features/projects/`, corregir endpoint |
| `dashboard/CreateProject.js` | Mover a `features/projects/CreateProject.js` |
| `dashboard/users/*` | Mover a `features/users/*` |
| Nuevo `.env` | `REACT_APP_API_URL=http://localhost:8080` |

### API Client

```javascript
// config/api.js
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

const api = {
  get: (path) => fetch(`${BASE_URL}${path}`, { credentials: "include" }).then(r => r.json()),
  post: (path, body) => fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  }).then(r => r.json()),
  put: (path, body) => /* similar */,
  delete: (path) => /* similar */,
};
```

---

## 3. Fixes de seguridad

| # | Problema | Severidad | Fix |
|---|----------|-----------|-----|
| 1 | `/users` endpoints sin auth | Critico | Agregar `authUser` + `requireRole("admin")` a las 3 rutas |
| 2 | Middleware duplicado `auth.middleware.js` | Alto | Eliminar archivo, conservar solo `auth.js` |
| 3 | `ProjectViewers.js` llama endpoint inexistente | Alto | Cambiar a `/projects/viewers` + filtrar en frontend |
| 4 | `schema.sql` desincronizado con DB real | Medio | Actualizar nombres: project, project_member |
| 5 | Roles hardcoded como strings | Medio | Centralizar en `config/constants.js` |

---

## 4. Lo que NO cambia

- No se agrega funcionalidad nueva (sprints, work items, etc.)
- No se agregan comentarios al codigo
- No se cambia la logica de negocio de ningun controller
- No se cambian las dependencias (no se instala React Router aun)
- No se cambia la base de datos
- No se cambia el flujo de autenticacion

---

## 5. Orden de ejecucion

La reorganizacion se ejecuta en este orden para evitar romper el proyecto en ningun momento:

1. **Backend config** — crear `config/`, mover supabase, crear constants, crear env.js
2. **Backend shared** — mover middleware, crear error handler, crear validate wrapper
3. **Backend modules** — mover auth, projects, users a modules/
4. **Backend entry** — crear app.js, simplificar index.js
5. **Backend fixes** — auth en users routes, eliminar middleware duplicado
6. **Backend validation** — crear *.validation.js por modulo
7. **Frontend config** — crear config/api.js, constants, .env
8. **Frontend shared** — mover Sidebar, crear useAuth hook
9. **Frontend features** — mover componentes a features/
10. **Frontend decompose** — extraer ProjectList de Dashboard
11. **Frontend fix** — corregir ProjectViewers endpoint
12. **Docs** — actualizar schema.sql

Cada paso deja el proyecto funcional. Si algo falla, se puede revertir sin afectar los pasos anteriores.
