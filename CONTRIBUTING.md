# Contributing — TechMahindra PMS

## Arquitectura del proyecto

Este proyecto sigue una **arquitectura modular por dominio** (feature-based). Cada feature es auto-contenida en su propia carpeta con sus routes, controllers y validaciones.

### Backend (`node_runtime/src/`)

```
src/
├── config/           Configuracion global (supabase, constants, env)
├── shared/           Middleware, error handler, validators base
└── modules/
    ├── auth/         routes + controller + validation
    ├── projects/     routes + controller + validation
    ├── users/        routes + controller + validation
    └── sprints/      (ejemplo de feature nueva)
```

### Frontend (`my-app/src/`)

```
src/
├── config/           API client, constants
├── shared/           Componentes y hooks reutilizables
└── features/
    ├── auth/         Login + css
    ├── dashboard/    Vista principal
    ├── projects/     Lista, viewers, crear proyecto
    └── users/        Gestion de usuarios
```

---

## Regla de independencia de modulos

Los modulos **solo importan de `config/` y `shared/`**, nunca de otros modulos.

```
config/              Todos pueden usar
shared/              Todos pueden usar

modules/auth/       ──┐
modules/projects/   ──┤  NO se importan entre si
modules/users/      ──┤
modules/sprints/    ──┘
```

### Por que existe esta regla

Si `sprints.controller.js` importa una funcion de `projects.controller.js`, los dos modulos quedan acoplados. Cuando alguien modifica projects, puede romper sprints sin darse cuenta.

### Ejemplo

```javascript
// MAL — importar directo de otro modulo
const { getProjectById } = require("../projects/projects.controller");

// BIEN — cada modulo consulta la DB por su cuenta
const supabase = require("../../config/supabase");
const { data: project } = await supabase
  .from("project")
  .select("id_project")
  .eq("id_project", id)
  .single();
```

Si dos modulos necesitan la misma logica, esa logica sube a `shared/`.

---

## Como agregar una feature nueva

### Backend

1. Crear `src/modules/<feature>/`
2. Crear `<feature>.routes.js`, `<feature>.controller.js`, `<feature>.validation.js`
3. Registrar las rutas en `src/app.js`:
   ```javascript
   const featureRoutes = require("./modules/<feature>/<feature>.routes.js");
   app.use("/<feature>", featureRoutes);
   ```

### Frontend

1. Crear `src/features/<feature>/`
2. Crear los componentes necesarios
3. Importar `api` desde `config/api.js` para los fetch
4. Agregar la vista en el router/Dashboard

---

## Convencion de archivos por modulo

| Archivo | Responsabilidad |
|---------|----------------|
| `*.routes.js` | Define endpoints y aplica middleware |
| `*.controller.js` | Recibe request, consulta Supabase, envia response |
| `*.validation.js` | Schema Zod para validar input de cada endpoint |

### Flujo de un request

```
Request
  → routes.js (middleware auth + validacion Zod)
    → controller.js (logica + query a Supabase)
      → response OK / error handler global
```

---

## Archivos protegidos

Estos archivos afectan a todo el proyecto. Requieren PR dedicado y review de al menos un companero:

| Archivo | Razon |
|---------|-------|
| `node_runtime/src/app.js` | Configuracion central de Express |
| `node_runtime/src/config/*` | Afecta a todos los modulos |
| `node_runtime/src/shared/middleware/auth.js` | Rompe toda la autenticacion |
| `my-app/src/App.js` | Routing principal del frontend |
| `my-app/src/config/api.js` | Todos los fetch dependen de esto |

---

## Convencion de commits

Usar Conventional Commits y referenciar el RF o HU:

```
feat: add sprint management (RF-08)
fix: rbac filter on GET /projects (RF-06)
refactor: extract ProjectList from Dashboard
chore: update dependencies
```

## Convencion de ramas

```
SCRUM-XX-HU-YY-descripcion
```

Ejemplo: `SCRUM-15-HU-06-sprint-management`

## Antes de abrir PR

1. Verificar que los endpoints nuevos tengan `authUser` + `requireRole`
2. Verificar que los inputs esten validados con Zod
3. No importar entre modulos — solo de `config/` y `shared/`
4. Correr el backend y frontend sin errores en consola
