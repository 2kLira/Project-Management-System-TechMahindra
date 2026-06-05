// WebSocket de la app.
// - En prod (HTTPS): same-origin -> wss://<host>/ws, y Caddy lo proxya al WS del backend.
// - En local (HTTP): ws://localhost:8081 (el WsServer local).
// - Override opcional con REACT_APP_WS_URL.
function resolveWsUrl() {
    if (process.env.REACT_APP_WS_URL) return process.env.REACT_APP_WS_URL;
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
        return `wss://${window.location.host}/ws`;
    }
    return 'ws://localhost:8081';
}

const ws = new WebSocket(resolveWsUrl());

export default ws;
