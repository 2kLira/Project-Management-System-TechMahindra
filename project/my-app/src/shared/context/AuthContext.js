import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const verify = useCallback(async () => {
        try {
            const { res, data } = await api.get('/auth/verify');
            if (res.ok) {
                setUser({ id: data.user.id, role: data.user.role, username: data.user.username });
            } else {
                setUser(null);
            }
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { verify(); }, [verify]);

    const login = useCallback(async (credentials) => {
        const { res, data } = await api.post('/auth/login', credentials);
        if (res.ok) {
            setUser({ id: data.id_user, role: data.role, username: data.username });
            return { ok: true };
        }
        return { ok: false, message: data.message || 'Credenciales incorrectas' };
    }, []);

    const logout = useCallback(async () => {
        await api.post('/auth/logout');
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
    return ctx;
}