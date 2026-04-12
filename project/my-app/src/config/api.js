const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const safeJson = (res) => res.json().catch(() => ({}));

const api = {
    get: async (path) => {
        const res = await fetch(`${BASE_URL}${path}`, {
            credentials: 'include',
        });
        return { res, data: await safeJson(res) };
    },

    post: async (path, body) => {
        const res = await fetch(`${BASE_URL}${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
        });
        return { res, data: await safeJson(res) };
    },

    put: async (path, body) => {
        const res = await fetch(`${BASE_URL}${path}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(body),
        });
        return { res, data: await safeJson(res) };
    },

    delete: async (path) => {
        const res = await fetch(`${BASE_URL}${path}`, {
            method: 'DELETE',
            credentials: 'include',
        });
        return { res, data: await safeJson(res) };
    },
};

export default api;
