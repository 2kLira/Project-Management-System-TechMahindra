const supabase = require('../../config/supabase');

// Helper: valida que un usuario esté vinculado al proyecto
// (es el PM del proyecto O está en project_member).
// CA-01 (HU-09): permitir asignar solo usuarios vinculados al proyecto.
// CA-02 (HU-09): el PM puede asignarse ítems a sí mismo.
async function isUserLinkedToProject(userId, project) {
    if (userId == null) return { ok: true }; // null = desasignar, permitido

    // CA-02: el PM del proyecto siempre cuenta como vinculado.
    if (userId === project.id_pm) return { ok: true };

    // CA-01: en otro caso debe estar en project_member.
    const { data: membership, error } = await supabase
        .from('project_member')
        .select('id_member')
        .eq('id_project', project.id_project)
        .eq('id_user', userId)
        .limit(1);

    if (error) {
        return { ok: false, reason: `Error verificando membresía: ${error.message}` };
    }
    if (!membership || membership.length === 0) {
        return {
            ok: false,
            reason: 'CA-01: el usuario no está vinculado a este proyecto. Solo el PM o los viewers asignados pueden recibir items.',
        };
    }
    return { ok: true };
}

// =====================================================
// Helper: carga proyecto + verifica permiso del solicitante.
// Solo el PM dueño del proyecto o un admin puede gestionar items.
// =====================================================
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

