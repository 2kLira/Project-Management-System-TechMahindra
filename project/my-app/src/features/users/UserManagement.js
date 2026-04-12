import React, { useEffect, useState, useCallback } from 'react';
import api from '../../config/api';
import './UserManagement.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', role: 'viewer' });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const { res, data } = await api.get('/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setUsers([]);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (user, newRole) => {
    if (newRole === user.role?.status) return;
    setSaving(s => ({ ...s, [user.id_user + '_role']: true }));
    const { res } = await api.put(`/users/role/${user.id_user}`, { role: newRole });
    setSaving(s => ({ ...s, [user.id_user + '_role']: false }));
    if (res.ok) {
      showToast(`Role updated to ${newRole}`);
      fetchUsers();
    } else {
      showToast('Failed to update role', 'error');
    }
  };

  const handleStatusChange = async (user, newStatus) => {
    if (newStatus === user.status) return;
    setSaving(s => ({ ...s, [user.id_user + '_status']: true }));
    const { res } = await api.put(`/users/status/${user.id_user}`, { status: newStatus });
    setSaving(s => ({ ...s, [user.id_user + '_status']: false }));
    if (res.ok) {
      showToast(`User ${newStatus === 'Active' ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } else {
      showToast('Failed to update status', 'error');
    }
  };

  const handleCreateUser = async () => {
    if (!form.full_name.trim() || !form.email.trim()) {
      showToast('Full name and email are required', 'error');
      return;
    }
    const { res, data } = await api.post('/users', form);
    if (!res.ok) {
      if (data.errors?.length > 0) {
        showToast(data.errors.map(e => e.message).join(' · '), 'error');
      } else {
        showToast(data.error || data.message || 'Error creating user', 'error');
      }
      return;
    }
    showToast('User created successfully');
    setForm({ full_name: '', email: '', role: 'viewer' });
    setShowForm(false);
    fetchUsers();
  };

  const filteredUsers = users.filter(u =>
    (u.full_name || u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = users.length;
  const totalPM = users.filter(u => u.role?.status === 'pm').length;
  const totalViewers = users.filter(u => u.role?.status === 'viewer').length;

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('es-MX', {
      timeZone: 'America/Monterrey',
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const getInitials = (name, email) => {
    if (name && name !== 'N/A') return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return (email || '?')[0].toUpperCase();
  };

  return (
    <div className="um-container">
      {toast && (
        <div className={`um-toast um-toast--${toast.type}`}>
          <span className="um-toast__icon">{toast.type === 'success' ? '✓' : '✕'}</span>
          <span className="um-toast__msg">{toast.message}</span>
          <button className="um-toast__close" onClick={() => setToast(null)}>×</button>
        </div>
      )}

      {/* Header */}
      <div className="um-header">
        <div>
          <h1 className="um-title">User Management</h1>
          <p className="um-subtitle">{totalUsers} users across {totalPM} PMs and {totalViewers} viewers</p>
        </div>
        <button className="um-btn-primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ New User'}
        </button>
      </div>

      {/* Stats */}
      <div className="um-stats">
        <div className="um-stat">
          <span className="um-stat__value">{totalUsers}</span>
          <span className="um-stat__label">Total Users</span>
        </div>
        <div className="um-stat-divider" />
        <div className="um-stat">
          <span className="um-stat__value">{totalPM}</span>
          <span className="um-stat__label">Project Managers</span>
        </div>
        <div className="um-stat-divider" />
        <div className="um-stat">
          <span className="um-stat__value">{totalViewers}</span>
          <span className="um-stat__label">Viewers</span>
        </div>
        <div className="um-stat-divider" />
        <div className="um-stat">
          <span className="um-stat__value">{users.filter(u => u.status === 'Active').length}</span>
          <span className="um-stat__label">Active</span>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="um-form-card">
          <h3 className="um-form-title">New User</h3>
          <div className="um-form-grid">
            <div className="um-field">
              <label className="um-label">Full Name</label>
              <input
                className="um-input"
                placeholder="e.g. Mario Burgos"
                value={form.full_name}
                onChange={e => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            <div className="um-field">
              <label className="um-label">Email</label>
              <input
                className="um-input"
                placeholder="e.g. mario@tec.mx"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="um-field">
              <label className="um-label">Role</label>
              <select
                className="um-input"
                value={form.role}
                onChange={e => setForm({ ...form, role: e.target.value })}
              >
                <option value="admin">Administrator</option>
                <option value="pm">Project Manager</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>
          <div className="um-form-footer">
            <p className="um-form-hint">Default password: <code>ChangeMe123!</code></p>
            <button className="um-btn-primary" onClick={handleCreateUser}>Create User</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="um-search-row">
        <div className="um-search-wrap">
          <span className="um-search-icon">⌕</span>
          <input
            className="um-search"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <span className="um-count">{filteredUsers.length} of {totalUsers}</span>
      </div>

      {/* Table */}
      <div className="um-table-wrap">
        <table className="um-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id_user} className="um-row">
                <td className="um-cell-user">
                  <div className="um-avatar">{getInitials(u.full_name, u.email)}</div>
                  <div className="um-user-info">
                    <span className="um-user-name">{u.full_name && u.full_name !== 'N/A' ? u.full_name : u.email}</span>
                    <span className="um-user-email">{u.full_name && u.full_name !== 'N/A' ? u.email : ''}</span>
                  </div>
                </td>
                <td>
                  <select
                    className={`um-select-role um-role--${u.role?.status || 'default'} ${saving[u.id_user + '_role'] ? 'um-saving' : ''}`}
                    value={u.role?.status || ''}
                    onChange={e => handleRoleChange(u, e.target.value)}
                    disabled={saving[u.id_user + '_role']}
                  >
                    <option value="admin">Admin</option>
                    <option value="pm">PM</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </td>
                <td>
                  <select
                    className={`um-select-status um-status--${u.status} ${saving[u.id_user + '_status'] ? 'um-saving' : ''}`}
                    value={u.status || 'Active'}
                    onChange={e => handleStatusChange(u, e.target.value)}
                    disabled={saving[u.id_user + '_status']}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </td>
                <td className="um-cell-date">{formatDate(u.last_login)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="um-empty">No users match your search.</div>
        )}
      </div>
    </div>
  );
}
