import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuthContext();
    const location = useLocation();

    // KEY FIX: while loading we show a splash — never redirect early.
    // This is exactly what caused the "refresh sends to login" bug.
    if (loading) {
        return (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', backgroundColor:'#F5F5F4' }}>
                <div style={{ width:10, height:10, borderRadius:'50%', backgroundColor:'#CC0000' }} />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (roles && roles.length > 0 && !roles.includes(user.role)) {
        return <Navigate to="/projects" replace />;
    }

    return children;
}