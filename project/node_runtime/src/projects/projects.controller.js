const supabase = require('../../supabase');

function normalizeRole(value) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

// =====================================================
// GET /projects
// CA-04 (HU-08): filtra proyectos según rol
//   admin  → todos
//   pm     → solo los que tiene asignados (id_pm)
//   viewer → solo los que está vinculado (project_member)
// =====================================================
async function getProjects(req, res) {
    try {
        const { id_user, role } = req.user;
        let query = supabase.from('project').select('*');

        if (role === 'pm') {
            query = query.eq('id_pm', id_user);
        } else if (role === 'viewer') {
            const { data: memberships, error: memErr } = await supabase
                .from('project_member')
                .select('id_project')
                .eq('id_user', id_user);

            if (memErr) return res.status(500).json({ error: memErr.message });

            const projectIds = memberships.map(m => m.id_project);
            if (projectIds.length === 0) return res.status(200).json([]);

            query = query.in('id_project', projectIds);
        }
        // admin: sin filtro adicional

        const { data, error } = await query;
        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// =====================================================
// GET /projects/managers
// Devuelve todos los usuarios con rol 'pm'
// =====================================================
async function getManagers(req, res) {
    try {
        const { data: roles, error: roleErr } = await supabase
            .from('role')
            .select('id_user, status');

        if (roleErr) return res.status(500).json({ error: roleErr.message });

        const pmIds = roles
            .filter(r => normalizeRole(r.status) === 'pm')
            .map(r => r.id_user);
        if (pmIds.length === 0) return res.status(200).json({ pms: [] });

        const { data: users, error: usersErr } = await supabase
            .from('users')
            .select('id_user, username, email')
            .in('id_user', pmIds);

        if (usersErr) return res.status(500).json({ error: usersErr.message });
        return res.status(200).json({ pms: users });
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
            .select('id_user, status');

        if (roleErr) return res.status(500).json({ error: roleErr.message });

        const viewerIds = roles
            .filter(r => normalizeRole(r.status) === 'viewer')
            .map(r => r.id_user);
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
//   CA-01 (HU-08): viewer_ids deben tener rol 'viewer'
//   CA-04: auditoría al guardar
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
            estimated_budget,
            estimated_sp,
            viewer_ids = [],
        } = req.body;

        const normalizedProjectName = typeof project_name === 'string' ? project_name.trim() : '';
        const normalizedClientName = typeof client_name === 'string' ? client_name.trim() : '';
        const parsedEstimatedSp = Number.parseInt(estimated_sp, 10);
        const parsedEstimatedBudget = Number.parseFloat(estimated_budget);

        const missingRequired = [];
        if (!normalizedProjectName) missingRequired.push('project_name');
        if (!normalizedClientName) missingRequired.push('client_name');
        if (!start_date) missingRequired.push('start_date');
        if (!deadline) missingRequired.push('deadline');
        if (estimated_budget === undefined || estimated_budget === null || estimated_budget === '') {
            missingRequired.push('estimated_budget');
        }
        if (estimated_sp === undefined || estimated_sp === null || estimated_sp === '') {
            missingRequired.push('estimated_sp');
        }

        if (missingRequired.length > 0) {
            return res.status(400).json({
                message: `CA-05: faltan campos obligatorios: ${missingRequired.join(', ')}`
            });
        }
        if (!id_pm) {
            return res.status(400).json({ message: 'CA-03: se requiere asignar un PM' });
        }

        const startDateObj = new Date(start_date);
        const deadlineObj = new Date(deadline);

        if (Number.isNaN(startDateObj.getTime()) || Number.isNaN(deadlineObj.getTime())) {
            return res.status(400).json({ message: 'CA-02: start_date y deadline deben ser fechas validas' });
        }
        if (deadlineObj <= startDateObj) {
            return res.status(400).json({ message: 'El deadline debe ser posterior a la fecha de inicio' });
        }
        if (Number.isNaN(parsedEstimatedBudget) || parsedEstimatedBudget <= 0) {
            return res.status(400).json({ message: 'CA-02: estimated_budget es obligatorio y debe ser mayor a 0' });
        }
        if (Number.isNaN(parsedEstimatedSp) || parsedEstimatedSp <= 0) {
            return res.status(400).json({ message: 'CA-04: estimated_sp debe ser mayor a 0' });
        }

        // CA-02: el PM debe tener rol 'pm'
        const { data: pmRole, error: pmRoleErr } = await supabase
            .from('role')
            .select('status')
            .eq('id_user', id_pm)
            .single();

        if (pmRoleErr || !pmRole) {
            return res.status(400).json({ message: 'CA-02: el usuario asignado no tiene rol registrado' });
        }
        if (normalizeRole(pmRole.status) !== 'pm') {
            return res.status(400).json({
                message: `CA-02: el usuario asignado tiene rol '${pmRole.status}', se requiere 'pm'`
            });
        }

        // Nombre único
        const { data: nameDup } = await supabase
            .from('project')
            .select('id_project')
            .ilike('project_name', normalizedProjectName)
            .limit(1);

        if (nameDup && nameDup.length > 0) {
            return res.status(400).json({ message: 'Ya existe un proyecto con ese nombre' });
        }

        // CA-01 (HU-08): validar que viewer_ids tengan rol 'viewer'
        const normalizedViewerIds = Array.isArray(viewer_ids)
            ? [...new Set(viewer_ids.map(v => Number.parseInt(v, 10)).filter(v => Number.isInteger(v) && v > 0))]
            : [];

        if (Array.isArray(viewer_ids) && viewer_ids.length > 0 && normalizedViewerIds.length !== viewer_ids.length) {
            return res.status(400).json({ message: 'viewer_ids contiene valores invalidos' });
        }

        if (normalizedViewerIds.length > 0) {
            const { data: viewerRoles, error: vrErr } = await supabase
                .from('role')
                .select('id_user, status')
                .in('id_user', normalizedViewerIds);

            if (vrErr) return res.status(500).json({ message: 'Error verificando roles de viewers' });

            const invalidViewers = normalizedViewerIds.filter(vid => {
                const r = viewerRoles.find(vr => vr.id_user === vid);
                return !r || normalizeRole(r.status) !== 'viewer';
            });

            if (invalidViewers.length > 0) {
                return res.status(400).json({
                    message: `CA-01: los siguientes usuarios no tienen rol viewer: ${invalidViewers.join(', ')}`
                });
            }
        }

        // Insertar proyecto
        const { data: created, error: insertErr } = await supabase
            .from('project')
            .insert([{
                id_pm,
                project_name: normalizedProjectName,
                description: description || null,
                start_date,
                deadline,
                client_name: normalizedClientName,
                estimated_sp: parsedEstimatedSp,
            }])
            .select()
            .single();

        if (insertErr) {
            if (insertErr.code === '23505') {
                return res.status(400).json({ message: 'Ya existe un proyecto con ese nombre' });
            }
            return res.status(500).json({ message: 'Error creando proyecto', error: insertErr.message });
        }

        // Persistir presupuesto estimado en tabla budget (segun esquema actual)
        const { error: budgetErr } = await supabase
            .from('budget')
            .insert([{
                id_project: created.id_project,
                can_view_budget: true,
                total_cost: parsedEstimatedBudget,
                description: 'Estimated budget defined at project creation',
            }]);

        if (budgetErr) {
            return res.status(500).json({
                message: 'Proyecto creado, pero no se pudo guardar el presupuesto estimado',
                error: budgetErr.message,
            });
        }

        // Asignar viewers en project_member
        if (normalizedViewerIds.length > 0) {
            const { error: memberErr } = await supabase
                .from('project_member')
                .insert(normalizedViewerIds.map(id_user => ({ id_project: created.id_project, id_user })));
            if (memberErr) console.warn('Warning asignando viewers:', memberErr.message);
        }

        // Auditoría
        const { error: auditErr } = await supabase
            .from('audit_log')
            .insert([{
                id_user: req.user.id_user,
                action: 'CREATE_PROJECT',
                entity: 'project',
                entity_id: String(created.id_project),
                payload: {
                    project_name: created.project_name,
                    client_name: created.client_name,
                    id_pm: created.id_pm,
                    estimated_budget: parsedEstimatedBudget,
                    estimated_sp: parsedEstimatedSp,
                    viewer_ids: normalizedViewerIds,
                },
            }]);

        if (auditErr) console.warn('Warning: audit log falló:', auditErr.message);

        return res.status(201).json({ message: 'Proyecto creado exitosamente', project: created });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}

// =====================================================
// GET /projects/:id/viewers
// Lista los viewers vinculados a un proyecto.
// CA-02: solo el PM del proyecto o admin puede consultar.
// =====================================================
async function getProjectViewers(req, res) {
    try {
        const projectId = parseInt(req.params.id);
        const { id_user, role } = req.user;

        const { data: project, error: projErr } = await supabase
            .from('project')
            .select('id_project, id_pm, project_name')
            .eq('id_project', projectId)
            .single();

        if (projErr || !project) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }

        // CA-02
        if (role === 'pm' && project.id_pm !== id_user) {
            return res.status(403).json({ message: 'CA-02: solo el PM asignado puede gestionar viewers de este proyecto' });
        }

        const { data: members, error: memErr } = await supabase
            .from('project_member')
            .select('id_user')
            .eq('id_project', projectId);

        if (memErr) return res.status(500).json({ error: memErr.message });
        if (members.length === 0) return res.status(200).json({ viewers: [] });

        const { data: users, error: usersErr } = await supabase
            .from('users')
            .select('id_user, username, email')
            .in('id_user', members.map(m => m.id_user));

        if (usersErr) return res.status(500).json({ error: usersErr.message });

        return res.status(200).json({ viewers: users });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// =====================================================
// POST /projects/:id/viewers
// Agrega un viewer a un proyecto existente.
//   CA-01: el usuario debe tener rol 'viewer'
//   CA-02: solo el PM asignado o admin puede agregar
//   CA-03: permite mismo viewer en múltiples proyectos
// =====================================================
async function addViewerToProject(req, res) {
    try {
        const projectId = parseInt(req.params.id);
        const { viewer_id } = req.body;
        const { id_user, role } = req.user;

        if (!viewer_id) {
            return res.status(400).json({ message: 'viewer_id es requerido' });
        }

        const { data: project, error: projErr } = await supabase
            .from('project')
            .select('id_project, id_pm, project_name')
            .eq('id_project', projectId)
            .single();

        if (projErr || !project) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }

        // CA-02
        if (role === 'pm' && project.id_pm !== id_user) {
            return res.status(403).json({ message: 'CA-02: solo el PM asignado puede agregar viewers a este proyecto' });
        }

        // CA-01
        const { data: viewerRole, error: vrErr } = await supabase
            .from('role')
            .select('status')
            .eq('id_user', viewer_id)
            .single();

        if (vrErr || !viewerRole) {
            return res.status(400).json({ message: 'CA-01: el usuario no tiene rol registrado' });
        }
        if (normalizeRole(viewerRole.status) !== 'viewer') {
            return res.status(400).json({
                message: `CA-01: el usuario tiene rol '${viewerRole.status}', se requiere 'viewer'`
            });
        }

        // CA-03: evitar duplicados
        const { data: existing } = await supabase
            .from('project_member')
            .select('id_member')
            .eq('id_project', projectId)
            .eq('id_user', viewer_id)
            .limit(1);

        if (existing && existing.length > 0) {
            return res.status(409).json({ message: 'El viewer ya está vinculado a este proyecto' });
        }

        const { error: insertErr } = await supabase
            .from('project_member')
            .insert([{ id_project: projectId, id_user: viewer_id }]);

        if (insertErr) return res.status(500).json({ message: 'Error vinculando viewer', error: insertErr.message });

        await supabase
            .from('audit_log')
            .insert([{
                id_user,
                action: 'ADD_VIEWER',
                entity: 'project_member',
                entity_id: String(projectId),
                payload: { project_name: project.project_name, viewer_id },
            }]);

        return res.status(201).json({ message: 'Viewer vinculado exitosamente' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// =====================================================
// DELETE /projects/:id/viewers/:viewer_id
// Desvincula un viewer de un proyecto.
// CA-02: solo el PM del proyecto o admin puede hacerlo.
// =====================================================
async function removeViewerFromProject(req, res) {
    try {
        const projectId = parseInt(req.params.id);
        const viewerId = parseInt(req.params.viewer_id);
        const { id_user, role } = req.user;

        const { data: project, error: projErr } = await supabase
            .from('project')
            .select('id_project, id_pm, project_name')
            .eq('id_project', projectId)
            .single();

        if (projErr || !project) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }

        // CA-02
        if (role === 'pm' && project.id_pm !== id_user) {
            return res.status(403).json({ message: 'CA-02: solo el PM asignado puede gestionar viewers de este proyecto' });
        }

        const { error: deleteErr } = await supabase
            .from('project_member')
            .delete()
            .eq('id_project', projectId)
            .eq('id_user', viewerId);

        if (deleteErr) return res.status(500).json({ message: 'Error desvinculando viewer', error: deleteErr.message });

        await supabase
            .from('audit_log')
            .insert([{
                id_user,
                action: 'REMOVE_VIEWER',
                entity: 'project_member',
                entity_id: String(projectId),
                payload: { project_name: project.project_name, viewer_id: viewerId },
            }]);

        return res.status(200).json({ message: 'Viewer desvinculado exitosamente' });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

module.exports = {
    getProjects,
    getManagers,
    getViewers,
    createProject,
    getProjectViewers,
    addViewerToProject,
    removeViewerFromProject,
};
