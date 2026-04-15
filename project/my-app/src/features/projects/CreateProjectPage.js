import { useNavigate } from 'react-router-dom';
import CreateProject from './CreateProject';

export default function CreateProjectPage() {
    const navigate = useNavigate();
    return <CreateProject onCancel={() => navigate('/projects')} />;
}