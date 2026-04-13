# Modular Reorganization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the TechMahindra PMS from a flat structure to a modular feature-based architecture, fixing critical security issues along the way. No new functionality added.

**Architecture:** Backend moves to `src/modules/<domain>/` with shared config and middleware. Frontend moves to `src/features/<domain>/` with centralized API client. Each module is self-contained and only imports from `config/` and `shared/`.

**Tech Stack:** Express 5 (CommonJS), React 19 (CRA), Supabase, Zod (new dependency for validation)

---

## File Map

### Backend — Files to create

| File | Responsibility |
|------|---------------|
| `src/app.js` | Express config, CORS, cookie-parser, mount routes, error handler |
| `src/config/supabase.js` | Supabase client (moved from root) |
| `src/config/constants.js` | Roles, statuses, error messages |
| `src/config/env.js` | Validate required env vars at startup |
| `src/shared/middleware/auth.js` | authUser + requireRole (moved from src/middleware/) |
| `src/shared/errors/errorHandler.js` | Global Express error handler |
| `src/shared/validators/validate.js` | Zod validation middleware wrapper |
| `src/modules/auth/auth.routes.js` | Auth routes (moved) |
| `src/modules/auth/auth.controller.js` | Auth logic (moved, updated imports) |
| `src/modules/auth/auth.validation.js` | Zod schemas for login/register |
| `src/modules/projects/projects.routes.js` | Project routes (moved) |
| `src/modules/projects/projects.controller.js` | Project logic (moved, updated imports) |
| `src/modules/projects/projects.validation.js` | Zod schemas for create/viewers |
| `src/modules/users/users.routes.js` | User routes (moved, add auth middleware) |
| `src/modules/users/users.controller.js` | User logic (moved, updated imports) |
| `src/modules/users/users.validation.js` | Zod schemas for status/role updates |

### Backend — Files to delete

| File | Reason |
|------|--------|
| `supabase.js` (root) | Moved to `src/config/supabase.js` |
| `src/middleware/auth.middleware.js` | Duplicate, unused |
| `src/middleware/auth.js` | Moved to `src/shared/middleware/auth.js` |
| `src/auth/` (directory) | Moved to `src/modules/auth/` |
| `src/projects/` (directory) | Moved to `src/modules/projects/` |
| `src/users/` (directory) | Moved to `src/modules/users/` |
| `src/middleware/` (directory) | Moved to `src/shared/middleware/` |

### Backend — Files to modify

| File | Change |
|------|--------|
| `index.js` | Simplify to only require app.js and listen |
| `db/schema.sql` | Update to match real table names |
| `package.json` | Add zod dependency, update start script path |

### Frontend — Files to create

| File | Responsibility |
|------|---------------|
| `src/config/api.js` | Centralized fetch client with base URL from env |
| `src/config/constants.js` | Roles, routes |
| `src/shared/components/Sidebar.js` | Sidebar (moved from components/) |
| `src/shared/components/Sidebar.css` | Sidebar styles (moved) |
| `src/shared/hooks/useAuth.js` | Auth verification + login/logout logic |
| `src/features/auth/Login.js` | Login (moved, use api client) |
| `src/features/auth/Login.css` | Login styles (moved) |
| `src/features/dashboard/Dashboard.js` | Slimmed dashboard, delegates to ProjectList |
| `src/features/projects/ProjectList.js` | Project cards + viewer management (extracted from Dashboard) |
| `src/features/projects/ProjectViewers.js` | Standalone viewer management (moved, fixed endpoint) |
| `src/features/projects/CreateProject.js` | Create project form (moved, use api client) |
| `src/features/users/UserManagement.js` | User management (moved, use api client) |
| `src/features/users/UserManagement.css` | User management styles (moved) |

### Frontend — Files to delete

| File | Reason |
|------|--------|
| `src/auth/` (directory) | Moved to `src/features/auth/` |
| `src/components/` (directory) | Moved to `src/shared/components/` |
| `src/dashboard/` (directory) | Split into `features/dashboard/` and `features/projects/` |
| `src/projects/` (directory) | Moved to `src/features/projects/` |

### Frontend — Files to modify

| File | Change |
|------|--------|
| `src/App.js` | Use useAuth hook, update import paths |
| `.env` (create) | Add `REACT_APP_API_URL=http://localhost:8080` |

---

## Task 1: Install Zod and create backend config layer

**Files:**
- Modify: `project/node_runtime/package.json`
- Create: `project/node_runtime/src/config/supabase.js`
- Create: `project/node_runtime/src/config/constants.js`
- Create: `project/node_runtime/src/config/env.js`

- [ ] **Step 1: Install Zod**

```bash
cd project/node_runtime && npm install zod
```

- [ ] **Step 2: Create `src/config/supabase.js`**

```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

module.exports = supabase;
```

- [ ] **Step 3: Create `src/config/constants.js`**

```javascript
const ROLES = {
    ADMIN: 'admin',
    PM: 'pm',
    VIEWER: 'viewer',
};

const VALID_ROLES = [ROLES.ADMIN, ROLES.PM, ROLES.VIEWER];

module.exports = { ROLES, VALID_ROLES };
```

- [ ] **Step 4: Create `src/config/env.js`**

```javascript
function validateEnv() {
    const required = ['SUPABASE_URL', 'SUPABASE_KEY', 'JWT_SECRET'];
    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }
}

module.exports = { validateEnv };
```

- [ ] **Step 5: Verify config files exist**

```bash
ls -la project/node_runtime/src/config/
```

Expected: `supabase.js`, `constants.js`, `env.js`

- [ ] **Step 6: Commit**

```bash
git add project/node_runtime/src/config/ project/node_runtime/package.json project/node_runtime/package-lock.json
git commit -m "refactor: create backend config layer (supabase, constants, env)"
```

---

## Task 2: Create backend shared layer

**Files:**
- Create: `project/node_runtime/src/shared/middleware/auth.js`
- Create: `project/node_runtime/src/shared/errors/errorHandler.js`
- Create: `project/node_runtime/src/shared/validators/validate.js`

- [ ] **Step 1: Create `src/shared/middleware/auth.js`**

Copy from current `src/middleware/auth.js` but update the supabase import:

