import { useState } from 'react';
import Login from './auth/Login';
import Register from './auth/Register';
import Dashboard from './dashboard/Dashboard'; 

function App() {
  const [mode, setMode] = useState('login');
  const [isLoggedIn, setIsLoggedIn] = useState(false); 

  function handleLogin(){
    setIsLoggedIn(true)
  }

  function handleLogout(){
    setIsLoggedIn(false)
  }
  
  return (
    <div className="auth-box">
      {!isLoggedIn ? (
        <>
          <button onClick={() => setMode('login')}>Login</button>
          <button onClick={() => setMode('register')}>Register</button>
          {mode === 'login' ? <Login onLogin={handleLogin} /> : <Register />}
        </>
      ) : (
        <Dashboard onLogin={handleLogout}/>
      )}
    </div>
  );
}

export default App;
