import { useState } from 'react';


function Login({onLogin}) {
  const [mensaje, setMensaje] = useState('');

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