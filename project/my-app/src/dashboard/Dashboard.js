import { useState, useEffect } from 'react';
import CreateProject from './CreateProject';

function Dashboard({ onLogin }) {
    const [projects, setProjects] = useState([]);
    const [view, setView] = useState('dashboard');

    async function log_out() {
        await fetch('http://localhost:8080/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        onLogin();
    }

    useEffect(() => {
        fetch('http://localhost:8080/projects')
            .then(res => res.json())
            .then(data => {
                console.log('Projects:', data);
                setProjects(data);
            })
            .catch(err => console.error(err));
    }, []);

    if (view === 'create') {
        return <CreateProject onCancel={() => setView('dashboard')} />;
    }

    return (
        <div>
            <button onClick={log_out}>Log out</button>
            <h1>Login success</h1>

            <button onClick={() => setView('create')}>
                Create Project
            </button>

            <h2>Projects</h2>

            {projects.length === 0 ? (
                <p>No hay proyectos</p>
            ) : (
                <ul>
                    {projects.map(project => (
                        <li key={project.id_project}>
                            {project.project_name} - {project.client_name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default Dashboard;