// =====================================================
// GET /work-items?project_id=123
// Lista items de un proyecto, con filtro fino por rol:
//   - admin : cualquier proyecto
//   - pm    : solo su proyecto
//   - viewer: solo proyectos donde es miembro
// =====================================================
async function listWorkItems(req, res) {
    try {
        const projectId = parseInt(req.query.project_id);
        if (!projectId) {
            return res.status(400).json({ message: 'project_id es requerido' });
        }

        const { id_user, role } = req.user;

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

        const { data: items, error: itemsErr } = await supabase
            .from('work_item')
            .select('id_work_item, id_project, id_sprint, title, description, status, type, story_points, assignee_id, created_by, created_at, updated_at')
            .eq('id_project', projectId)
            .order('created_at', { ascending: false });

        if (itemsErr) {
            return res.status(500).json({ message: 'Error cargando items', error: itemsErr.message });
        }

        // Hidratar nombres del assignee para la UI
        const assigneeIds = [...new Set(items.map(i => i.assignee_id).filter(Boolean))];
        let userMap = {};
        if (assigneeIds.length > 0) {
            const { data: users } = await supabase
                .from('users')
                .select('id_user, username, email')
                .in('id_user', assigneeIds);
            userMap = Object.fromEntries((users || []).map(u => [u.id_user, u]));
        }

        const enriched = items.map(it => ({
            ...it,
            assignee: it.assignee_id ? userMap[it.assignee_id] || null : null,
        }));

        return res.status(200).json({ items: enriched });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// =====================================================
// POST /work-items
// Crea un nuevo item. Si viene assignee_id, pasa por CA-01/CA-02.
// =====================================================
async function createWorkItem(req, res) {
    try {
        const { id_project, id_sprint, title, description, assignee_id } = req.body;

        const auth = await loadProjectAndAuthorize(id_project, req.user);
        if (auth.error) {
            return res.status(auth.error.status).json({ message: auth.error.message });
        }
        const { project } = auth;

        // Si viene id_sprint, validar que pertenezca al mismo proyecto
        if (id_sprint != null) {
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
        }

        // CA-01 / CA-02 también aplican en creación si nace asignado
        if (assignee_id != null) {
            const linked = await isUserLinkedToProject(assignee_id, project);
            if (!linked.ok) {
                return res.status(400).json({ message: linked.reason });
            }
        }

        const { data: created, error: insertErr } = await supabase
            .from('work_item')
            .insert([{
                id_project,
                id_sprint: id_sprint ?? null,
                title,
                description: description || null,
                assignee_id: assignee_id ?? null,
                created_by: req.user.id_user,
            }])
            .select()
            .single();

        if (insertErr) {
            return res.status(500).json({ message: 'Error creando item', error: insertErr.message });
        }

        // Si nace asignado, registramos la asignación inicial para trazabilidad completa (CA-03).
        if (assignee_id != null) {
            await supabase.from('audit_log').insert([{
                id_user: req.user.id_user,
                action: 'ASSIGN_WORK_ITEM',
                entity: 'work_item',
                entity_id: String(created.id_work_item),
                payload: {
                    project_id: id_project,
                    project_name: project.project_name,
                    item_title: created.title,
                    from: null,
                    to: assignee_id,
                    on_create: true,
                },
            }]);
        }

        return res.status(201).json({ message: 'Item creado', item: created });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// =====================================================
// PATCH /work-items/:id/assignee
// HU-09 — endpoint principal.
//
//   CA-01: assignee_id debe ser usuario vinculado al proyecto
//          (PM del proyecto o miembro en project_member).
//   CA-02: el PM puede asignarse a sí mismo (caso particular del CA-01).
//   CA-03: el cambio de responsable se registra en audit_log con
//          { from, to, item_title, project_id, self_assigned }.
//
// Permisos: solo el PM dueño del proyecto o admin.
// =====================================================
async function assignWorkItem(req, res) {
    try {
        const itemId = parseInt(req.params.id);
        const { assignee_id } = req.body; // número o null

        // 1. Cargar el item
        const { data: item, error: itemErr } = await supabase
            .from('work_item')
            .select('id_work_item, id_project, title, assignee_id')
            .eq('id_work_item', itemId)
            .single();

        if (itemErr || !item) {
            return res.status(404).json({ message: 'Item no encontrado' });
        }

        // 2. Cargar proyecto + permiso del solicitante
        const auth = await loadProjectAndAuthorize(item.id_project, req.user);
        if (auth.error) {
            return res.status(auth.error.status).json({ message: auth.error.message });
        }
        const { project } = auth;

        // 3. CA-01 + CA-02
        const linked = await isUserLinkedToProject(assignee_id, project);
        if (!linked.ok) {
            return res.status(400).json({ message: linked.reason });
        }

        // 4. No-op: mismo responsable → no se ausdita ni se actualiza updated_at
        if (item.assignee_id === (assignee_id ?? null)) {
            return res.status(200).json({
                message: 'El responsable ya era ese; no se realizó cambio',
                item,
            });
        }

        const previousAssignee = item.assignee_id;

        // 5. Persistir cambio
        const { data: updated, error: updErr } = await supabase
            .from('work_item')
            .update({
                assignee_id: assignee_id ?? null,
                updated_at: new Date().toISOString(),
            })
            .eq('id_work_item', itemId)
            .select()
            .single();

        if (updErr) {
            return res.status(500).json({ message: 'Error reasignando item', error: updErr.message });
        }

        // 6. CA-03: auditoría
        const { error: auditErr } = await supabase.from('audit_log').insert([{
            id_user: req.user.id_user,
            action: 'ASSIGN_WORK_ITEM',
            entity: 'work_item',
            entity_id: String(itemId),
            payload: {
                project_id: project.id_project,
                project_name: project.project_name,
                item_title: item.title,
                from: previousAssignee,
                to: assignee_id ?? null,
                self_assigned: assignee_id === req.user.id_user,
            },
        }]);

        if (auditErr) {
            console.warn('CA-03 WARNING: audit_log insert falló:', auditErr.message);
        }

        return res.status(200).json({
            message: 'Responsable actualizado',
            item: updated,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// =====================================================
// PATCH /work-items/:id/status
// HU-10 — Viewer cambia el estado de sus items asignados.
//
//   CA-01: solo el assignee puede cambiar el estado de sus items.
//          Admin y PM del proyecto también pueden hacerlo.
//   CA-02: estados válidos: 'todo', 'in_progress', 'done' (validado por Zod).
//   CA-03: cada cambio guarda fecha (updated_at) y usuario en audit_log.
//   CA-04: si el estado cambia a 'done', actualizar gamification y scorehistory.
// =====================================================
async function updateWorkItemStatus(req, res) {
    try {
        const itemId = parseInt(req.params.id);
        const { status } = req.body;
        const { id_user, role } = req.user;

        // 1. Cargar el item
        const { data: item, error: itemErr } = await supabase
            .from('work_item')
            .select('id_work_item, id_project, title, status, assignee_id, story_points, gamification_weight')
            .eq('id_work_item', itemId)
            .single();

        if (itemErr || !item) {
            return res.status(404).json({ message: 'Item no encontrado' });
        }

        // 2. CA-01: verificar que el usuario puede cambiar el estado
        if (role === 'viewer') {
            if (item.assignee_id !== id_user) {
                return res.status(403).json({
                    message: 'CA-01: solo puedes cambiar el estado de items que tienes asignados',
                });
            }
        } else if (role === 'pm') {
            const { data: project } = await supabase
                .from('project')
                .select('id_pm')
                .eq('id_project', item.id_project)
                .single();
            if (!project || project.id_pm !== id_user) {
                return res.status(403).json({
                    message: 'Solo el PM dueño del proyecto puede cambiar estados de items ajenos',
                });
            }
        }
        // admin: sin restricción adicional

        // 3. No-op si el estado ya es el mismo
        if (item.status === status) {
            return res.status(200).json({
                message: 'El estado ya era ese; no se realizó cambio',
                item,
            });
        }

        const previousStatus = item.status;
        const now = new Date().toISOString();

        // 4. Persistir cambio — CA-03: updated_at se actualiza
        const { data: updated, error: updErr } = await supabase
            .from('work_item')
            .update({ status, updated_at: now })
            .eq('id_work_item', itemId)
            .select()
            .single();

        if (updErr) {
            return res.status(500).json({ message: 'Error actualizando estado', error: updErr.message });
        }

        // 5. CA-03: auditoría con fecha y usuario responsable
        await supabase.from('audit_log').insert([{
            id_user,
            action: 'UPDATE_WORK_ITEM_STATUS',
            entity: 'work_item',
            entity_id: String(itemId),
            payload: {
                project_id: item.id_project,
                item_title: item.title,
                from: previousStatus,
                to: status,
                changed_at: now,
            },
        }]);

        // 6. CA-04: si pasa a 'done', actualizar gamification + scorehistory
        if (status === 'done' && item.assignee_id) {
            const weight = item.gamification_weight || 1;

            // Buscar o crear registro de gamification para el assignee
            const { data: gam } = await supabase
                .from('gamification')
                .select('id_gamification, level')
                .eq('id_user', item.assignee_id)
                .single();

            let gamId, oldLevel, newLevel;

            if (gam) {
                oldLevel = gam.level || 0;
                newLevel = oldLevel + weight;
                gamId = gam.id_gamification;
                await supabase
                    .from('gamification')
                    .update({ level: newLevel })
                    .eq('id_gamification', gamId);
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

            // Registrar en scorehistory
            if (gamId) {
                await supabase.from('scorehistory').insert([{
                    id_gamification: gamId,
                    level_gained: weight,
                    old_level: oldLevel,
                    new_level: newLevel,
                }]);
            }
        }

        // 7. Si vuelve de 'done' a otro estado, revertir gamification
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
                await supabase
                    .from('gamification')
                    .update({ level: newLevel })
                    .eq('id_gamification', gam.id_gamification);

                await supabase.from('scorehistory').insert([{
                    id_gamification: gam.id_gamification,
                    level_gained: -weight,
                    old_level: oldLevel,
                    new_level: newLevel,
                }]);
            }
        }

        return res.status(200).json({
            message: 'Estado actualizado',
            item: updated,
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

module.exports = {
    listWorkItems,
    createWorkItem,
    assignWorkItem,
    updateWorkItemStatus,
};