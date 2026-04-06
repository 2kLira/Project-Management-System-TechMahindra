import { useState, useEffect } from 'react';


function Login({onLogin}) {
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) return; 

    async function checktoken(){
      try {
      const response_token = await fetch('http://localhost:8080/auth/verify', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'   
        }
      })

      if (response_token.ok){
        console.log("Login with JWT success")
        onLogin();
      }
      else {
        localStorage.removeItem('token')
        localStorage.removeItem('username')
      }
    } catch (error){
      console.error(error)
    }
    }
    checktoken();
  }, [onLogin])

  async function login_proccess(){
    console.log("Login proccess working...")
    const email_user = document.getElementById('EmailUsername').value;
    const password = document.getElementById('Password').value;

    console.log("Datos:", { email_user, password })

    const response = await fetch('http://localhost:8080/auth/login',{
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email_user, password })
    })

    console.log("Status:", response.status)

    const data = await response.json();
    console.log("Data:", data)

    if (response.ok){
      localStorage.setItem('token', data.token)
      localStorage.setItem('username', data.username)
      onLogin();
    }
    else{      
      setMensaje('Login fail');
    } 
    console.log(data);
  }

  return (
    <div>
      <h1>Login</h1>
      <div>
            <label htmlFor="EmailUsername">Email or username</label>
            <input type ="text" id="EmailUsername" name="EmailUsername"/>
        </div>
        <div>
            <label htmlFor="Password">Password</label>
            <input type ="password" id="Password" name="Password" />
        </div>
        <div>
            <button onClick={login_proccess}>Login</button>
        </div>
        <p>{mensaje}</p>
    </div>
  );
}

export default Login;