import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuthContext } from '../context/AuthContext';

export default function AppLayout() {
    const { logout } = useAuthContext();
    const navigate = useNavigate();

    async function handleLogout() {
        await logout();
        navigate('/login', { replace: true });
    }

    return (
        <div style={{ display:'flex', minHeight:'100vh', width:'100%', backgroundColor:'#F5F5F4' }}>
            <Sidebar onLogout={handleLogout} />
            <main style={{ flex:1, minWidth:0, overflowX:'hidden' }}>
                <Outlet />
            </main>
        </div>
    );
}