const supabase = require('../../supabase');

const PM_ROLE_VALUES = ['pm', 'project_manager', 'project manager'];
const VIEWER_ROLE_VALUES = ['viewer'];

function normalizeRole(value) {
    return String(value || '').trim().toLowerCase().replace(/\s+/g, '_');
}

function isPmRole(value) {
    return PM_ROLE_VALUES.map(normalizeRole).includes(normalizeRole(value));
}

function isViewerRole(value) {
    return VIEWER_ROLE_VALUES.map(normalizeRole).includes(normalizeRole(value));
}

// =====================================================
// GET /projects
// =====================================================
async function getProjects(req, res) {
    try {
        const { data, error } = await supabase
            .from('project')
            .select('*, budget(id_budget, total_cost)');

        if (error) return res.status(500).json({ error: error.message });

        const normalized = (data || []).map((p) => {
            const budgetRows = Array.isArray(p.budget) ? p.budget : [];
            const latestBudget = budgetRows.sort((a, b) => (b.id_budget || 0) - (a.id_budget || 0))[0];
            return {
                ...p,
                estimated_budget: latestBudget?.total_cost ?? null,
            };
        });

        return res.status(200).json(normalized);
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
        // 1. Usuarios con rol PM (soporta aliases de status)
        const { data: roles, error: roleErr } = await supabase
            .from('role')
            .select('id_user, status');

        if (roleErr) return res.status(500).json({ error: roleErr.message });

        const pmIds = roles.filter((r) => isPmRole(r.status)).map(r => r.id_user);
        if (pmIds.length === 0) return res.status(200).json({ pms: [] });

        // 2. Datos de esos usuarios
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

        const viewerIds = roles.filter((r) => isViewerRole(r.status)).map(r => r.id_user);
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
            estimated_budget,
            estimated_sp,
            viewer_ids = [],
        } = req.body;

        // ---------- Validaciones básicas ----------
        if (!project_name || !client_name || !start_date || !deadline || estimated_budget === undefined || estimated_budget === null || estimated_budget === '' || estimated_sp === undefined || estimated_sp === null || estimated_sp === '') {
            return res.status(400).json({
                message: 'project_name, client_name, start_date, deadline, estimated_budget y estimated_sp son obligatorios'
            });
        }
        if (!id_pm) {
            return res.status(400).json({ message: 'CA-03: se requiere asignar un PM' });
        }
        if (start_date && deadline && new Date(deadline) <= new Date(start_date)) {
            return res.status(400).json({ message: 'El deadline debe ser posterior a la fecha de inicio' });
        }
        if (isNaN(Number(estimated_budget))) {
            return res.status(400).json({ message: 'estimated_budget debe ser numérico' });
        }
        if (isNaN(Number(estimated_sp))) {
            return res.status(400).json({ message: 'estimated_sp debe ser numérico' });
        }
        if (Number(estimated_sp) <= 0) {
            return res.status(400).json({ message: 'Los story points planeados deben ser mayores a 0' });
        }

        // ---------- CA-02: el PM debe tener rol válido de PM ----------
        const { data: pmRole, error: pmRoleErr } = await supabase
            .from('role')
            .select('status')
            .eq('id_user', id_pm)
            .single();

        if (pmRoleErr || !pmRole) {
            return res.status(400).json({ message: 'CA-02: el usuario asignado no tiene rol registrado' });
        }
        if (!isPmRole(pmRole.status)) {
            return res.status(400).json({
                message: `CA-02: el usuario asignado tiene rol '${pmRole.status}', se requiere rol PM`
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
        const insertPayload = {
            id_pm,
            project_name,
            description: description || null,
            start_date: start_date || null,
            deadline: deadline || null,
            client_name,
            estimated_sp: Number(estimated_sp),
        };

        const { data: created, error: insertErr } = await supabase
            .from('project')
            .insert([insertPayload])
            .select()
            .single();

        if (insertErr) {
            return res.status(500).json({ message: 'Error creando proyecto', error: insertErr.message });
        }

        // Presupuesto estimado se guarda en tabla budget
        const { error: budgetErr } = await supabase
            .from('budget')
            .insert([{
                id_project: created.id_project,
                total_cost: Number(estimated_budget),
                can_view_budget: true,
                description: 'Estimated budget at project creation',
            }]);

        if (budgetErr) {
            await supabase
                .from('project')
                .delete()
                .eq('id_project', created.id_project);

            return res.status(500).json({
                message: 'Error guardando presupuesto inicial del proyecto',
                error: budgetErr.message,
            });
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
            project: {
                ...created,
                estimated_budget: Number(estimated_budget),
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: error.message });
    }
}

// =====================================================
// DELETE /projects/:id
// Admin puede borrar cualquier proyecto.
// PM solo puede borrar proyectos donde sea id_pm.
// =====================================================
async function deleteProject(req, res) {
    try {
        const projectId = Number(req.params.id);
        if (!projectId || Number.isNaN(projectId)) {
            return res.status(400).json({ message: 'ID de proyecto inválido' });
        }

        const { data: project, error: projectErr } = await supabase
            .from('project')
            .select('id_project, id_pm, project_name')
            .eq('id_project', projectId)
            .single();

        if (projectErr || !project) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }

        const userRole = normalizeRole(req.user?.role);
        const isAdmin = userRole === 'admin';
        const isOwnerPm = Number(req.user?.id_user) === Number(project.id_pm);
        if (!isAdmin && !isOwnerPm) {
            return res.status(403).json({ message: 'No tienes permisos para borrar este proyecto' });
        }

        // Borrado manual por dependencias FK (sin cascada en schema actual)
        const { data: budgetRows, error: budgetRowsErr } = await supabase
            .from('budget')
            .select('id_budget')
            .eq('id_project', projectId);

        if (budgetRowsErr) {
            return res.status(500).json({ message: 'Error leyendo presupuestos del proyecto', error: budgetRowsErr.message });
        }

        const budgetIds = (budgetRows || []).map((b) => b.id_budget);

        const { data: sprintRows, error: sprintRowsErr } = await supabase
            .from('sprint')
            .select('id_sprint')
            .eq('id_project', projectId);

        if (sprintRowsErr) {
            return res.status(500).json({ message: 'Error leyendo sprints del proyecto', error: sprintRowsErr.message });
        }

        const sprintIds = (sprintRows || []).map((s) => s.id_sprint);

        await supabase.from('auditory').delete().eq('id_project', projectId);
        await supabase.from('story_points').delete().eq('id_project', projectId);
        await supabase.from('risk').delete().eq('id_project', projectId);
        await supabase.from('milestones').delete().eq('id_project', projectId);
        await supabase.from('semaphore').delete().eq('id_project', projectId);
        await supabase.from('project_update').delete().eq('id_project', projectId);
        await supabase.from('project_member').delete().eq('id_project', projectId);

        if (sprintIds.length > 0) {
            await supabase.from('sprint_plan').delete().in('id_sprint', sprintIds);
            await supabase.from('sprint_progress').delete().in('id_sprint', sprintIds);
        }
        await supabase.from('sprint').delete().eq('id_project', projectId);

        if (budgetIds.length > 0) {
            await supabase.from('spend').delete().in('id_budget', budgetIds);
        }
        await supabase.from('budget').delete().eq('id_project', projectId);

        const { error: deleteProjectErr } = await supabase
            .from('project')
            .delete()
            .eq('id_project', projectId);

        if (deleteProjectErr) {
            return res.status(500).json({ message: 'Error borrando proyecto', error: deleteProjectErr.message });
        }

        return res.status(200).json({
            message: `Proyecto "${project.project_name}" eliminado exitosamente`,
            id_project: projectId,
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
    deleteProject,
};