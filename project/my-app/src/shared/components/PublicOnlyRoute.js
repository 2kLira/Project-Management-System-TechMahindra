import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

export default function PublicOnlyRoute({ children }) {
    const { user, loading } = useAuthContext();
    const location = useLocation();

    if (loading) return null;

    if (user) {
        const destination = location.state?.from?.pathname || '/projects';
        return <Navigate to={destination} replace />;
    }

    return children;
}