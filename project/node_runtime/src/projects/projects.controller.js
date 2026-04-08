const supabase = require('../../supabase');

// =====================================================
// GET /projects
// =====================================================
async function getProjects(req, res) {
    try {
        const { data, error } = await supabase
            .from('project')
            .select('*');

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// =====================================================
// GET /projects/managers
// Devuelve usuarios con rol 'pm' que NO tengan ya un
// proyecto asignado (CA: un solo PM por proyecto).
//
// NOTA: tu tabla `project` no tiene columna `status`,
// así que la regla "ocupado" = el PM ya existe en
// algún registro de project como id_pm.
// =====================================================
async function getManagers(req, res) {
    try {
        // 1. Usuarios con rol 'pm'
        const { data: roles, error: roleErr } = await supabase
            .from('role')
            .select('id_user')
            .eq('status', 'pm');

        if (roleErr) return res.status(500).json({ error: roleErr.message });

        const pmIds = roles.map(r => r.id_user);
        if (pmIds.length === 0) return res.status(200).json({ pms: [] });

        // 2. Datos de esos usuarios
        const { data: users, error: usersErr } = await supabase
            .from('users')
            .select('id_user, username, email')
            .in('id_user', pmIds);

        if (usersErr) return res.status(500).json({ error: usersErr.message });

        // 3. PMs ya ocupados (que aparecen como id_pm en project)
        const { data: busyProjects, error: busyErr } = await supabase
            .from('project')
            .select('id_pm');

        if (busyErr) return res.status(500).json({ error: busyErr.message });

        const busyPmSet = new Set(busyProjects.map(p => p.id_pm));
        const availablePms = users.filter(u => !busyPmSet.has(u.id_user));

        return res.status(200).json({ pms: availablePms });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// =====================================================
// GET /projects/viewers
// Usuarios con rol 'viewer'
// =====================================================
async function getViewers(req, res) {
    try {
        const { data: roles, error: roleErr } = await supabase
            .from('role')
            .select('id_user')
            .eq('status', 'viewer');

        if (roleErr) return res.status(500).json({ error: roleErr.message });

        const viewerIds = roles.map(r => r.id_user);
        if (viewerIds.length === 0) return res.status(200).json({ viewers: [] });

        const { data: users, error: usersErr } = await supabase
            .from('users')
            .select('id_user, username, email')
            .in('id_user', viewerIds);

        if (usersErr) return res.status(500).json({ error: usersErr.message });

        return res.status(200).json({ viewers: users });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// =====================================================
// POST /projects/create
//   CA-01: PM asignado obligatorio
//   CA-02: el PM debe tener rol 'pm'
//   CA-03: no guardable sin PM
//   Extra: el PM no debe estar ya en otro proyecto
//   CA-04: auditoría al guardar (audit_log)
// Solo admin y pm pueden crear proyectos.
// =====================================================
async function createProject(req, res) {
    try {
        const {
            id_pm,
            project_name,
            description,
            start_date,
            deadline,
            client_name,
            estimated_sp,
            viewer_ids = [],
        } = req.body;

        // ---------- Validaciones básicas ----------
        if (!project_name || !client_name) {
            return res.status(400).json({ message: 'project_name y client_name son obligatorios' });
        }
        if (!id_pm) {
            return res.status(400).json({ message: 'CA-03: se requiere asignar un PM' });
        }
        if (start_date && deadline && new Date(deadline) <= new Date(start_date)) {
            return res.status(400).json({ message: 'El deadline debe ser posterior a la fecha de inicio' });
        }

        // ---------- CA-02: el PM debe tener rol 'pm' ----------
        const { data: pmRole, error: pmRoleErr } = await supabase
            .from('role')
            .select('status')
            .eq('id_user', id_pm)
            .single();

        if (pmRoleErr || !pmRole) {
            return res.status(400).json({ message: 'CA-02: el usuario asignado no tiene rol registrado' });
        }
        if (pmRole.status !== 'pm') {
            return res.status(400).json({
                message: `CA-02: el usuario asignado tiene rol '${pmRole.status}', se requiere 'pm'`
            });
        }

        // ---------- Restricción: un solo proyecto por PM ----------
        const { data: existingPmProject, error: existingErr } = await supabase
            .from('project')
            .select('id_project, project_name')
            .eq('id_pm', id_pm);

        if (existingErr) {
            return res.status(500).json({ message: 'Error verificando PM', error: existingErr.message });
        }
        if (existingPmProject && existingPmProject.length > 0) {
            return res.status(400).json({
                message: `El PM ya está asignado al proyecto "${existingPmProject[0].project_name}". Un PM solo puede gestionar un proyecto a la vez.`
            });
        }

        // ---------- Unique project name ----------
        const { data: nameDup } = await supabase
            .from('project')
            .select('id_project')
            .eq('project_name', project_name)
            .limit(1);

        if (nameDup && nameDup.length > 0) {
            return res.status(400).json({ message: 'Ya existe un proyecto con ese nombre' });
        }

        // ---------- Insertar proyecto ----------
        // Solo columnas que existen en tu tabla project actual:
        // id_pm, project_name, description, deadline, start_date, client_name, estimated_sp
        const insertPayload = {
            id_pm,
            project_name,
            description: description || null,
            start_date: start_date || null,
            deadline: deadline || null,
            client_name,
            estimated_sp: estimated_sp || null,
        };

        const { data: created, error: insertErr } = await supabase
            .from('project')
            .insert([insertPayload])
            .select()
            .single();

        if (insertErr) {
            return res.status(500).json({ message: 'Error creando proyecto', error: insertErr.message });
        }

        // ---------- Asignar viewers en project_member ----------
        if (Array.isArray(viewer_ids) && viewer_ids.length > 0) {
            const memberRows = viewer_ids.map(id_user => ({
                id_project: created.id_project,
                id_user,
            }));
            const { error: memberErr } = await supabase
                .from('project_member')
                .insert(memberRows);
            if (memberErr) {
                console.warn('Warning asignando viewers:', memberErr.message);
            }
        }

        // ---------- CA-04: Auditoría ----------
        const auditEntry = {
            id_user: req.user.id_user,
            action: 'CREATE_PROJECT',
            entity: 'project',
            entity_id: String(created.id_project),
            payload: {
                project_name: created.project_name,
                client_name: created.client_name,
                id_pm: created.id_pm,
                viewer_ids,
            },
        };

        const { error: auditErr } = await supabase
            .from('audit_log')
            .insert([auditEntry]);

        if (auditErr) {
            console.warn('Warning: audit log falló:', auditErr.message);
        }

        return res.status(201).json({
            message: 'Proyecto creado exitosamente',
            project: created
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getProjects,
    getManagers,
    getViewers,
    createProject,
};