```javascript
const jwt = require('jsonwebtoken');
const supabase = require('../../config/supabase');

async function authUser(req, res, next) {
    try {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({ message: 'Authentication required. No token found.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const { data: user, error } = await supabase
            .from('users')
            .select(`
                id_user,
                username,
                email,
                role (
                    status
                )
            `)
            .eq('id_user', decoded.id)
            .single();

        if (error || !user) {
            return res.status(401).json({ message: 'Invalid token. User not found.' });
        }

        req.user = {
            id_user: user.id_user,
            username: user.username,
            email: user.email,
            role: user.role?.status || null
        };

        next();
    } catch (err) {
        console.error('authUser error:', err.message);
        return res.status(401).json({ message: 'Unauthorized access.' });
    }
}

function requireRole(...allowed) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required.' });
        }

        if (!allowed.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Required role: ${allowed.join(' or ')}`
            });
        }

        next();
    };
}

module.exports = { authUser, requireRole };
```

- [ ] **Step 2: Create `src/shared/errors/errorHandler.js`**

```javascript
function errorHandler(err, req, res, next) {
    console.error(`[${req.method}] ${req.path} →`, err.message);

    const status = err.status || 500;
    const message = status === 500 ? 'Internal server error' : err.message;

    res.status(status).json({ message });
}

module.exports = { errorHandler };
```

- [ ] **Step 3: Create `src/shared/validators/validate.js`**

```javascript
const { ZodError } = require('zod');

function validate(schema) {
    return (req, res, next) => {
        try {
            schema.parse(req.body);
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                return res.status(400).json({
                    message: 'Validation error',
                    errors: err.errors.map(e => ({
                        field: e.path.join('.'),
                        message: e.message,
                    })),
                });
            }
            next(err);
        }
    };
}

module.exports = { validate };
```

- [ ] **Step 4: Verify shared files exist**

```bash
ls -R project/node_runtime/src/shared/
```

Expected: `middleware/auth.js`, `errors/errorHandler.js`, `validators/validate.js`

- [ ] **Step 5: Commit**

```bash
git add project/node_runtime/src/shared/
git commit -m "refactor: create backend shared layer (middleware, errors, validators)"
```

---

## Task 3: Move auth module to modules/auth/

**Files:**
- Create: `project/node_runtime/src/modules/auth/auth.routes.js`
- Create: `project/node_runtime/src/modules/auth/auth.controller.js`
- Create: `project/node_runtime/src/modules/auth/auth.validation.js`

- [ ] **Step 1: Create `src/modules/auth/auth.validation.js`**

```javascript
const { z } = require('zod');

