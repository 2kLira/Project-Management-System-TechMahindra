import { useState, useEffect, useCallback } from 'react';
import api from '../../config/api';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkToken = useCallback(async () => {
        try {
            const { res, data } = await api.get('/auth/verify');
            if (res.ok) {
                setUser({ id: data.user.id, role: data.user.role, username: data.user.username });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkToken();
    }, [checkToken]);

    const login = useCallback(async (credentials) => {
        const { res, data } = await api.post('/auth/login', credentials);
        if (res.ok) {
            setUser({ id: data.id_user, role: data.role, username: data.username });
            return { ok: true };
        }
        return { ok: false, message: data.message || 'Login failed' };
    }, []);

    const logout = useCallback(async () => {
        await api.post('/auth/logout');
        setUser(null);
    }, []);

    return { user, loading, login, logout };
}
