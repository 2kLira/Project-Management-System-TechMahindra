import { useState } from 'react';

function Register() {
  const [mensaje, setMensaje] = useState('');


  async function register_process(){
    try {
      const email = document.getElementById('Email').value;
      const username = document.getElementById('Username').value;
      const password = document.getElementById('Password').value;

      const response = await fetch('http://localhost:8080/auth/register',{
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password })
      })
      const data = await response.json();

      if (response.ok){
        setMensaje('Register success');
      }
      else{      
        setMensaje('Register fail');
      } 

    } catch(error){
      console.error("Error:", error);
      setMensaje('Error de conexión');
    }
  }
  return (
    <div>
      <h1>Register now</h1>
        <div>
            <label htmlFor="Email">Email</label>
            <input type ="text" id="Email" name="Email" />
        </div>
        <div class>
            <label htmlFor="Name">Username</label>
            <input type ="text" id="Username" name="Username" />
        </div>
        <div>
            <label htmlFor="Password">Password</label>
            <input type ="password" id="Password" name="Password" />
        </div>
        <div>
            <button onClick={register_process}>Sign up</button>
        </div>
        <p>{mensaje}</p>
    </div>
  );
}

export default Register;

