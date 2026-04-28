const supabase = require('../../config/supabase');

// ─── Helpers ──────────────────────────────────────────────────────────────────

// CA-01/CA-02: valida que un usuario esté vinculado al proyecto.
async function isUserLinkedToProject(userId, project) {
    if (userId == null) return { ok: true }; // null = desasignar

    if (userId === project.id_pm) return { ok: true }; // CA-02: PM siempre vinculado

    const { data: membership, error } = await supabase
        .from('project_member')
        .select('id_member')
        .eq('id_project', project.id_project)
        .eq('id_user', userId)
        .limit(1);

    if (error) return { ok: false, reason: `Error verificando membresía: ${error.message}` };
    if (!membership || membership.length === 0) {
        return {
            ok: false,
            reason: 'CA-01: el usuario no está vinculado a este proyecto.',
        };
    }
    return { ok: true };
}

// Carga proyecto + verifica que el solicitante sea su PM o admin.
async function loadProjectAndAuthorize(projectId, reqUser) {
    const { data: project, error } = await supabase
        .from('project')
        .select('id_project, id_pm, project_name')
        .eq('id_project', projectId)
        .single();

    if (error || !project) {
        return { error: { status: 404, message: 'Proyecto no encontrado' } };
    }

    if (reqUser.role === 'pm' && project.id_pm !== reqUser.id_user) {
        return {
            error: {
                status: 403,
                message: 'Solo el PM dueño del proyecto puede gestionar sus items',
            },
        };
    }
    return { project };
}

