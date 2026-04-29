const supabase = require('../../config/supabase');

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Obtiene el presupuesto del proyecto. Si no existe lo crea con total_cost = 0.
 * Garantiza que siempre exista un budget antes de registrar gastos.
 */
async function getOrCreateBudget(projectId) {
    const { data: existing } = await supabase
        .from('budget')
        .select('id_budget, total_cost')
        .eq('id_project', projectId)
        .single();

    if (existing) return existing;

    const { data: created, error } = await supabase
        .from('budget')
        .insert([{ id_project: projectId, total_cost: 0, can_view_budget: true }])
        .select('id_budget, total_cost')
        .single();

    if (error) throw new Error(`Error creando budget: ${error.message}`);
    return created;
}

/**
 * Recalcula el costo aprobado acumulado del proyecto (CA-03 HU-13).
 * Solo suma los gastos con status = 'approved'.
 * CA-04 HU-12: los pending NO se cuentan.
 */
async function recalcApprovedCost(budgetId) {
    const { data: spends, error } = await supabase
        .from('spend')
        .select('spendmoney')
        .eq('id_budget', budgetId)
        .eq('status', 'approved');

    if (error) return;

    const total = (spends || []).reduce((acc, s) => acc + Number(s.spendmoney || 0), 0);

    // Guardamos el acumulado en una columna auxiliar de budget para acceso rápido
    // (sin necesidad de sumar en cada GET)
    await supabase
        .from('budget')
        .update({ description: JSON.stringify({ approved_total: total }) })
        .eq('id_budget', budgetId);
}

