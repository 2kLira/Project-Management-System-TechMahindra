const ws = new WebSocket(process.env.REACT_APP_WS_API_URL || 'ws://localhost:8080/ws');
ws.onopen = () => console.log('✅ CONECTADO');
ws.onerror = (err) => console.log('❌ ERROR:', err);

export default ws;