const loginSchema = z.object({
    email_user: z.string().min(1, 'Email or username is required'),
    password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    username: z.string().min(1, 'Username is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    full_name: z.string().min(1, 'Full name is required'),
    role: z.enum(['admin', 'pm', 'viewer'], { message: 'Invalid role' }),
});

module.exports = { loginSchema, registerSchema };
```

- [ ] **Step 2: Create `src/modules/auth/auth.controller.js`**

Copy from `src/auth/auth.controller.js`, update imports:

```javascript
const supabase = require('../../config/supabase');
const { VALID_ROLES } = require('../../config/constants');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

async function login(req, res) {
    try {
        const { email_user, password } = req.body;

        const { data, error } = await supabase
            .from('users')
            .select('id_user, email, username, password_hash')
            .or(`email.eq.${email_user},username.eq.${email_user}`)
            .single();

        if (error || !data) {
            return res.status(401).json({ message: 'User not found' });
        }

        const validPassword = await argon2.verify(data.password_hash, password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid password' });
        }

        await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id_user', data.id_user);

        const { data: roleData } = await supabase
            .from('role')
            .select('status')
            .eq('id_user', data.id_user)
            .single();

        const role = roleData?.status || 'viewer';

        const token = jwt.sign(
            { id: data.id_user, role, username: data.username },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 3600000
        });

        return res.status(200).json({
            message: 'Login success',
            id_user: data.id_user,
            username: data.username,
            email: data.email,
            role,
        });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
}

async function register(req, res) {
    const { email, username, password, full_name, role } = req.body;

    try {
        if (!VALID_ROLES.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const hash = await argon2.hash(password);

        const { data, error } = await supabase
            .from('users')
            .insert({ email, username, full_name, password_hash: hash })
            .select();

        if (error) {
            return res.status(400).json({ message: 'Error creating user', detail: error.message });
        }

        const user = data[0];

        const { error: roleError } = await supabase
            .from('role')
            .insert({ id_user: user.id_user, status: role });

        if (roleError) {
            return res.status(500).json({ message: 'Error assigning role', detail: roleError.message });
        }

        return res.status(201).json({ message: 'User created successfully', user });

    } catch (err) {
        return res.status(500).json({ message: 'Server error', detail: err.message });
    }
}

function verify_token(req, res) {
    const token = req.cookies?.token;

    if (!token) {
        return res.status(401).json({ message: "Token not provided" });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        return res.status(200).json({
            message: "Access granted",
            user: { id: payload.id, role: payload.role, username: payload.username }
        });
    } catch {
        return res.status(403).json({ message: "Invalid token" });
    }
}

function logout(req, res) {
    res.clearCookie('token');
    return res.status(200).json({ message: 'Logout success' });
}

function me(req, res) {
    return res.status(200).json(req.user);
}

module.exports = { login, register, verify_token, logout, me };
```

- [ ] **Step 3: Create `src/modules/auth/auth.routes.js`**

```javascript
const express = require('express');
const router = express.Router();
const { login, register, verify_token, logout, me } = require('./auth.controller');
const { authUser } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/validators/validate');
const { loginSchema, registerSchema } = require('./auth.validation');

router.post('/login', validate(loginSchema), login);
router.post('/register', validate(registerSchema), register);
router.get('/verify', verify_token);
router.get('/me', authUser, me);
router.post('/logout', logout);

module.exports = router;
```

- [ ] **Step 4: Commit**

```bash
git add project/node_runtime/src/modules/auth/
git commit -m "refactor: move auth to modules/auth with Zod validation"
```

---

## Task 4: Move projects module to modules/projects/

**Files:**
- Create: `project/node_runtime/src/modules/projects/projects.routes.js`
- Create: `project/node_runtime/src/modules/projects/projects.controller.js`
- Create: `project/node_runtime/src/modules/projects/projects.validation.js`

- [ ] **Step 1: Create `src/modules/projects/projects.validation.js`**

```javascript
const { z } = require('zod');

const createProjectSchema = z.object({
    project_name: z.string().min(1, 'Project name is required'),
    client_name: z.string().min(1, 'Client name is required'),
    id_pm: z.number({ message: 'PM ID is required (CA-03)' }),
    description: z.string().optional().nullable(),
    start_date: z.string().optional().nullable(),
    deadline: z.string().optional().nullable(),
    estimated_sp: z.number().optional().nullable(),
    viewer_ids: z.array(z.number()).optional().default([]),
});

const addViewerSchema = z.object({
    viewer_id: z.number({ message: 'viewer_id is required' }),
});

module.exports = { createProjectSchema, addViewerSchema };
```

- [ ] **Step 2: Create `src/modules/projects/projects.controller.js`**

Copy from `src/projects/projects.controller.js`, update the import on line 1:

```javascript
const supabase = require('../../config/supabase');
```

The rest of the file stays identical — all 7 functions (`getProjects`, `getManagers`, `getViewers`, `createProject`, `getProjectViewers`, `addViewerToProject`, `removeViewerFromProject`) and the `module.exports` at the bottom.

- [ ] **Step 3: Create `src/modules/projects/projects.routes.js`**

```javascript
const express = require('express');
const router = express.Router();
const {
    getProjects,
    getManagers,
    getViewers,
    createProject,
    getProjectViewers,
    addViewerToProject,
    removeViewerFromProject,
} = require('./projects.controller');
const { authUser, requireRole } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/validators/validate');
const { createProjectSchema, addViewerSchema } = require('./projects.validation');

router.get('/', authUser, getProjects);
router.get('/managers', authUser, requireRole('admin', 'pm'), getManagers);
router.get('/viewers', authUser, requireRole('admin', 'pm'), getViewers);
router.post('/create', authUser, requireRole('admin', 'pm'), validate(createProjectSchema), createProject);
router.get('/:id/viewers', authUser, requireRole('admin', 'pm'), getProjectViewers);
router.post('/:id/viewers', authUser, requireRole('admin', 'pm'), validate(addViewerSchema), addViewerToProject);
router.delete('/:id/viewers/:viewer_id', authUser, requireRole('admin', 'pm'), removeViewerFromProject);

module.exports = router;
```

- [ ] **Step 4: Commit**

```bash
git add project/node_runtime/src/modules/projects/
git commit -m "refactor: move projects to modules/projects with Zod validation"
```

---

## Task 5: Move users module to modules/users/ + fix auth security

**Files:**
- Create: `project/node_runtime/src/modules/users/users.routes.js`
- Create: `project/node_runtime/src/modules/users/users.controller.js`
- Create: `project/node_runtime/src/modules/users/users.validation.js`

- [ ] **Step 1: Create `src/modules/users/users.validation.js`**

```javascript
const { z } = require('zod');

const updateStatusSchema = z.object({
    status: z.string().min(1, 'Status is required'),
});

const updateRoleSchema = z.object({
    role: z.enum(['admin', 'pm', 'viewer'], { message: 'Invalid role' }),
});

module.exports = { updateStatusSchema, updateRoleSchema };
```

- [ ] **Step 2: Create `src/modules/users/users.controller.js`**

Copy from `src/users/users.controller.js`, update the import on line 1:

```javascript
const supabase = require('../../config/supabase');
```

The rest of the file stays identical — all 3 functions (`getUsers`, `updateStatus`, `updateRole`) and the `module.exports`.

- [ ] **Step 3: Create `src/modules/users/users.routes.js`** — **SECURITY FIX: add auth middleware**

```javascript
const express = require('express');
const router = express.Router();
const { getUsers, updateStatus, updateRole } = require('./users.controller');
const { authUser, requireRole } = require('../../shared/middleware/auth');
const { validate } = require('../../shared/validators/validate');
const { updateStatusSchema, updateRoleSchema } = require('./users.validation');

router.get('/', authUser, requireRole('admin'), getUsers);
router.put('/status/:id', authUser, requireRole('admin'), validate(updateStatusSchema), updateStatus);
router.put('/role/:id', authUser, requireRole('admin'), validate(updateRoleSchema), updateRole);

module.exports = router;
```

- [ ] **Step 4: Commit**

```bash
git add project/node_runtime/src/modules/users/
git commit -m "fix: move users to modules/users, add auth middleware to all endpoints"
```

---

## Task 6: Create app.js and rewire index.js

**Files:**
- Create: `project/node_runtime/src/app.js`
- Modify: `project/node_runtime/index.js`

- [ ] **Step 1: Create `src/app.js`**

```javascript
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { errorHandler } = require('./shared/errors/errorHandler');

const authRoutes = require('./modules/auth/auth.routes');
const projectRoutes = require('./modules/projects/projects.routes');
const userRoutes = require('./modules/users/users.routes');

const app = express();

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));
app.use(cookieParser());

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/users', userRoutes);

app.use(errorHandler);

module.exports = app;
```

- [ ] **Step 2: Simplify `index.js`**

Replace the entire content of `project/node_runtime/index.js` with:

```javascript
require('dotenv').config();

const { validateEnv } = require('./src/config/env');
validateEnv();

