const supabase = require('../../config/supabase');

const MAX_ITEMS = 50;

// GET /notifications?unreadOnly=true
// Devuelve { items: [...max 50, created_at DESC...], unreadCount } solo del usuario logueado.
async function listNotifications(req, res) {
    try {
        const userId     = req.user.id_user;
        const unreadOnly = req.query.unreadOnly === 'true';

        let q = supabase
            .from('notifications')
            .select('id_notifications, id_project, kind, subject, write, read_at, created_at')
            .eq('id_user', userId)
            .order('created_at', { ascending: false })
            .limit(MAX_ITEMS);
        if (unreadOnly) q = q.is('read_at', null);

        const { data: rows, error } = await q;
        if (error) return res.status(500).json({ message: 'Error cargando notificaciones', error: error.message });

        // unreadCount independiente del limit (puede ser > 50)
        const { count, error: cErr } = await supabase
            .from('notifications')
            .select('id_notifications', { count: 'exact', head: true })
            .eq('id_user', userId)
            .is('read_at', null);
        if (cErr) return res.status(500).json({ message: 'Error contando no leídas', error: cErr.message });

        // Hidratar project_name en memoria para evitar N+1 en el frontend
        const projectIds = [...new Set((rows || []).map(r => r.id_project).filter(Boolean))];
        let namesById = {};
        if (projectIds.length > 0) {
            const { data: projects, error: pErr } = await supabase
                .from('project')
                .select('id_project, project_name')
                .in('id_project', projectIds);
            if (pErr) console.warn('notifications project hydration falló:', pErr.message);
            namesById = Object.fromEntries((projects || []).map(p => [p.id_project, p.project_name]));
        }

        const items = (rows || []).map(r => ({
            id_notifications: r.id_notifications,
            id_project:       r.id_project,
            project_name:     namesById[r.id_project] ?? null,
            kind:             r.kind,
            subject:          r.subject,
            write:            r.write,
            read_at:          r.read_at,
            created_at:       r.created_at,
        }));

        return res.status(200).json({ items, unreadCount: count ?? 0 });
    } catch (err) {
        return res.status(500).json({ message: 'Error inesperado en notificaciones', error: err.message });
    }
}

// PATCH /notifications/:id/read — solo dueño
async function markRead(req, res) {
    try {
        const userId = req.user.id_user;
        const id = parseInt(req.params.id, 10);
        if (Number.isNaN(id)) return res.status(400).json({ message: 'id inválido' });

        const { data: notif, error: fErr } = await supabase
            .from('notifications')
            .select('id_notifications, id_user, read_at')
            .eq('id_notifications', id)
            .maybeSingle();
        if (fErr) return res.status(500).json({ message: 'Error consultando notificación', error: fErr.message });
        if (!notif) return res.status(404).json({ message: 'Notificación no encontrada' });
        if (notif.id_user !== userId) return res.status(403).json({ message: 'No autorizado' });

        if (notif.read_at == null) {
            // .eq('id_user', userId) como defensa en profundidad (ownership ya validado arriba)
            const { error } = await supabase
                .from('notifications')
                .update({ read_at: new Date().toISOString() })
                .eq('id_notifications', id)
                .eq('id_user', userId);
            if (error) return res.status(500).json({ message: 'Error marcando como leída', error: error.message });
        }
        return res.status(200).json({ ok: true });
    } catch (err) {
        return res.status(500).json({ message: 'Error inesperado', error: err.message });
    }
}

// PATCH /notifications/read-all — marca todas las del usuario con read_at IS NULL
async function markAllRead(req, res) {
    try {
        const userId = req.user.id_user;
        const { data, error } = await supabase
            .from('notifications')
            .update({ read_at: new Date().toISOString() })
            .eq('id_user', userId)
            .is('read_at', null)
            .select('id_notifications');
        if (error) return res.status(500).json({ message: 'Error marcando todas como leídas', error: error.message });
        return res.status(200).json({ updated: (data || []).length });
    } catch (err) {
        return res.status(500).json({ message: 'Error inesperado', error: err.message });
    }
}

module.exports = { listNotifications, markRead, markAllRead };
