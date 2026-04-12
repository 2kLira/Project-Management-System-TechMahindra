import { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
    const [form, setForm] = useState({ email_user: '', password: '' });
    const [mensaje, setMensaje] = useState('');

    async function login_proccess() {
        const result = await onLogin(form);
        if (!result.ok) {
            setMensaje('Credenciales incorrectas. Intenta de nuevo.');
        }
    }

    return (
        <div className='login-layout'>
            <main className='login-form'>
                <h1>Iniciar sesión</h1>
                <div>
                    <label className='login-credential' htmlFor="EmailUsername">CORREO O USUARIO</label>
                    <input
                        className='login-input'
                        type="text"
                        id="EmailUsername"
                        name="email_user"
                        value={form.email_user}
                        onChange={(e) => setForm({ ...form, email_user: e.target.value })}
                    />
                </div>
                <div>
                    <label className='login-credential' htmlFor="Password">CONTRASEÑA</label>
                    <input
                        className='login-input'
                        type="password"
                        id="Password"
                        name="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                </div>
                <button className='login-button' onClick={login_proccess}>Entrar</button>
                <p>{mensaje}</p>
            </main>
        </div>
    );
}

export default Login;