const app = require('./src/app');

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});
```

- [ ] **Step 3: Delete old files**

```bash
rm project/node_runtime/supabase.js
rm project/node_runtime/src/middleware/auth.middleware.js
rm project/node_runtime/src/middleware/auth.js
rmdir project/node_runtime/src/middleware
rm project/node_runtime/src/auth/auth.routes.js
rm project/node_runtime/src/auth/auth.controller.js
rmdir project/node_runtime/src/auth
rm project/node_runtime/src/projects/projects.routes.js
rm project/node_runtime/src/projects/projects.controller.js
rmdir project/node_runtime/src/projects
rm project/node_runtime/src/users/users.routes.js
rm project/node_runtime/src/users/users.controller.js
rmdir project/node_runtime/src/users
```

- [ ] **Step 4: Test backend starts**

```bash
cd project/node_runtime && npm run dev
```

Expected: `App listening on port 8080` with no errors. Stop the server after confirming.

- [ ] **Step 5: Commit**

```bash
git add -A project/node_runtime/
git commit -m "refactor: rewire backend entry point, delete old structure"
```

---

## Task 7: Create frontend config layer

**Files:**
- Create: `project/my-app/.env`
- Create: `project/my-app/src/config/api.js`
- Create: `project/my-app/src/config/constants.js`

- [ ] **Step 1: Create `project/my-app/.env`**

```
REACT_APP_API_URL=http://localhost:8080
```

- [ ] **Step 2: Create `src/config/api.js`**

```javascript
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = {
    get: async (path) => {
        const res = await fetch(`${BASE_URL}${path}`, {
            credentials: 'include',
        });
        return { res, data: await res.json() };
    },

    post: async (path, body) => {
        const res = await fetch(`${BASE_URL}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
        });
        return { res, data: await res.json() };
    },

    put: async (path, body) => {
        const res = await fetch(`${BASE_URL}${path}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
        });
        return { res, data: await res.json() };
    },

    delete: async (path) => {
        const res = await fetch(`${BASE_URL}${path}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        return { res, data: await res.json().catch(() => ({})) };
    },
};

export default api;
```

- [ ] **Step 3: Create `src/config/constants.js`**

```javascript
export const ROLES = {
    ADMIN: 'admin',
    PM: 'pm',
    VIEWER: 'viewer',
};
```

- [ ] **Step 4: Commit**

```bash
git add project/my-app/.env project/my-app/src/config/
git commit -m "refactor: create frontend config layer (api client, constants, env)"
```

---

## Task 8: Create frontend shared layer

**Files:**
- Create: `project/my-app/src/shared/components/Sidebar.js`
- Create: `project/my-app/src/shared/components/Sidebar.css`
- Create: `project/my-app/src/shared/hooks/useAuth.js`

- [ ] **Step 1: Move Sidebar to shared**

```bash
mkdir -p project/my-app/src/shared/components
cp project/my-app/src/components/Sidebar.js project/my-app/src/shared/components/Sidebar.js
cp project/my-app/src/components/Sidebar.css project/my-app/src/shared/components/Sidebar.css
```

No changes needed in Sidebar.js content — it has no API calls or absolute imports to fix. The CSS import `./Sidebar.css` still works since they are in the same directory.

- [ ] **Step 2: Create `src/shared/hooks/useAuth.js`**

```javascript
import { useState, useEffect, useCallback } from 'react';
import api from '../../config/api';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkToken = useCallback(async () => {
        try {
            const { res, data } = await api.get('/auth/verify');
            if (res.ok) {
                setUser({ id: data.user.id, role: data.user.role, username: data.user.username });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkToken();
    }, [checkToken]);

    const login = useCallback(async (credentials) => {
        const { res, data } = await api.post('/auth/login', credentials);
        if (res.ok) {
            setUser({ id: data.id_user, role: data.role, username: data.username });
            return { ok: true };
        }
        return { ok: false, message: data.message || 'Login failed' };
    }, []);

    const logout = useCallback(async () => {
        await api.post('/auth/logout');
        setUser(null);
    }, []);

    return { user, loading, login, logout };
}
```

- [ ] **Step 3: Commit**

```bash
git add project/my-app/src/shared/
git commit -m "refactor: create frontend shared layer (Sidebar, useAuth hook)"
```

---

## Task 9: Move frontend features (auth, users)

**Files:**
- Create: `project/my-app/src/features/auth/Login.js`
- Create: `project/my-app/src/features/auth/Login.css`
- Create: `project/my-app/src/features/users/UserManagement.js`
- Create: `project/my-app/src/features/users/UserManagement.css`

- [ ] **Step 1: Create `src/features/auth/Login.js`** — uses api client + useAuth

```javascript
import { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
    const [form, setForm] = useState({ email_user: '', password: '' });
    const [mensaje, setMensaje] = useState('');

    async function login_proccess() {
        const result = await onLogin(form);
        if (!result.ok) {
            setMensaje('Login fail');
        }
    }

    return (
        <div className='login-layout'>
            <main className='login-form'>
                <h1>Sign in</h1>
                <div>
                    <label className='login-credential' htmlFor="EmailUsername">EMAIL ADRESS OR USERNAME</label>
                    <input
                        className='login-input'
                        type="text"
                        id="EmailUsername"
                        name="email_user"
                        value={form.email_user}
                        onChange={(e) => setForm({ ...form, email_user: e.target.value })}
                    />
                </div>
                <div>
                    <label className='login-credential' htmlFor="Password">PASSWORD</label>
                    <input
                        className='login-input'
                        type="password"
                        id="Password"
                        name="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                </div>
                <button className='login-button' onClick={login_proccess}>Login</button>
                <p>{mensaje}</p>
            </main>
        </div>
    );
}

export default Login;
```

- [ ] **Step 2: Copy Login.css**

```bash
mkdir -p project/my-app/src/features/auth
cp project/my-app/src/auth/Login.css project/my-app/src/features/auth/Login.css
```

- [ ] **Step 3: Create `src/features/users/UserManagement.js`** — uses api client

Replace all `fetch(\`${API_URL}...` calls with `api` calls. Key changes:

```javascript
import React, { useEffect, useState } from 'react';
import api from '../../config/api';
import './UserManagement.css';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [form, setForm] = useState({ full_name: '', email: '', role: 'viewer' });

    const fetchUsers = async () => {
        try {
            const { res, data } = await api.get('/users');
            setUsers(res.ok && Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching users:", err);
            setUsers([]);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleCreateUser = async () => {
        const { res, data } = await api.post('/users', form);
        if (!res.ok) { alert(data.error); return; }
        alert("User created");
        setForm({ full_name: '', email: '', role: 'viewer' });
        fetchUsers();
    };

    const toggleStatus = async (user) => {
        const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
        await api.put(`/users/status/${user.id_user}`, { status: newStatus });
        fetchUsers();
    };

    const changeRole = async (user) => {
        const newRole = prompt("Enter role: admin, pm, viewer", user.role?.status);
        if (!newRole) return;
        await api.put(`/users/role/${user.id_user}`, { role: newRole });
        fetchUsers();
    };

    const filteredUsers = users.filter(u =>
        (u.full_name || '').toLowerCase().includes(search.toLowerCase())
    );

    const totalUsers = users.length;
    const totalPM = users.filter(u => u.role?.status === 'pm').length;
    const totalViewers = users.filter(u => u.role?.status === 'viewer').length;

    const formatDate = (dateString) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleDateString('es-MX', {
            timeZone: 'America/Monterrey',
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    };

    return (
        <div className="users-container">
            <div className="users-header">
                <h1>User Management</h1>
            </div>

            <div className="cards">
                <div className="card">
                    <h3>Total Users</h3>
                    <h2>{totalUsers}</h2>
                    <p>3 roles assigned</p>
                </div>
                <div className="card">
                    <h3>Project Managers</h3>
                    <h2>{totalPM}</h2>
                    <p>Managing projects</p>
                </div>
                <div className="card">
                    <h3>Viewers</h3>
                    <h2>{totalViewers}</h2>
                    <p>Operational users</p>
                </div>
            </div>

            <h2>All Users</h2>
            <input className="search" placeholder="Search" value={search} onChange={e => setSearch(e.target.value)} />

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Last Login</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => (
                            <tr key={u.id_user}>
                                <td>{u.full_name || 'N/A'}</td>
                                <td>{u.email || ''}</td>
                                <td><span className={`role-badge ${u.role?.status || 'default'}`}>{u.role?.status || 'N/A'}</span></td>
                                <td><span className={`status-badge ${u.status}`}>{u.status}</span></td>
                                <td>{formatDate(u.last_login)}</td>
                                <td>
                                    <button onClick={() => changeRole(u)}>Edit</button>
                                    <button onClick={() => toggleStatus(u)}>{u.status === 'Active' ? 'Deactivate' : 'Activate'}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h2>Create New User</h2>
            <div className="form">
                <input placeholder="Full Name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
                <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="admin">Administrator</option>
                    <option value="pm">Project Manager</option>
                    <option value="viewer">Viewer</option>
                </select>
                <button onClick={handleCreateUser}>Create User</button>
            </div>
        </div>
    );
}
```

- [ ] **Step 4: Copy UserManagement.css**

```bash
mkdir -p project/my-app/src/features/users
cp project/my-app/src/dashboard/users/UserManagement.css project/my-app/src/features/users/UserManagement.css
```

- [ ] **Step 5: Commit**

```bash
git add project/my-app/src/features/auth/ project/my-app/src/features/users/
git commit -m "refactor: move auth and users to features/ with api client"
```

---

## Task 10: Move and decompose Dashboard + Projects

**Files:**
- Create: `project/my-app/src/features/dashboard/Dashboard.js`
- Create: `project/my-app/src/features/projects/ProjectList.js`
- Create: `project/my-app/src/features/projects/CreateProject.js`
- Create: `project/my-app/src/features/projects/ProjectViewers.js`

- [ ] **Step 1: Create `src/features/projects/ProjectList.js`** — extracted from Dashboard

```javascript
import { useState, useEffect, useCallback } from 'react';
import api from '../../config/api';

function ProjectList({ user }) {
    const [projects, setProjects] = useState([]);
    const [loadError, setLoadError] = useState('');
    const [allViewers, setAllViewers] = useState([]);
    const [projectViewers, setProjectViewers] = useState({});
    const [expandedProject, setExpandedProject] = useState(null);
    const [selectedViewer, setSelectedViewer] = useState({});
    const [loadingAdd, setLoadingAdd] = useState(null);

    const isPM = user?.role === 'pm' || user?.role === 'admin';

    const loadProjects = useCallback(async () => {
        setLoadError('');
        try {
            const { res, data } = await api.get('/projects');
            if (!res.ok) {
                setProjects([]);
                setLoadError(data.message || `Error ${res.status}`);
                return;
            }
            setProjects(Array.isArray(data) ? data : []);
        } catch (err) {
            setProjects([]);
            setLoadError('Error de conexion con el servidor');
        }
    }, []);

    const loadAllViewers = useCallback(async () => {
        try {
            const { res, data } = await api.get('/projects/viewers');
            if (res.ok) setAllViewers(data.viewers || []);
        } catch {}
    }, []);

    useEffect(() => {
        loadProjects();
        if (isPM) loadAllViewers();
    }, [loadProjects, loadAllViewers, isPM]);

    async function loadProjectViewers(projectId) {
        try {
            const { res, data } = await api.get(`/projects/${projectId}/viewers`);
            if (res.ok) {
                setProjectViewers(prev => ({ ...prev, [projectId]: data.viewers || [] }));
            }
        } catch {}
    }

    function toggleExpand(projectId) {
        if (expandedProject === projectId) {
            setExpandedProject(null);
        } else {
            setExpandedProject(projectId);
            loadProjectViewers(projectId);
        }
    }

    async function addViewer(projectId) {
        const viewerId = selectedViewer[projectId];
        if (!viewerId) return;
        setLoadingAdd(projectId);
        try {
            const { res } = await api.post(`/projects/${projectId}/viewers`, { viewer_id: parseInt(viewerId) });
            if (res.ok) {
                setSelectedViewer(prev => ({ ...prev, [projectId]: '' }));
                loadProjectViewers(projectId);
            }
        } catch {}
        finally { setLoadingAdd(null); }
    }

    async function removeViewer(projectId, viewerId) {
        try {
            await api.delete(`/projects/${projectId}/viewers/${viewerId}`);
            loadProjectViewers(projectId);
        } catch {}
    }

    const safeProjects = Array.isArray(projects) ? projects : [];

    return (
        <div>
            <h1 style={s.title}>Projects</h1>
            <p style={s.subtitle}>
                {user?.role === 'viewer' ? 'Projects you are assigned to.' : 'All projects you manage.'}
            </p>

            {loadError && <div style={s.errorBox}>{loadError}</div>}

            {safeProjects.length === 0 ? (
                <div style={s.empty}>
                    {loadError ? 'No se pudieron cargar los proyectos.' : 'No hay proyectos todavia.'}
                </div>
            ) : (
                safeProjects.map(project => {
                    const isExpanded = expandedProject === project.id_project;
                    const viewers = projectViewers[project.id_project] || [];
                    const availableViewers = allViewers.filter(
                        v => !viewers.find(pv => pv.id_user === v.id_user)
                    );
                    const isOwner = user?.role === 'admin' || project.id_pm === user?.id;

                    return (
                        <div key={project.id_project} style={s.card}>
                            <div style={s.cardHeader}>
                                <div>
                                    <div style={s.cardTitle}>{project.project_name}</div>
                                    <div style={s.cardMeta}>{project.client_name}</div>
                                </div>
                                {isPM && isOwner && (
                                    <button style={s.btnSecondary} onClick={() => toggleExpand(project.id_project)}>
                                        {isExpanded ? 'Hide Viewers' : 'Manage Viewers'}
                                    </button>
                                )}
                            </div>

                            {isExpanded && isPM && isOwner && (
                                <div style={s.cardBody}>
                                    <div style={s.sectionLabel}>VIEWERS ({viewers.length})</div>

                                    {viewers.length === 0 ? (
                                        <div style={s.emptyMsg}>No viewers linked yet.</div>
                                    ) : (
                                        viewers.map(v => (
                                            <div key={v.id_user} style={s.viewerRow}>
                                                <span>{v.username} <span style={{ color: '#AAA' }}>· {v.email}</span></span>
                                                <button style={s.btnDanger} onClick={() => removeViewer(project.id_project, v.id_user)}>
                                                    Remove
                                                </button>
                                            </div>
                                        ))
                                    )}

                                    <div style={s.addRow}>
                                        <select
                                            style={s.select}
                                            value={selectedViewer[project.id_project] || ''}
                                            onChange={e => setSelectedViewer(prev => ({
                                                ...prev,
                                                [project.id_project]: e.target.value
                                            }))}
                                        >
                                            <option value="">— Add viewer —</option>
                                            {availableViewers.map(v => (
                                                <option key={v.id_user} value={v.id_user}>
                                                    {v.username} · {v.email}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            style={s.btnSmall}
                                            onClick={() => addViewer(project.id_project)}
                                            disabled={loadingAdd === project.id_project}
                                        >
                                            {loadingAdd === project.id_project ? '...' : 'Add'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}

const s = {
    title: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
    subtitle: { fontSize: 13, color: '#888', marginBottom: 32 },
    errorBox: { padding: '12px 16px', backgroundColor: '#FFF5F5', border: '1px solid #FFCDD2', borderRadius: 4, color: '#B71C1C', fontSize: 13, marginBottom: 16 },
    empty: { padding: 48, textAlign: 'center', backgroundColor: '#FFF', border: '1px dashed #E0E0DE', borderRadius: 6, color: '#888', fontSize: 13 },
    card: { backgroundColor: '#FFF', border: '1px solid #E8E8E6', borderRadius: 6, marginBottom: 12, overflow: 'hidden' },
    cardHeader: { padding: '14px 20px', borderBottom: '1px solid #F0F0EE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    cardTitle: { fontSize: 14, fontWeight: 600 },
    cardMeta: { fontSize: 12, color: '#888' },
    cardBody: { padding: '16px 20px' },
    sectionLabel: { fontSize: 11, fontWeight: 600, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 },
    viewerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F5F5F4', fontSize: 13 },
    addRow: { display: 'flex', gap: 8, marginTop: 12 },
    select: { flex: 1, height: 32, padding: '0 8px', fontSize: 12, border: '1px solid #E0E0DE', borderRadius: 4, backgroundColor: '#FAFAFA' },
    emptyMsg: { fontSize: 13, color: '#AAA', padding: '8px 0' },
    btnSecondary: { height: 36, padding: '0 16px', backgroundColor: 'transparent', color: '#555', border: '1px solid #D0D0CE', borderRadius: 4, fontSize: 13, cursor: 'pointer' },
    btnDanger: { height: 28, padding: '0 10px', backgroundColor: 'transparent', color: '#CC0000', border: '1px solid #FFCDD2', borderRadius: 3, fontSize: 11, cursor: 'pointer' },
    btnSmall: { height: 32, padding: '0 12px', backgroundColor: '#1A1A1A', color: '#FFF', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' },
};

export default ProjectList;
```

- [ ] **Step 2: Create `src/features/projects/CreateProject.js`**

Copy from `project/my-app/src/dashboard/CreateProject.js`. Replace the 3 fetch calls:

Line 341 (`loadPMs`): change `fetch('http://localhost:8080/projects/managers', { credentials: 'include' })` to:
```javascript
import api from '../../config/api';
// ...
async function loadPMs() {
    try {
        const { res, data } = await api.get('/projects/managers');
        if (res.ok) setPms(data.pms || []);
    } catch (err) {
        console.error('Error cargando PMs:', err);
    }
}
```

Line 352 (`loadViewers`): change similarly to:
```javascript
async function loadViewers() {
    try {
        const { res, data } = await api.get('/projects/viewers');
        if (res.ok) setViewers(data.viewers || []);
    } catch (err) {
        console.error('Error cargando viewers:', err);
    }
}
```

Line 422 (`handleSubmit`): change to:
```javascript
const { res, data } = await api.post('/projects/create', payload);
```

Then update the response check from `res.ok` (it already uses `res.ok`, just the fetch pattern changes).

Add `import api from '../../config/api';` at the top and remove the raw fetch calls.

- [ ] **Step 3: Create `src/features/projects/ProjectViewers.js`** — **FIX: endpoint that doesn't exist**

Copy from `project/my-app/src/projects/ProjectViewers.js`. Fix `fetchAvailableViewers` to use `/projects/viewers` instead of `/projects/${projectId}/available-viewers`:

```javascript
import { useState, useEffect } from 'react';
import api from '../../config/api';

function ProjectViewers({ projectId, projectName, onBack }) {
    const [viewers, setViewers] = useState([]);
    const [availableViewers, setAvailableViewers] = useState([]);
    const [selectedViewer, setSelectedViewer] = useState('');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        fetchViewers();
        fetchAvailableViewers();
    }, [projectId]);

    async function fetchViewers() {
        try {
            const { res, data } = await api.get(`/projects/${projectId}/viewers`);
            if (res.ok) {
                setViewers(data.viewers || []);
            }
        } catch (error) {
            console.error('Error fetching viewers:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchAvailableViewers() {
        try {
            const { res: viewersRes, data: viewersData } = await api.get('/projects/viewers');
            const { res: assignedRes, data: assignedData } = await api.get(`/projects/${projectId}/viewers`);

            if (viewersRes.ok && assignedRes.ok) {
                const allViewers = viewersData.viewers || [];
                const assigned = assignedData.viewers || [];
                const assignedIds = new Set(assigned.map(v => v.id_user));
                setAvailableViewers(allViewers.filter(v => !assignedIds.has(v.id_user)));
            }
        } catch (error) {
            console.error('Error fetching available viewers:', error);
        }
    }

    async function handleAddViewer(e) {
        e.preventDefault();
        if (!selectedViewer) {
            setMessage({ text: 'Please select a viewer', type: 'error' });
            return;
        }

        try {
            const { res, data } = await api.post(`/projects/${projectId}/viewers`, { viewer_id: parseInt(selectedViewer) });

            if (res.ok) {
                setMessage({ text: 'Viewer added successfully', type: 'success' });
                setSelectedViewer('');
                fetchViewers();
                fetchAvailableViewers();
            } else {
                setMessage({ text: data.message || 'Error adding viewer', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Error connecting to server', type: 'error' });
        }
    }

    async function handleRemoveViewer(userId) {
        if (!window.confirm('Are you sure you want to remove this viewer?')) return;

        try {
            const { res, data } = await api.delete(`/projects/${projectId}/viewers/${userId}`);

            if (res.ok) {
                setMessage({ text: 'Viewer removed successfully', type: 'success' });
                fetchViewers();
                fetchAvailableViewers();
            } else {
                setMessage({ text: data.message || 'Error removing viewer', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'Error connecting to server', type: 'error' });
        }
    }

    if (loading) return <div>Loading...</div>;

    return (
        <div className="project-viewers">
            <button onClick={onBack} className="back-btn">← Back to Projects</button>
            <h2>Manage Viewers - {projectName}</h2>

            {message.text && (
                <div className={`message ${message.type}`}>{message.text}</div>
            )}

            <div className="add-viewer-section">
                <h3>Add Viewer</h3>
                <form onSubmit={handleAddViewer}>
                    <select value={selectedViewer} onChange={(e) => setSelectedViewer(e.target.value)}>
                        <option value="">Select a viewer...</option>
                        {availableViewers.map(viewer => (
                            <option key={viewer.id_user} value={viewer.id_user}>
                                {viewer.username} ({viewer.email})
                            </option>
                        ))}
                    </select>
                    <button type="submit" disabled={!selectedViewer}>Add Viewer</button>
                </form>
                {availableViewers.length === 0 && (
                    <p className="no-data">No available viewers to add</p>
                )}
            </div>

            <div className="viewers-list-section">
                <h3>Current Viewers ({viewers.length})</h3>
                {viewers.length === 0 ? (
                    <p className="no-data">No viewers assigned to this project</p>
                ) : (
                    <table className="viewers-table">
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {viewers.map(viewer => (
                                <tr key={viewer.id_user}>
                                    <td>{viewer.username}</td>
                                    <td>{viewer.email}</td>
                                    <td>
                                        <button onClick={() => handleRemoveViewer(viewer.id_user)} className="remove-btn">
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default ProjectViewers;
```

- [ ] **Step 4: Create `src/features/dashboard/Dashboard.js`** — slimmed down orchestrator

```javascript
import { useState } from 'react';
import Sidebar from '../../shared/components/Sidebar';
import ProjectList from '../projects/ProjectList';
import CreateProject from '../projects/CreateProject';
import UserManagement from '../users/UserManagement';
import api from '../../config/api';

function Dashboard({ user, onLogout }) {
    const [view, setView] = useState('projects');

    const isPM = user?.role === 'pm' || user?.role === 'admin';

    async function log_out() {
        await api.post('/auth/logout');
        if (onLogout) onLogout();
    }

    if (view === 'create') {
        return (
            <div style={wrap}>
                <Sidebar active="projects" onNavigate={setView} />
                <main style={mainStyle}>
                    <CreateProject onCancel={() => setView('projects')} />
                </main>
            </div>
        );
    }

    if (view === 'users') {
        return (
            <div style={wrap}>
                <Sidebar active="users" onNavigate={setView} />
                <main style={mainStyle}>
                    <UserManagement onBack={() => setView('projects')} />
                </main>
            </div>
        );
    }

    if (view === 'projects') {
        return (
            <div style={wrap}>
                <Sidebar active="projects" onNavigate={setView} />
                <main style={mainStyle}>
                    <div style={s.page}>
                        <div style={s.topBar}>
                            <div style={s.breadcrumb}>
                                <span>Dashboard</span>
                                <span style={{ color: '#CCC' }}>/</span>
                                <span style={{ color: '#1A1A1A', fontWeight: 500 }}>Projects</span>
                            </div>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <button style={s.btnSecondary} onClick={log_out}>Log out</button>
                                {isPM && (
                                    <>
                                        <button style={s.btnPrimary} onClick={() => setView('create')}>
                                            + New Project
                                        </button>
                                        <button style={s.btnSecondary} onClick={() => setView('users')}>
                                            User Management
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div style={s.body}>
                            <ProjectList user={user} />
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div style={wrap}>
            <Sidebar active={view} onNavigate={setView} />
            <main style={mainStyle}>
                <div style={s.page}>
                    <div style={s.topBar}>
                        <div style={s.breadcrumb}>
                            <span style={{ color: '#1A1A1A', fontWeight: 500, textTransform: 'capitalize' }}>{view}</span>
                        </div>
                        <button style={s.btnSecondary} onClick={log_out}>Log out</button>
                    </div>
                    <div style={s.body}>
                        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{view.charAt(0).toUpperCase() + view.slice(1)}</h1>
                        <p style={{ fontSize: 13, color: '#888' }}>Esta vista todavia no esta implementada.</p>
                    </div>
                </div>
            </main>
        </div>
    );
}

const wrap = { display: 'flex', minHeight: '100vh', width: '100%', backgroundColor: '#F5F5F4' };
const mainStyle = { flex: 1, minWidth: 0, overflowX: 'hidden' };

const s = {
    page: { minHeight: '100vh', backgroundColor: '#F5F5F4', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", color: '#1A1A1A' },
    topBar: { backgroundColor: '#FFF', borderBottom: '1px solid #E5E5E3', padding: '0 32px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    breadcrumb: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#888' },
    body: { padding: 32, maxWidth: 1200 },
    btnPrimary: { height: 36, padding: '0 16px', backgroundColor: '#CC0000', color: '#FFF', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    btnSecondary: { height: 36, padding: '0 16px', backgroundColor: 'transparent', color: '#555', border: '1px solid #D0D0CE', borderRadius: 4, fontSize: 13, cursor: 'pointer' },
};

export default Dashboard;
```

- [ ] **Step 5: Commit**

```bash
git add project/my-app/src/features/dashboard/ project/my-app/src/features/projects/
git commit -m "refactor: decompose Dashboard, move projects to features/ with api client"
```

---

## Task 11: Rewire App.js and delete old frontend structure

**Files:**
- Modify: `project/my-app/src/App.js`
- Delete: old directories

- [ ] **Step 1: Update `src/App.js`** to use useAuth hook and new import paths

```javascript
import { useAuth } from './shared/hooks/useAuth';
import Login from './features/auth/Login';
import Dashboard from './features/dashboard/Dashboard';
import './App.css';

function App() {
    const { user, loading, login, logout } = useAuth();

    if (loading) return null;

    if (user) {
        return (
            <div className="app-layout-app">
                <Dashboard user={user} onLogout={logout} />
            </div>
        );
    }

    return (
        <div className="app-layout-auth">
            <aside className='app-aside'>
                <div className='app-brand'>
                    <div className='app-box'></div>
                    <div className='app-businessname'>
                        <h6 style={{color: 'white'}}>Tech</h6>
                        <h5 style={{color: '#E31837'}}>mahindra</h5>
                    </div>
                </div>
                <div className='app-middle'>
                    <div className='app-title'>
                        <h1 style={{color: 'white'}}>Project</h1>
                        <h1 style={{color: '#E31837'}}>Management</h1>
                        <h1 style={{color: 'white'}}>System</h1>
                    </div>
                    <div className='app-description'>
                        <p style={{color: '#F6F2EA99'}}>Real-time Scrum tracking with automated risk scoring, progress monitoring, and team gamification.</p>
                    </div>
                    <div className='app-decorativelineal app-decorative-position1'></div>
                    <div className='app-decorativelineal app-decorative-position2'></div>
                    <div className='app-decorativelineal app-decorative-position3'></div>
                    <div className='app-decorativelineal app-decorative-position4'></div>
                    <div className='app-decorativelineal app-decorative-position5'></div>
                    <div className='app-decorativelineal app-decorative-position6'></div>
                </div>
                <ul className='app-list'>
                    <li>Real-time risk score & semaphore</li>
                    <li>Planned vs Actual progress charts</li>
                    <li>Sprint & backlog management</li>
                    <li>Team gamification & leaderboard</li>
                    <li>Automated alerts & audit log</li>
                </ul>
            </aside>
            <main className='app-content'>
                <Login onLogin={login} />
            </main>
        </div>
    );
}

export default App;
```

- [ ] **Step 2: Delete old frontend directories**

```bash
rm -rf project/my-app/src/auth
rm -rf project/my-app/src/components
rm -rf project/my-app/src/dashboard
rm -rf project/my-app/src/projects
```

- [ ] **Step 3: Test frontend compiles**

```bash
cd project/my-app && npm start
```

Expected: App loads at `http://localhost:3000` with no console errors. Login page renders. Stop after confirming.

- [ ] **Step 4: Commit**

```bash
git add -A project/my-app/
git commit -m "refactor: rewire App.js with useAuth hook, delete old frontend structure"
```

---

## Task 12: Update schema.sql and final verification

**Files:**
- Modify: `project/node_runtime/db/schema.sql`

- [ ] **Step 1: Update `db/schema.sql`** to match real DB tables

```sql
-- =============================================
-- TechMahindra PMS — Schema Reference
-- Matches Supabase production tables
-- =============================================

-- Users and authentication
CREATE TABLE IF NOT EXISTS users (
    id_user SERIAL PRIMARY KEY,
    email VARCHAR(255),
    username VARCHAR(255),
    password_hash VARCHAR(255),
    full_name TEXT,
    status VARCHAR(50),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role (
    id_role SERIAL PRIMARY KEY,
    id_user INT REFERENCES users(id_user) ON DELETE CASCADE,
    status VARCHAR(50) -- 'admin', 'pm', 'viewer'
);

-- Projects
CREATE TABLE IF NOT EXISTS project (
    id_project SERIAL PRIMARY KEY,
    id_pm INT REFERENCES users(id_user),
    project_name VARCHAR(255),
    description VARCHAR(500),
    deadline TIMESTAMP,
    start_date TIMESTAMP,
    client_name VARCHAR(255),
    estimated_sp INT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Project members (viewers linked to projects)
CREATE TABLE IF NOT EXISTS project_member (
    id_member SERIAL PRIMARY KEY,
    id_project INT REFERENCES project(id_project) ON DELETE CASCADE,
    id_user INT REFERENCES users(id_user) ON DELETE CASCADE
);

-- Audit log
CREATE TABLE IF NOT EXISTS audit_log (
    id_audit SERIAL PRIMARY KEY,
    id_user INT REFERENCES users(id_user),
    action VARCHAR(100) NOT NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100),
    payload JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_project_member_user ON project_member(id_user);
CREATE INDEX IF NOT EXISTS idx_project_member_project ON project_member(id_project);
CREATE INDEX IF NOT EXISTS idx_role_user ON role(id_user);
```

- [ ] **Step 2: Full verification — start both servers**

Terminal 1:
```bash
cd project/node_runtime && npm run dev
```
Expected: `App listening on port 8080`

Terminal 2:
```bash
cd project/my-app && npm start
```
Expected: App opens at localhost:3000

- [ ] **Step 3: Manual test checklist**

1. Login page loads → enter credentials → dashboard loads
2. Projects list shows filtered by role
3. Create project form loads PMs and viewers
4. User management page loads (admin only — verify non-admin gets 403)
5. Logout works
6. Refresh page → auto-login via JWT cookie works

- [ ] **Step 4: Commit**

```bash
git add project/node_runtime/db/schema.sql
git commit -m "fix: update schema.sql to match production DB tables"
```

- [ ] **Step 5: Final commit — verify clean structure**

```bash
find project/node_runtime/src -type f | sort
find project/my-app/src -type f | sort
```

Expected backend:
```
project/node_runtime/src/app.js
project/node_runtime/src/config/constants.js
project/node_runtime/src/config/env.js
project/node_runtime/src/config/supabase.js
project/node_runtime/src/modules/auth/auth.controller.js
project/node_runtime/src/modules/auth/auth.routes.js
project/node_runtime/src/modules/auth/auth.validation.js
project/node_runtime/src/modules/projects/projects.controller.js
project/node_runtime/src/modules/projects/projects.routes.js
project/node_runtime/src/modules/projects/projects.validation.js
project/node_runtime/src/modules/users/users.controller.js
project/node_runtime/src/modules/users/users.routes.js
project/node_runtime/src/modules/users/users.validation.js
project/node_runtime/src/shared/errors/errorHandler.js
project/node_runtime/src/shared/middleware/auth.js
project/node_runtime/src/shared/validators/validate.js
```

Expected frontend (inside src/):
```
src/App.css
src/App.js
src/config/api.js
src/config/constants.js
src/features/auth/Login.css
src/features/auth/Login.js
src/features/dashboard/Dashboard.js
src/features/projects/CreateProject.js
src/features/projects/ProjectList.js
src/features/projects/ProjectViewers.js
src/features/users/UserManagement.css
src/features/users/UserManagement.js
src/index.css
src/index.js
src/shared/components/Sidebar.css
src/shared/components/Sidebar.js
src/shared/hooks/useAuth.js
```