// ─── GET /work-items?project_id=123 ───────────────────────────────────────────
// BUGFIX: work_item no tiene columna id_project.
// Se resuelve obteniendo primero los id_sprint del proyecto y luego
// filtrando work_item por esos sprint IDs.
async function listWorkItems(req, res) {
    try {
        const projectId = parseInt(req.query.project_id);
        if (!projectId) {
            return res.status(400).json({ message: 'project_id es requerido' });
        }

        const { id_user, role } = req.user;

        // Verificar acceso al proyecto
        const { data: project, error: projErr } = await supabase
            .from('project')
            .select('id_project, id_pm')
            .eq('id_project', projectId)
            .single();

        if (projErr || !project) {
            return res.status(404).json({ message: 'Proyecto no encontrado' });
        }

        if (role === 'pm' && project.id_pm !== id_user) {
            return res.status(403).json({ message: 'No tienes acceso a este proyecto' });
        }
        if (role === 'viewer') {
            const { data: membership } = await supabase
                .from('project_member')
                .select('id_member')
                .eq('id_project', projectId)
                .eq('id_user', id_user)
                .limit(1);
            if (!membership || membership.length === 0) {
                return res.status(403).json({ message: 'No tienes acceso a este proyecto' });
            }
        }

        // CORRECCIÓN: obtener IDs de sprints del proyecto primero
        const { data: sprints, error: sprintErr } = await supabase
            .from('sprint')
            .select('id_sprint')
            .eq('id_project', projectId);

        if (sprintErr) {
            return res.status(500).json({ message: 'Error cargando sprints', error: sprintErr.message });
        }

        const sprintIds = (sprints || []).map(s => s.id_sprint);

        if (sprintIds.length === 0) {
            return res.status(200).json({ items: [] });
        }

        // Ahora buscar work_items por sprint IDs (columna que sí existe)
        const { data: items, error: itemsErr } = await supabase
            .from('work_item')
            .select('id_work_item, id_sprint, title, description, status, type, story_points, assignee_id, created_by, created_at, updated_at')
            .in('id_sprint', sprintIds)
            .order('created_at', { ascending: false });

        if (itemsErr) {
            return res.status(500).json({ message: 'Error cargando items', error: itemsErr.message });
        }

        // Hidratar nombre del assignee
        const assigneeIds = [...new Set((items || []).map(i => i.assignee_id).filter(Boolean))];
        let userMap = {};
        if (assigneeIds.length > 0) {
            const { data: users } = await supabase
                .from('users')
                .select('id_user, username, email')
                .in('id_user', assigneeIds);
            userMap = Object.fromEntries((users || []).map(u => [u.id_user, u]));
        }

        const enriched = (items || []).map(it => ({
            ...it,
            assignee: it.assignee_id ? (userMap[it.assignee_id] || null) : null,
        }));

        return res.status(200).json({ items: enriched });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// ─── POST /work-items ─────────────────────────────────────────────────────────
// BUGFIX: no insertar id_project — no existe en la tabla work_item.
async function createWorkItem(req, res) {
    try {
        const { id_project, id_sprint, title, description, assignee_id } = req.body;

        const auth = await loadProjectAndAuthorize(id_project, req.user);
        if (auth.error) {
            return res.status(auth.error.status).json({ message: auth.error.message });
        }
        const { project } = auth;

        // Validar que el sprint pertenezca al proyecto
        const { data: sprint, error: sprintErr } = await supabase
            .from('sprint')
            .select('id_sprint, id_project')
            .eq('id_sprint', id_sprint)
            .single();

        if (sprintErr || !sprint) {
            return res.status(400).json({ message: 'Sprint no encontrado' });
        }
        if (sprint.id_project !== id_project) {
            return res.status(400).json({ message: 'El sprint no pertenece a este proyecto' });
        }

        // CA-01/CA-02 si viene assignee
        if (assignee_id != null) {
            const linked = await isUserLinkedToProject(assignee_id, project);
            if (!linked.ok) {
                return res.status(400).json({ message: linked.reason });
            }
        }

        // INSERT sin id_project (columna inexistente en work_item)
        const { data: created, error: insertErr } = await supabase
            .from('work_item')
            .insert([{
                id_sprint:   id_sprint,
                title:       title,
                description: description || null,
                assignee_id: assignee_id ?? null,
                created_by:  req.user.id_user,
            }])
            .select()
            .single();

        if (insertErr) {
            return res.status(500).json({ message: 'Error creando item', error: insertErr.message });
        }

        // CA-03: auditoría si nace asignado
        if (assignee_id != null) {
            await supabase.from('audit_log').insert([{
                id_user:   req.user.id_user,
                action:    'ASSIGN_WORK_ITEM',
                entity:    'work_item',
                entity_id: String(created.id_work_item),
                payload: {
                    project_id:   id_project,
                    project_name: project.project_name,
                    item_title:   created.title,
                    from:         null,
                    to:           assignee_id,
                    on_create:    true,
                },
            }]);
        }

        return res.status(201).json({ message: 'Item creado', item: created });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// ─── PATCH /work-items/:id/assignee ──────────────────────────────────────────
// HU-09 — CA-01, CA-02, CA-03
async function assignWorkItem(req, res) {
    try {
        const itemId = parseInt(req.params.id);
        const { assignee_id } = req.body;

        const { data: item, error: itemErr } = await supabase
            .from('work_item')
            .select('id_work_item, id_sprint, title, assignee_id')
            .eq('id_work_item', itemId)
            .single();

        if (itemErr || !item) {
            return res.status(404).json({ message: 'Item no encontrado' });
        }

        // Obtener id_project desde el sprint
        const { data: sprint } = await supabase
            .from('sprint')
            .select('id_project')
            .eq('id_sprint', item.id_sprint)
            .single();

        if (!sprint) {
            return res.status(404).json({ message: 'Sprint del item no encontrado' });
        }

        const auth = await loadProjectAndAuthorize(sprint.id_project, req.user);
        if (auth.error) {
            return res.status(auth.error.status).json({ message: auth.error.message });
        }
        const { project } = auth;

        const linked = await isUserLinkedToProject(assignee_id, project);
        if (!linked.ok) {
            return res.status(400).json({ message: linked.reason });
        }

        if (item.assignee_id === (assignee_id ?? null)) {
            return res.status(200).json({ message: 'El responsable ya era ese; no se realizó cambio', item });
        }

        const previousAssignee = item.assignee_id;

        const { data: updated, error: updErr } = await supabase
            .from('work_item')
            .update({ assignee_id: assignee_id ?? null, updated_at: new Date().toISOString() })
            .eq('id_work_item', itemId)
            .select()
            .single();

        if (updErr) {
            return res.status(500).json({ message: 'Error reasignando item', error: updErr.message });
        }

        // CA-03: auditoría
        const { error: auditErr } = await supabase.from('audit_log').insert([{
            id_user:   req.user.id_user,
            action:    'ASSIGN_WORK_ITEM',
            entity:    'work_item',
            entity_id: String(itemId),
            payload: {
                project_id:   project.id_project,
                project_name: project.project_name,
                item_title:   item.title,
                from:         previousAssignee,
                to:           assignee_id ?? null,
                self_assigned: assignee_id === req.user.id_user,
            },
        }]);

        if (auditErr) console.warn('CA-03 WARNING: audit_log insert falló:', auditErr.message);

        return res.status(200).json({ message: 'Responsable actualizado', item: updated });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// ─── PATCH /work-items/:id/status ────────────────────────────────────────────
// HU-10 — CA-01, CA-02, CA-03, CA-04
async function updateWorkItemStatus(req, res) {
    try {
        const itemId = parseInt(req.params.id);
        const { status } = req.body;
        const { id_user, role } = req.user;

        const { data: item, error: itemErr } = await supabase
            .from('work_item')
            .select('id_work_item, id_sprint, title, status, assignee_id, story_points, gamification_weight')
            .eq('id_work_item', itemId)
            .single();

        if (itemErr || !item) {
            return res.status(404).json({ message: 'Item no encontrado' });
        }

        // Obtener id_project desde sprint
        const { data: sprint } = await supabase
            .from('sprint')
            .select('id_project')
            .eq('id_sprint', item.id_sprint)
            .single();

        // CA-01: verificar permisos por rol
        if (role === 'viewer') {
            if (item.assignee_id !== id_user) {
                return res.status(403).json({
                    message: 'CA-01: solo puedes cambiar el estado de items que tienes asignados',
                });
            }
        } else if (role === 'pm' && sprint) {
            const { data: project } = await supabase
                .from('project')
                .select('id_pm')
                .eq('id_project', sprint.id_project)
                .single();
            if (!project || project.id_pm !== id_user) {
                return res.status(403).json({
                    message: 'Solo el PM dueño del proyecto puede cambiar estados de items ajenos',
                });
            }
        }

        if (item.status === status) {
            return res.status(200).json({ message: 'El estado ya era ese; no se realizó cambio', item });
        }

        const previousStatus = item.status;
        const now = new Date().toISOString();

        const { data: updated, error: updErr } = await supabase
            .from('work_item')
            .update({ status, updated_at: now })
            .eq('id_work_item', itemId)
            .select()
            .single();

        if (updErr) {
            return res.status(500).json({ message: 'Error actualizando estado', error: updErr.message });
        }

        // CA-03: auditoría
        await supabase.from('audit_log').insert([{
            id_user,
            action:    'UPDATE_WORK_ITEM_STATUS',
            entity:    'work_item',
            entity_id: String(itemId),
            payload: {
                project_id: sprint?.id_project,
                item_title: item.title,
                from:       previousStatus,
                to:         status,
                changed_at: now,
            },
        }]);

        // CA-04: gamification al pasar a 'done'
        if (status === 'done' && item.assignee_id) {
            const weight = item.gamification_weight || 1;
            const { data: gam } = await supabase
                .from('gamification')
                .select('id_gamification, level')
                .eq('id_user', item.assignee_id)
                .single();

            let gamId, oldLevel, newLevel;
            if (gam) {
                oldLevel = gam.level || 0;
                newLevel = oldLevel + weight;
                gamId    = gam.id_gamification;
                await supabase.from('gamification').update({ level: newLevel }).eq('id_gamification', gamId);
            } else {
                oldLevel = 0;
                newLevel = weight;
                const { data: created } = await supabase
                    .from('gamification')
                    .insert([{ id_user: item.assignee_id, level: newLevel }])
                    .select()
                    .single();
                gamId = created?.id_gamification;
            }
            if (gamId) {
                await supabase.from('scorehistory').insert([{
                    id_gamification: gamId,
                    level_gained: weight,
                    old_level:    oldLevel,
                    new_level:    newLevel,
                }]);
            }
        }

        // Revertir gamification si vuelve de 'done'
        if (previousStatus === 'done' && status !== 'done' && item.assignee_id) {
            const weight = item.gamification_weight || 1;
            const { data: gam } = await supabase
                .from('gamification')
                .select('id_gamification, level')
                .eq('id_user', item.assignee_id)
                .single();
            if (gam) {
                const oldLevel = gam.level || 0;
                const newLevel = Math.max(0, oldLevel - weight);
                await supabase.from('gamification').update({ level: newLevel }).eq('id_gamification', gam.id_gamification);
                await supabase.from('scorehistory').insert([{
                    id_gamification: gam.id_gamification,
                    level_gained: -weight,
                    old_level:    oldLevel,
                    new_level:    newLevel,
                }]);
            }
        }

        return res.status(200).json({ message: 'Estado actualizado', item: updated });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

module.exports = { listWorkItems, createWorkItem, assignWorkItem, updateWorkItemStatus };