import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import './Login.css'; 


function Login() {
  const [form, setForm] = useState({ email_user: '', password: '' });
  const [mensaje, setMensaje] = useState('');
  const { setUser } = useUser();    
  const navigate = useNavigate();

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
          setUser({ id: data.user.id, role: data.user.role, username: data.user.username }); 
          navigate('/dashboard');
        }
      } catch (error){
        console.error(error);
      }
    }
    checktoken();
  }, 
  // eslint-disable-next-line
  [])
  

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
      setUser({ id: data.id_user, role: data.role, username: data.username }); 
      navigate('/dashboard');       
    }
    else{      
      setMensaje('Login fail');
    } 
    console.log(data);
  }

  return (
    <div className="app-layout-auth">
      <aside className='app-aside'>
        <div className='app-brand'>
          <div className='app-box'></div>
          <div className='app-businessname'>
            <h6 style={{color: 'white'}}>Tech</h6>
            <h5 style={{color: '#E31837'}}>mahindra</h5>
          </div>
        </div>
        <div className='app-middle'>
          <div className='app-title'>
            <h1 style={{color: 'white'}}>Project</h1>
            <h1 style={{color: '#E31837'}}>Management</h1>
            <h1 style={{color: 'white'}}>System</h1>
          </div>
          <div className='app-description'>
            <p style={{color: '#F6F2EA99'}}>Real-time Scrum tracking with automated risk scoring, progress monitoring, and team gamification.</p>
          </div>
          <div className='app-decorativelineal app-decorative-position1'></div>
          <div className='app-decorativelineal app-decorative-position2'></div>
          <div className='app-decorativelineal app-decorative-position3'></div>
          <div className='app-decorativelineal app-decorative-position4'></div>
          <div className='app-decorativelineal app-decorative-position5'></div>
          <div className='app-decorativelineal app-decorative-position6'></div>
        </div>
        <ul className='app-list'>
          <li>Real-time risk score & semaphore</li>
          <li>Planned vs Actual progress charts</li>
          <li>Sprint & backlog management</li>
          <li>Team gamification & leaderboard</li>
          <li>Automated alerts & audit log</li>
        </ul>
      </aside>
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
    </div>
  );
}

export default Login;