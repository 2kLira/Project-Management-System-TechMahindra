import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8080';

function ProjectViewers({ projectId, projectName, onBack }) {
  const [viewers, setViewers] = useState([]);
  const [availableViewers, setAvailableViewers] = useState([]);
  const [selectedViewer, setSelectedViewer] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchViewers();
    fetchAvailableViewers();
  }, [projectId]);

  async function fetchViewers() {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/viewers`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setViewers(data.viewers || []);
      }
    } catch (error) {
      console.error('Error fetching viewers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAvailableViewers() {
    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/available-viewers`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok) {
        setAvailableViewers(data.viewers || []);
      }
    } catch (error) {
      console.error('Error fetching available viewers:', error);
    }
  }

  async function handleAddViewer(e) {
    e.preventDefault();
    if (!selectedViewer) {
      setMessage({ text: 'Please select a viewer', type: 'error' });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/viewers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: parseInt(selectedViewer) })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ text: 'Viewer added successfully', type: 'success' });
        setSelectedViewer('');
        fetchViewers();
        fetchAvailableViewers();
      } else {
        setMessage({ text: data.message || 'Error adding viewer', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error connecting to server', type: 'error' });
    }
  }

  async function handleRemoveViewer(userId) {
    if (!window.confirm('Are you sure you want to remove this viewer?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/projects/${projectId}/viewers/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setMessage({ text: 'Viewer removed successfully', type: 'success' });
        fetchViewers();
        fetchAvailableViewers();
      } else {
        const data = await response.json();
        setMessage({ text: data.message || 'Error removing viewer', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'Error connecting to server', type: 'error' });
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="project-viewers">
      <button onClick={onBack} className="back-btn">← Back to Projects</button>
      
      <h2>Manage Viewers - {projectName}</h2>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="add-viewer-section">
        <h3>Add Viewer</h3>
        <form onSubmit={handleAddViewer}>
          <select 
            value={selectedViewer} 
            onChange={(e) => setSelectedViewer(e.target.value)}
          >
            <option value="">Select a viewer...</option>
            {availableViewers.map(viewer => (
              <option key={viewer.id} value={viewer.id}>
                {viewer.username} ({viewer.email})
              </option>
            ))}
          </select>
          <button type="submit" disabled={!selectedViewer}>
            Add Viewer
          </button>
        </form>
        {availableViewers.length === 0 && (
          <p className="no-data">No available viewers to add</p>
        )}
      </div>

      <div className="viewers-list-section">
        <h3>Current Viewers ({viewers.length})</h3>
        {viewers.length === 0 ? (
          <p className="no-data">No viewers assigned to this project</p>
        ) : (
          <table className="viewers-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {viewers.map(viewer => (
                <tr key={viewer.id}>
                  <td>{viewer.username}</td>
                  <td>{viewer.email}</td>
                  <td>{new Date(viewer.addedAt).toLocaleDateString()}</td>
                  <td>
                    <button 
                      onClick={() => handleRemoveViewer(viewer.id)}
                      className="remove-btn"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default ProjectViewers;