// ─── GET /costs?project_id=:id ────────────────────────────────────────────────
// Devuelve gastos + resumen de presupuesto.
// Roles:
//   viewer → solo sus propios gastos
//   pm     → todos los gastos de sus proyectos
//   admin  → todos
async function listCosts(req, res) {
    try {
        const projectId = parseInt(req.query.project_id);
        if (!projectId) return res.status(400).json({ message: 'project_id es requerido' });

        const { id_user, role } = req.user;

        // Verificar que el proyecto existe
        const { data: project, error: projErr } = await supabase
            .from('project')
            .select('id_project, id_pm, project_name, estimated_sp')
            .eq('id_project', projectId)
            .single();

        if (projErr || !project) return res.status(404).json({ message: 'Proyecto no encontrado' });

        // CA-01: PM solo ve sus proyectos
        if (role === 'pm' && project.id_pm !== id_user) {
            return res.status(403).json({ message: 'CA-01: solo puedes ver costos de tus proyectos' });
        }

        // Obtener o crear budget
        const budget = await getOrCreateBudget(projectId);

        // Construir query base
        let query = supabase
            .from('spend')
            .select(`
                id_spend,
                id_budget,
                spendmoney,
                type,
                description,
                status,
                submitted_by,
                decided_by,
                decided_at,
                spend_date,
                created_at
            `)
            .eq('id_budget', budget.id_budget)
            .order('created_at', { ascending: false });

        // Viewer solo ve sus propios gastos
        if (role === 'viewer') {
            query = query.eq('submitted_by', id_user);
        }

        const { data: spends, error: spendsErr } = await query;
        if (spendsErr) return res.status(500).json({ message: 'Error cargando costos', error: spendsErr.message });

        // Hidratar nombres de usuarios (submitted_by y decided_by)
        const userIds = [...new Set([
            ...(spends || []).map(s => s.submitted_by).filter(Boolean),
            ...(spends || []).map(s => s.decided_by).filter(Boolean),
        ])];

        let userMap = {};
        if (userIds.length > 0) {
            const { data: users } = await supabase
                .from('users')
                .select('id_user, username, full_name')
                .in('id_user', userIds);
            userMap = Object.fromEntries((users || []).map(u => [u.id_user, u]));
        }

        const enriched = (spends || []).map(s => ({
            ...s,
            category:       s.type,
            amount:         Number(s.spendmoney),
            submitter:      userMap[s.submitted_by] || null,
            decider:        userMap[s.decided_by]   || null,
        }));

        // Resumen de presupuesto
        const allSpends = role === 'viewer' ? [] : (spends || []);
        const approvedTotal  = enriched.filter(s => s.status === 'approved').reduce((a, s) => a + s.amount, 0);
        const pendingTotal   = enriched.filter(s => s.status === 'pending').reduce((a, s)  => a + s.amount, 0);

        return res.status(200).json({
            spends: enriched,
            summary: {
                estimated_budget: Number(budget.total_cost || 0),
                approved_cost:    approvedTotal,
                pending_cost:     pendingTotal,
                remaining_budget: Number(budget.total_cost || 0) - approvedTotal,
            },
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// ─── POST /costs ──────────────────────────────────────────────────────────────
// HU-12: viewer (o pm) registra un costo con status 'pending'.
// CA-01: categoría válida (validada por Zod antes de llegar aquí).
// CA-02: monto > 0 (validado por Zod).
// CA-03: guardado con status = 'pending'.
// CA-04: no modifica métricas oficiales.
async function submitCost(req, res) {
    try {
        const { id_project, category, amount, description, spend_date } = req.body;
        const { id_user } = req.user;

        // Verificar acceso al proyecto
        const { data: project, error: projErr } = await supabase
            .from('project')
            .select('id_project, id_pm')
            .eq('id_project', id_project)
            .single();

        if (projErr || !project) return res.status(404).json({ message: 'Proyecto no encontrado' });

        // Verificar que el usuario es miembro o PM del proyecto
        if (req.user.role === 'viewer') {
            const { data: membership } = await supabase
                .from('project_member')
                .select('id_member')
                .eq('id_project', id_project)
                .eq('id_user', id_user)
                .limit(1);
            if (!membership || membership.length === 0) {
                return res.status(403).json({ message: 'No eres miembro de este proyecto' });
            }
        } else if (req.user.role === 'pm' && project.id_pm !== id_user) {
            return res.status(403).json({ message: 'Solo puedes registrar costos en tus proyectos' });
        }

        const budget = await getOrCreateBudget(id_project);

        // CA-03: siempre status = 'pending'
        const { data: created, error: insertErr } = await supabase
            .from('spend')
            .insert([{
                id_budget:    budget.id_budget,
                spendmoney:   amount,
                type:         category,       // CA-01: categoría válida
                description:  description,
                status:       'pending',       // CA-03
                submitted_by: id_user,
                spend_date:   spend_date,
            }])
            .select()
            .single();

        if (insertErr) return res.status(500).json({ message: 'Error registrando costo', error: insertErr.message });

        // CA-04: NO se actualiza total_cost del budget (pending no impacta métricas)

        // Auditoría
        await supabase.from('audit_log').insert([{
            id_user,
            action:    'SUBMIT_COST',
            entity:    'spend',
            entity_id: String(created.id_spend),
            payload: {
                project_id:  id_project,
                category,
                amount,
                description,
                status: 'pending',
            },
        }]);

        return res.status(201).json({ message: 'Costo registrado. Pendiente de aprobación del PM.', spend: created });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// ─── PATCH /costs/:id/decision ────────────────────────────────────────────────
// HU-13: PM aprueba o rechaza un costo pendiente.
// CA-01: PM solo decide sobre costos de sus proyectos.
// CA-02: actualiza status a 'approved' o 'rejected'.
// CA-03: si aprueba, recalcula costo aprobado acumulado.
// CA-04: registra decisión en audit_log.
async function decideCost(req, res) {
    try {
        const spendId  = parseInt(req.params.id);
        const { decision } = req.body; // 'approved' | 'rejected'
        const { id_user, role } = req.user;

        // Cargar el gasto
        const { data: spend, error: spendErr } = await supabase
            .from('spend')
            .select('id_spend, id_budget, spendmoney, type, description, status, submitted_by')
            .eq('id_spend', spendId)
            .single();

        if (spendErr || !spend) return res.status(404).json({ message: 'Costo no encontrado' });
        if (spend.status !== 'pending') {
            return res.status(400).json({ message: `El costo ya tiene status '${spend.status}'` });
        }

        // Obtener proyecto desde budget
        const { data: budget, error: budgetErr } = await supabase
            .from('budget')
            .select('id_budget, id_project, total_cost')
            .eq('id_budget', spend.id_budget)
            .single();

        if (budgetErr || !budget) return res.status(404).json({ message: 'Budget no encontrado' });

        // CA-01: solo el PM dueño del proyecto
        const { data: project } = await supabase
            .from('project')
            .select('id_project, id_pm, project_name')
            .eq('id_project', budget.id_project)
            .single();

        if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' });

        if (role === 'pm' && project.id_pm !== id_user) {
            return res.status(403).json({
                message: 'CA-01: solo el PM dueño del proyecto puede aprobar/rechazar sus costos',
            });
        }

        const now = new Date().toISOString();

        // CA-02: actualizar status
        const { data: updated, error: updErr } = await supabase
            .from('spend')
            .update({
                status:     decision,
                decided_by: id_user,
                decided_at: now,
            })
            .eq('id_spend', spendId)
            .select()
            .single();

        if (updErr) return res.status(500).json({ message: 'Error actualizando costo', error: updErr.message });

        // CA-03: si se aprueba, recalcular total aprobado
        if (decision === 'approved') {
            await recalcApprovedCost(budget.id_budget);
        }

        // CA-04: auditoría
        await supabase.from('audit_log').insert([{
            id_user,
            action:    `COST_${decision.toUpperCase()}`,
            entity:    'spend',
            entity_id: String(spendId),
            payload: {
                project_id:   project.id_project,
                project_name: project.project_name,
                category:     spend.type,
                amount:       Number(spend.spendmoney),
                decision,
                decided_at:   now,
            },
        }]);

        const label = decision === 'approved' ? 'aprobado' : 'rechazado';
        return res.status(200).json({ message: `Costo ${label} correctamente`, spend: updated });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

// ─── PATCH /costs/budget/:project_id ─────────────────────────────────────────
// Permite al PM actualizar el presupuesto estimado del proyecto.
async function updateBudget(req, res) {
    try {
        const projectId = parseInt(req.params.project_id);
        const { total_cost } = req.body;
        const { id_user, role } = req.user;

        if (!total_cost || Number(total_cost) <= 0) {
            return res.status(400).json({ message: 'El presupuesto debe ser mayor a cero' });
        }

        const { data: project } = await supabase
            .from('project')
            .select('id_project, id_pm')
            .eq('id_project', projectId)
            .single();

        if (!project) return res.status(404).json({ message: 'Proyecto no encontrado' });
        if (role === 'pm' && project.id_pm !== id_user) {
            return res.status(403).json({ message: 'Solo el PM dueño puede modificar el presupuesto' });
        }

        const budget = await getOrCreateBudget(projectId);

        const { data: updated, error } = await supabase
            .from('budget')
            .update({ total_cost: Number(total_cost) })
            .eq('id_budget', budget.id_budget)
            .select()
            .single();

        if (error) return res.status(500).json({ message: 'Error actualizando presupuesto', error: error.message });

        return res.status(200).json({ message: 'Presupuesto actualizado', budget: updated });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}

module.exports = { listCosts, submitCost, decideCost, updateBudget };