import { useState, useEffect } from 'react';
import './Login.css'; 


function Login({onLogin}) {
  const [form, setForm] = useState({ email_user: '', password: '' });
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {

    async function checktoken(){
      try {
        const response_token = await fetch('http://localhost:8080/auth/verify', {
          method: 'GET',
          credentials: 'include'
        });
        if (response_token.ok){
          const data = await response_token.json();
          console.log("Login with JWT success");
          onLogin({ id: data.user.id, role: data.user.role, username: data.user.username });
        }
      } catch (error){
        console.error(error);
      }
    }
    checktoken();
  }, [onLogin])

  async function login_proccess(){
    console.log("Login proccess working...")

    const response = await fetch('http://localhost:8080/auth/login',{
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form)
    })

    console.log("Status:", response.status)

    const data = await response.json();
    console.log("Data:", data)

    if (response.ok){
      onLogin({ id: data.id_user, role: data.role, username: data.username });
    }
    else{      
      setMensaje('Login fail');
    } 
    console.log(data);
  }

  return (
    <div className='login-layout'>
    <main className='login-form'>
    
      <h1>Sign in</h1>
      <div className=''>
        <label className='login-credential' htmlFor="EmailUsername">EMAIL ADRESS OR USERNAME</label>
        <input 
        className='login-input'
          type ="text" 
          id="EmailUsername" 
          name="email_user"
          value={form.email_user}
          onChange={(e) => setForm({ ...form, email_user: e.target.value })}
          />
      </div>
      <div>
        <label className='login-credential' htmlFor="Password">PASSWORD</label>
        <input
          className='login-input' 
          type ="password" 
          id="Password" 
          name="password" 
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
      </div>
        <button className='login-button' onClick={login_proccess}>Login</button>
        <p>{mensaje}</p>
    </main>
    </div>
  );
}

export default Login;