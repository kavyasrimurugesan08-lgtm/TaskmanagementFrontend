import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Search, Shield, Building, X, Ban, CheckCircle, Mail, Phone, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ENROLLED_ADMIN_EMAILS } from '../config/authConfig';

export function ManagersPage() {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const isAdmin = user?.role === 'admin' && ENROLLED_ADMIN_EMAILS.includes(user?.email?.toLowerCase());

  const [managers, setManagers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Add Manager modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    phone: '',
    department_id: '',
    designation: '',
    password: 'password123'
  });

  const loadData = async () => {
    try {
      const [mgrRes, deptRes] = await Promise.all([
        api.managers.getAll(),
        api.departments.getAll()
      ]);
      setManagers(mgrRes.managers || []);
      setDepartments(deptRes.departments || []);
    } catch (err) {
      console.error('Failed to load managers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddManager = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email || !addForm.password) return;

    try {
      await api.managers.create({
        ...addForm,
        department_id: addForm.department_id ? Number(addForm.department_id) : null
      });
      setShowAddModal(false);
      setAddForm({ name: '', email: '', phone: '', department_id: '', designation: '', password: 'password123' });
      loadData();
    } catch (err) {
      alert(`Failed to add manager: ${err.message}`);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    if (!window.confirm(`Set manager status to ${nextStatus}?`)) return;

    try {
      await api.managers.toggleStatus(id, nextStatus);
      loadData();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Managers & Department Leads
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
            Authorize supervisors with scoped access to manage assignments and review task deliverables.
          </p>
        </div>

        {isManager && (
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Add Manager</span>
          </button>
        )}
      </div>

      {/* Grid of Managers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '20px',
        }}
      >
        {managers.map((mgr) => (
          <div key={mgr.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {mgr.profile_image ? (
                    <img
                      src={mgr.profile_image}
                      alt=""
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>
                      {mgr.name[0]}
                    </div>
                  )}
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>{mgr.name}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{mgr.designation || 'Team Lead'}</div>
                  </div>
                </div>

                <span className={`badge ${mgr.status === 'active' ? 'badge-approved' : 'badge-cancelled'}`}>
                  {mgr.status}
                </span>
              </div>

              {/* Meta information */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building size={14} color="var(--primary)" />
                  <span>Department: <strong>{mgr.department_name || 'General Management'}</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} color="var(--text-dim)" />
                  <span>{mgr.email}</span>
                </div>
                {mgr.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={14} color="var(--text-dim)" />
                    <span>{mgr.phone}</span>
                  </div>
                )}
              </div>

              {/* Counts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '12px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Assigned Team</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{mgr.assigned_employees_count || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Managed Tasks</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>{mgr.managed_tasks_count || 0}</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            {isAdmin && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
                <button
                  onClick={() => handleToggleStatus(mgr.id, mgr.status)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', color: mgr.status === 'active' ? '#f43f5e' : '#10b981' }}
                >
                  {mgr.status === 'active' ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Manager Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Add Manager</h3>
              <button onClick={() => setShowAddModal(false)} className="btn-icon"><X size={18} /></button>
            </div>

            <form onSubmit={handleAddManager} style={{ padding: '24px' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Login Username) *</label>
                <input
                  type="email"
                  placeholder="sarah.jenkins@company.com"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    value={addForm.department_id}
                    onChange={(e) => setAddForm({ ...addForm, department_id: e.target.value })}
                    className="form-select"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Director of Product"
                    value={addForm.designation}
                    onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="form-input"
                    style={{ paddingRight: '40px' }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '10px',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Manager</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
