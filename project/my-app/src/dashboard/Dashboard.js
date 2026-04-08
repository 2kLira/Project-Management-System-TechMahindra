import { useState, useEffect } from 'react';
import ProjectViewers from '../projects/ProjectViewers';

const API_URL = 'http://localhost:8080';

function Dashboard({ onLogin }){
    const [projects, setProjects] = useState([]);
    const [userRole, setUserRole] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    async function fetchProjects() {
        try {
            const response = await fetch(`${API_URL}/projects/my-projects`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (response.ok) {
                setProjects(data.projects || []);
                if (data.projects && data.projects.length > 0) {
                    setUserRole(data.projects[0].role);
                }
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    }

    async function log_out(){
        await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        onLogin();
    }

    if (selectedProject) {
        return (
            <ProjectViewers 
                projectId={selectedProject.id_project}
                projectName={selectedProject.name}
                onBack={() => setSelectedProject(null)}
            />
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>Dashboard</h1>
                <button onClick={log_out} className="logout-btn">Log out</button>
            </div>

            <div className="projects-section">
                <h2>My Projects</h2>
                
                {loading ? (
                    <p>Loading projects...</p>
                ) : projects.length === 0 ? (
                    <p className="no-data">No projects assigned</p>
                ) : (
                    <div className="projects-grid">
                        {projects.map(project => (
                            <div key={project.id_project} className="project-card">
                                <h3>{project.name}</h3>
                                <p>{project.description || 'No description'}</p>
                                <div className="project-meta">
                                    <span className={`role-badge ${project.role}`}>
                                        {project.role.toUpperCase()}
                                    </span>
                                    <span className="date">
                                        {new Date(project.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                                {project.role === 'pm' && (
                                    <button 
                                        onClick={() => setSelectedProject(project)}
                                        className="manage-viewers-btn"
                                    >
                                        Manage Viewers
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
export default Dashboard;