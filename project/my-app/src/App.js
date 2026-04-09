import { useState } from 'react';
import Login from './auth/Login';
import Dashboard from './dashboard/Dashboard';
import './App.css';
 
 
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
 
  function handleLogin() {
    setIsLoggedIn(true);
  }
 
  function handleLogout() {
    setIsLoggedIn(false);
  }
 
  // =====================================================
  // Cuando el usuario YA está logeado => layout del app
  // (sidebar propio por vista, sin el grid 1fr 2fr del login)
  // =====================================================
  if (isLoggedIn) {
    return (
      <div className="app-layout-app">
        <Dashboard onLogout={handleLogout} />
      </div>
    );
  }
 
  // =====================================================
  // Cuando NO está logeado => layout de login/register
  // (grid con aside promocional + formulario)
  // =====================================================
  return (
    <div className="app-layout-auth">
      <aside className='app-aside'>
        <div className='app-brand'>
          <div className='app-box'></div>
          <div className='app-businessname'>
            <h6 style={{ color: 'white' }}>Tech</h6>
            <h5 style={{ color: '#E31837' }}>mahindra</h5>
          </div>
        </div>
        <div className='app-middle'>
          <div className='app-title'>
            <h1 style={{ color: 'white' }}>Project</h1>
            <h1 style={{ color: '#E31837' }}>Management</h1>
            <h1 style={{ color: 'white' }}>System</h1>
          </div>
          <div className='app-description'>
            <p style={{ color: '#F6F2EA99' }}>Real-time Scrum tracking with automated risk scoring, progress monitoring, and team gamification.</p>
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
 
      <main className='app-content'>
        <Login onLogin={handleLogin} />
      </main>
    </div>
  );
}
 
export default App;