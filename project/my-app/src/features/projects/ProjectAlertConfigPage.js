import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../config/api';
import './ProjectAlertConfigPage.css';

const DEFAULTS = {
    notify_to_yellow:     true,
    notify_to_red:        true,
    notify_score_jump:    true,
    score_jump_threshold: 15,
};

export default function ProjectAlertConfigPage() {
    const { id } = useParams();

    const [form, setForm]       = useState(DEFAULTS);
    const [saved, setSaved]     = useState(DEFAULTS);
    const [loading, setLoading] = useState(true);
    const [error, setError]     = useState('');
    const [success, setSuccess] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        const { res, data } = await api.get(`/projects/${id}/alert-config`);
        if (res.ok) {
            const cfg = {
                notify_to_yellow:     !!data.notify_to_yellow,
                notify_to_red:        !!data.notify_to_red,
                notify_score_jump:    !!data.notify_score_jump,
                score_jump_threshold: Number(data.score_jump_threshold ?? 15),
            };
            setForm(cfg);
            setSaved(cfg);
        } else {
            setError(data.message || 'No se pudo cargar la configuración');
        }
        setLoading(false);
    }, [id]);

    useEffect(() => { load(); }, [load]);

    function toggle(key) {
        setForm(f => ({ ...f, [key]: !f[key] }));
    }

    function onThreshold(e) {
        const v = parseInt(e.target.value, 10);
        setForm(f => ({ ...f, score_jump_threshold: Number.isNaN(v) ? '' : v }));
    }

    const thresholdInvalid =
        form.score_jump_threshold === '' ||
        form.score_jump_threshold < 5 ||
        form.score_jump_threshold > 50;

    async function onSave(e) {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (thresholdInvalid) {
            setError('El umbral debe estar entre 5 y 50.');
            return;
        }
        const { res, data } = await api.put(`/projects/${id}/alert-config`, form);
        if (res.ok) {
            setSaved(form);
            setSuccess('Configuración guardada.');
            setTimeout(() => setSuccess(''), 3000);
        } else {
            setError(data.message || 'No se pudo guardar la configuración');
        }
    }

    function onCancel() {
        setForm(saved);
        setError('');
        setSuccess('');
    }

    if (loading) return <div className="pac-page"><p className="pac-loading">Cargando…</p></div>;

    return (
        <div className="pac-page">
            <div className="pac-card">
                <h1 className="pac-title">Configuración de alertas</h1>
                <p className="pac-help">
                    Estas alertas notifican al PM del proyecto y a todos los administradores
                    cuando el riesgo del proyecto cambia.
                </p>

                <form onSubmit={onSave}>
                    <label className="pac-check">
                        <input
                            type="checkbox"
                            checked={form.notify_to_yellow}
                            onChange={() => toggle('notify_to_yellow')}
                        />
                        Notificar cuando el semáforo cambie a amarillo
                    </label>

                    <label className="pac-check">
                        <input
                            type="checkbox"
                            checked={form.notify_to_red}
                            onChange={() => toggle('notify_to_red')}
                        />
                        Notificar cuando el semáforo cambie a rojo
                    </label>

                    <label className="pac-check">
                        <input
                            type="checkbox"
                            checked={form.notify_score_jump}
                            onChange={() => toggle('notify_score_jump')}
                        />
                        Notificar cuando el score suba
                    </label>

                    <div className="pac-threshold">
                        <label htmlFor="pac-th">Umbral de aumento (puntos):</label>
                        <input
                            id="pac-th"
                            type="number"
                            min={5}
                            max={50}
                            value={form.score_jump_threshold}
                            onChange={onThreshold}
                            disabled={!form.notify_score_jump}
                        />
                        <span className="pac-range">(5–50)</span>
                    </div>

                    {error   && <p className="pac-error">{error}</p>}
                    {success && <p className="pac-success">{success}</p>}

                    <div className="pac-actions">
                        <button type="button" className="pac-btn pac-btn-ghost" onClick={onCancel}>
                            Cancelar
                        </button>
                        <button type="submit" className="pac-btn pac-btn-primary" disabled={thresholdInvalid}>
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
