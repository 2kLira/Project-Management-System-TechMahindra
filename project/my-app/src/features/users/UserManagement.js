import React, { useEffect, useState, useCallback } from 'react';
import api from '../../config/api';
import './UserManagement.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    role: 'viewer'
  });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchUsers = async () => {
    try {
      const { res, data } = await api.get('/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching users:", err);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async () => {
    const { res, data } = await api.post('/users', form);

    if (!res.ok) {
      showToast(data.error || data.message || 'Error creating user', 'error');
      return;
    }

    showToast('User created successfully');
    setForm({ full_name: '', email: '', role: 'viewer' });
    fetchUsers();
  };

  const toggleStatus = async (user) => {
    const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    const { res } = await api.put(`/users/status/${user.id_user}`, { status: newStatus });
    if (res.ok) {
      showToast(`User ${newStatus === 'Active' ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } else {
      showToast('Error updating status', 'error');
    }
  };

  const changeRole = async (user) => {
    const newRole = prompt("Enter role: admin, pm, viewer", user.role?.status);
    if (!newRole) return;

    await api.put(`/users/role/${user.id_user}`, { role: newRole, changed_by: "AdminUser" });

    fetchUsers();
  };

  const filteredUsers = users.filter(u =>
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = users.length;
  const totalPM = users.filter(u => u.role?.status === 'pm').length;
  const totalViewers = users.filter(u => u.role?.status === 'viewer').length;

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('es-MX', {
      timeZone: 'America/Monterrey',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="users-container">
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          <span className="toast-icon">{toast.type === 'success' ? '✓' : '✕'}</span>
          <span className="toast-message">{toast.message}</span>
          <button className="toast-close" onClick={() => setToast(null)}>×</button>
        </div>
      )}
      <div className="users-header">
        <h1>User Management</h1>
      </div>

      <div className="cards">
        <div className="card">
          <h3>Total Users</h3>
          <h2>{totalUsers}</h2>
          <p>3 roles assigned</p>
        </div>
        <div className="card">
          <h3>Project Managers</h3>
          <h2>{totalPM}</h2>
          <p>Managing projects</p>
        </div>
        <div className="card">
          <h3>Viewers</h3>
          <h2>{totalViewers}</h2>
          <p>Operational users</p>
        </div>
      </div>

      <h2>All Users</h2>
      <input
        className="search"
        placeholder="Search"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id_user}>
                <td>{u.full_name || 'N/A'}</td>
                <td>{u.email || ''}</td>
                <td>
                  <span className={`role-badge ${u.role?.status || 'default'}`}>
                    {u.role?.status || 'N/A'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${u.status}`}>
                    {u.status}
                  </span>
                </td>
                <td>{formatDate(u.last_login)}</td>
                <td>
                  <button onClick={() => changeRole(u)}>Edit</button>
                  <button onClick={() => toggleStatus(u)}>
                    {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Create New User</h2>
      <div className="form">
        <input
          placeholder="Full Name"
          value={form.full_name}
          onChange={e => setForm({ ...form, full_name: e.target.value })}
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        <select
          value={form.role}
          onChange={e => setForm({ ...form, role: e.target.value })}
        >
          <option value="admin">Administrator</option>
          <option value="pm">Project Manager</option>
          <option value="viewer">Viewer</option>
        </select>
        <button onClick={handleCreateUser}>Create User</button>
      </div>
    </div>
  );
}
