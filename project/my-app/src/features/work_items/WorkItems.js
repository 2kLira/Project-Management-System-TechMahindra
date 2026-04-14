import { useState, useEffect, useCallback } from 'react';
import api from '../../config/api';

/**
 * HU-09 — Asignación de items a viewer o al propio PM
 *
 * Componente para que el PM gestione los items de un proyecto:
 *   - Listar items con su responsable actual
 *   - Reasignar a cualquier viewer del proyecto o a sí mismo (CA-01, CA-02)
 *   - Cada cambio dispara auditoría en backend (CA-03)
 *
 * Props:
 *   - projectId: id del proyecto
 *   - projectName: nombre para el header
 *   - currentUser: { id_user, username, role } del usuario logueado
 *   - onBack: callback opcional para volver
 */
function WorkItems({ projectId, projectName, currentUser, onBack }) {
    const [items, setItems] = useState([]);
    const [assignableUsers, setAssignableUsers] = useState([]); // PM + viewers vinculados
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Form para crear item nuevo (mínimo viable, así HU-09 es probable end-to-end)
    const [newTitle, setNewTitle] = useState('');
    const [newDescription, setNewDescription] = useState('');

    // ---------- Loaders ----------

    const loadItems = useCallback(async () => {
        try {
            const { res, data } = await api.get(`/work-items?project_id=${projectId}`);
            if (res.ok) {
                setItems(data.items || []);
            } else {
                setMessage({ text: data.message || 'Error cargando items', type: 'error' });
            }
        } catch {
            setMessage({ text: 'Error de conexión', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    // Carga la lista de usuarios a los que se puede asignar:
    //   - el PM del proyecto (a sí mismo, CA-02)
    //   - los viewers vinculados (CA-01)
    const loadAssignableUsers = useCallback(async () => {
        try {
            // Viewers del proyecto
            const viewersResp = await api.get(`/projects/${projectId}/viewers`);
            const viewers = viewersResp.res.ok ? (viewersResp.data.viewers || []) : [];

            // El PM no aparece en /viewers, lo agregamos manualmente desde currentUser
            // si quien está usando la UI es el PM dueño. Para el caso admin, el PM
            // del proyecto debería venir junto con el detalle del proyecto; aquí
            // asumimos que currentUser es PM o admin viendo su panel.
            const assignable = [...viewers];
            if (currentUser?.role === 'pm') {
                assignable.unshift({
                    id_user: currentUser.id_user,
                    username: `${currentUser.username} (yo · PM)`,
                    email: currentUser.email,
                });
            }
            setAssignableUsers(assignable);
        } catch {
            // silencioso — el dropdown simplemente queda corto
        }
    }, [projectId, currentUser]);

    useEffect(() => {
        loadItems();
        loadAssignableUsers();
    }, [loadItems, loadAssignableUsers]);

    // ---------- Acciones ----------

    async function handleCreateItem(e) {
        e.preventDefault();
        if (!newTitle.trim()) {
            setMessage({ text: 'El título es obligatorio', type: 'error' });
            return;
        }
        try {
            const { res, data } = await api.post('/work-items', {
                id_project: projectId,
                title: newTitle.trim(),
                description: newDescription.trim() || null,
            });
            if (res.ok) {
                setNewTitle('');
                setNewDescription('');
                setMessage({ text: 'Item creado', type: 'success' });
                loadItems();
            } else {
                setMessage({ text: data.message || 'Error creando item', type: 'error' });
            }
        } catch {
            setMessage({ text: 'Error de conexión', type: 'error' });
        }
    }

    // Núcleo de HU-09: cambiar el responsable de un item.
    async function handleAssign(itemId, newAssigneeId) {
        const payload = { assignee_id: newAssigneeId === '' ? null : parseInt(newAssigneeId) };
        try {
            const { res, data } = await api.patch(`/work-items/${itemId}/assignee`, payload);
            if (res.ok) {
                setMessage({ text: 'Responsable actualizado', type: 'success' });
                // Optimistic refresh
                loadItems();
            } else {
                // Backend devuelve mensajes con el código del CA (ej. "CA-01: ...")
                setMessage({ text: data.message || 'Error reasignando', type: 'error' });
            }
        } catch {
            setMessage({ text: 'Error de conexión', type: 'error' });
        }
    }

    // ---------- Render ----------

    if (loading) return <div style={s.loading}>Cargando items...</div>;

    return (
        <div>
            {onBack && (
                <button style={s.backBtn} onClick={onBack}>← Volver</button>
            )}
            <h2 style={s.title}>Items de trabajo — {projectName}</h2>
            <p style={s.subtitle}>Asigna items a viewers vinculados o a ti mismo (HU-09).</p>

            {message.text && (
                <div style={message.type === 'error' ? s.msgError : s.msgSuccess}>
                    {message.text}
                </div>
            )}

            {/* Crear item */}
            <div style={s.card}>
                <div style={s.sectionLabel}>NUEVO ITEM</div>
                <form onSubmit={handleCreateItem} style={s.form}>
                    <input
                        type="text"
                        placeholder="Título del item"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        style={s.input}
                    />
                    <input
                        type="text"
                        placeholder="Descripción (opcional)"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        style={s.input}
                    />
                    <button type="submit" style={s.btnPrimary}>Crear</button>
                </form>
            </div>

            {/* Lista de items */}
            <div style={s.card}>
                <div style={s.sectionLabel}>ITEMS ({items.length})</div>
                {items.length === 0 ? (
                    <div style={s.emptyMsg}>Sin items todavía.</div>
                ) : (
                    <table style={s.table}>
                        <thead>
                            <tr>
                                <th style={s.th}>Título</th>
                                <th style={s.th}>Descripción</th>
                                <th style={s.th}>Responsable</th>
                                <th style={s.th}>Reasignar</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id_work_item}>
                                    <td style={s.td}>{item.title}</td>
                                    <td style={s.tdMuted}>{item.description || '—'}</td>
                                    <td style={s.td}>
                                        {item.assignee
                                            ? <span>{item.assignee.username}</span>
                                            : <span style={s.unassigned}>Sin asignar</span>}
                                    </td>
                                    <td style={s.td}>
                                        <select
                                            value={item.assignee_id || ''}
                                            onChange={(e) => handleAssign(item.id_work_item, e.target.value)}
                                            style={s.select}
                                        >
                                            <option value="">— Sin asignar —</option>
                                            {assignableUsers.map(u => (
                                                <option key={u.id_user} value={u.id_user}>
                                                    {u.username}
                                                </option>
                                            ))}
                                        </select>
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

const s = {
    title: { fontSize: 22, fontWeight: 700, marginBottom: 4 },
    subtitle: { fontSize: 13, color: '#888', marginBottom: 24 },
    backBtn: { marginBottom: 16, padding: '6px 12px', backgroundColor: 'transparent', border: '1px solid #D0D0CE', borderRadius: 4, fontSize: 12, cursor: 'pointer' },
    loading: { padding: 24, textAlign: 'center', color: '#888' },
    msgError: { padding: '10px 14px', backgroundColor: '#FFF5F5', border: '1px solid #FFCDD2', borderRadius: 4, color: '#B71C1C', fontSize: 13, marginBottom: 16 },
    msgSuccess: { padding: '10px 14px', backgroundColor: '#F1F8E9', border: '1px solid #C5E1A5', borderRadius: 4, color: '#33691E', fontSize: 13, marginBottom: 16 },
    card: { backgroundColor: '#FFF', border: '1px solid #E8E8E6', borderRadius: 6, padding: 20, marginBottom: 16 },
    sectionLabel: { fontSize: 11, fontWeight: 600, color: '#555', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 },
    form: { display: 'flex', gap: 8 },
    input: { flex: 1, height: 32, padding: '0 10px', fontSize: 13, border: '1px solid #E0E0DE', borderRadius: 4, backgroundColor: '#FAFAFA' },
    btnPrimary: { height: 32, padding: '0 16px', backgroundColor: '#1A1A1A', color: '#FFF', border: 'none', borderRadius: 4, fontSize: 12, cursor: 'pointer' },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    th: { textAlign: 'left', padding: '8px 6px', borderBottom: '1px solid #E8E8E6', fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.04em' },
    td: { padding: '10px 6px', borderBottom: '1px solid #F5F5F4' },
    tdMuted: { padding: '10px 6px', borderBottom: '1px solid #F5F5F4', color: '#888' },
    unassigned: { color: '#AAA', fontStyle: 'italic' },
    select: { height: 28, padding: '0 6px', fontSize: 12, border: '1px solid #E0E0DE', borderRadius: 4, backgroundColor: '#FAFAFA' },
    emptyMsg: { fontSize: 13, color: '#AAA', padding: '8px 0' },
};

export default WorkItems;