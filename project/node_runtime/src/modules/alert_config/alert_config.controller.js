const supabase = require('../../config/supabase');
const { updateAlertConfigSchema } = require('./alert_config.validation');

const DEFAULTS = {
    notify_to_yellow:     true,
    notify_to_red:        true,
    notify_score_jump:    true,
    score_jump_threshold: 15,
};

// PM dueño del proyecto OR admin pueden gestionar la config.
async function canManage(userId, role, projectId) {
    if (role === 'admin') return true;
    const { data, error } = await supabase
        .from('project')
        .select('id_pm')
        .eq('id_project', projectId)
        .maybeSingle();
    // Un fallo de BD no debe disfrazarse de 403; que el try/catch externo devuelva 500.
    if (error) throw new Error(`canManage DB error: ${error.message}`);
    return data?.id_pm === userId;
}

// GET /projects/:id/alert-config — defaults si no hay fila (sin crearla)
async function getConfig(req, res) {
    try {
        const id_project = parseInt(req.params.id, 10);
        if (Number.isNaN(id_project)) return res.status(400).json({ message: 'id de proyecto inválido' });

        const { id_user, role } = req.user;
        if (!(await canManage(id_user, role, id_project)))
            return res.status(403).json({ message: 'No autorizado para configurar este proyecto' });

        const { data, error } = await supabase
            .from('project_alert_config')
            .select('id_project, notify_to_yellow, notify_to_red, notify_score_jump, score_jump_threshold')
            .eq('id_project', id_project)
            .maybeSingle();
        if (error) return res.status(500).json({ message: 'Error cargando configuración', error: error.message });

        return res.status(200).json(data || { id_project, ...DEFAULTS });
    } catch (err) {
        return res.status(500).json({ message: 'Error inesperado', error: err.message });
    }
}

// PUT /projects/:id/alert-config — upsert + audit
async function putConfig(req, res) {
    try {
        const id_project = parseInt(req.params.id, 10);
        if (Number.isNaN(id_project)) return res.status(400).json({ message: 'id de proyecto inválido' });

        const { id_user, role } = req.user;
        if (!(await canManage(id_user, role, id_project)))
            return res.status(403).json({ message: 'No autorizado para configurar este proyecto' });

        const parsed = updateAlertConfigSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: 'Validación falló',
                errors: parsed.error.issues.map(e => ({ field: e.path.join('.'), message: e.message })),
            });
        }

        // before = fila existente o defaults (para el snapshot de auditoría)
        const { data: existing, error: existingErr } = await supabase
            .from('project_alert_config')
            .select('notify_to_yellow, notify_to_red, notify_score_jump, score_jump_threshold')
            .eq('id_project', id_project)
            .maybeSingle();
        if (existingErr) console.warn('alert-config before snapshot falló:', existingErr.message);
        const before = existing || { ...DEFAULTS };

        const row = {
            id_project,
            ...parsed.data,
            updated_by: id_user,
            updated_at: new Date().toISOString(),
        };
        const { data: saved, error } = await supabase
            .from('project_alert_config')
            .upsert(row, { onConflict: 'id_project' })
            .select('id_project, notify_to_yellow, notify_to_red, notify_score_jump, score_jump_threshold')
            .single();
        if (error) return res.status(500).json({ message: 'Error guardando configuración', error: error.message });

        await supabase.from('audit_log').insert([{
            id_user,
            action:    'UPDATE_ALERT_CONFIG',
            entity:    'project_alert_config',
            entity_id: String(id_project),
            payload:   { project_id: id_project, before, after: parsed.data },
        }]);

        return res.status(200).json({ ok: true, config: saved });
    } catch (err) {
        return res.status(500).json({ message: 'Error inesperado', error: err.message });
    }
}

module.exports = { getConfig, putConfig };
