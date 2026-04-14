import { useState } from 'react';
import './Login.css';
import api from '../../config/api';
import { useNavigate } from "react-router-dom";


function Login() {
    const [form, setForm] = useState({ email_user: '', password: '' });
    const [mensaje, setMensaje] = useState('');
    const navigate = useNavigate()

    async function login_proccess() {
        console.log(form)
        const result = await api.post('/auth/login', form);
        console.log(result)
        if (result.res.status === 200){
            navigate('/menu/dashboard')
        } else {
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
