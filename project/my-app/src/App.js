import { useState } from 'react';

function App() {
  const [mensaje, setMensaje] = useState('');

  async function regsiter(){
    const email = document.getElementById('Email').value;
    const username = document.getElementById('Username').value;
    const password = document.getElementById('Password').value;

    const response = await fetch('http://localhost:8080/register',{
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
    console.log(data);
  }
  return (
    <div>
      <h1>Register now</h1>
        <div>
            <label for="Email">Email</label>
            <input type ="text" id="Email" name="Email" />
        </div>
        <div class>
            <label for="Name">Username</label>
            <input type ="text" id="Username" name="Username" />
        </div>
        <div>
            <label for="Password">Password</label>
            <input type ="text" id="Password" name="Password" />
        </div>
        <div>
            <button onClick={regsiter}>Sign up</button>
        </div>
        <p>{mensaje}</p>
    </div>
  );
}

export default App;
