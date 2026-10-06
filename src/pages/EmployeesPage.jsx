import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  ExternalLink,
  Copy,
  RefreshCw,
  Ban,
  CheckCircle,
  Clock,
  Briefcase,
  History,
  X,
  AlertCircle,
  Loader2,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ENROLLED_ADMIN_EMAILS } from '../config/authConfig';

function EmployeeAvatar({ emp }) {
  const [imgError, setImgError] = useState(false);
  const initials = emp.name ? emp.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'EMP';

  if (!emp.profile_image || imgError) {
    return (
      <div
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: '0.82rem',
          boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
          flexShrink: 0
        }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={emp.profile_image}
      alt={emp.name}
      onError={() => setImgError(true)}
      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
    />
  );
}

export function EmployeesPage({ onSelectEmployeePortal, onOpenCreateTask }) {
  const { user } = useAuth();
  const { addToast, lastSocketEvent } = useSocket();
  const isEnrolledAdmin = user?.role === 'admin' && ENROLLED_ADMIN_EMAILS.includes(user?.email?.toLowerCase());
  const canManageEmployees = user?.role === 'manager' || isEnrolledAdmin;

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Add Employee Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    employee_code: '',
    email: '',
    phone: '',
    designation: '',
    department_id: '',
    manager_id: '',
  });

  // History Modal State
  const [historyEmp, setHistoryEmp] = useState(null);
  const [historyData, setHistoryData] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [empRes, deptRes, mgrRes] = await Promise.all([
        api.employees.getAll(search.trim() ? { search: search.trim() } : {}),
        api.departments.getAll(),
        api.managers.getAll()
      ]);
      setEmployees(empRes.employees || []);
      setDepartments(deptRes.departments || []);
      setManagers(mgrRes.managers || []);
    } catch (err) {
      console.error('Failed to load employees:', err);
      setLoadError(err.message || 'Failed to load employee directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  // Real-time synchronization for employee events
  useEffect(() => {
    if (
      lastSocketEvent?.type === 'employee_created' ||
      lastSocketEvent?.type === 'employee_updated' ||
      lastSocketEvent?.type === 'employee_deleted'
    ) {
      loadData();
    }
  }, [lastSocketEvent]);

  const handleCopyLink = (token, id) => {
    const fullUrl = `${window.location.origin}/#/employee/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleRegenerateToken = async (id, name) => {
    if (!window.confirm(`Regenerate secure access link for ${name}? The old link will be revoked immediately.`)) return;
    try {
      const res = await api.employees.regenerateToken(id);
      addToast?.('Token Regenerated', `New access link generated for ${name}`, 'info');
      loadData();
    } catch (err) {
      alert(`Failed to regenerate link: ${err.message}`);
    }
  };

  const handleRevokeToken = async (id, name) => {
    if (!window.confirm(`Are you sure you want to revoke access for ${name}? They will immediately lose access to their portal.`)) return;
    try {
      await api.employees.revokeToken(id);
      addToast?.('Access Revoked', `Access link revoked for ${name}`, 'warning');
      loadData();
    } catch (err) {
      alert(`Revocation failed: ${err.message}`);
    }
  };

  const handleDeleteEmployee = async (id, name, code) => {
    if (!window.confirm(`Permanently delete employee ${name} (${code})? This will permanently remove them from the system.`)) return;
    try {
      await api.employees.delete(id);
      addToast?.('Employee Deleted', `${name} (${code}) permanently removed`, 'info');
      setEmployees(prev => prev.filter(e => e.id !== id));
      loadData();
    } catch (err) {
      alert(`Failed to delete employee: ${err.message}`);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.email) return;

    setIsSubmitting(true);
    try {
      const res = await api.employees.create({
        ...addForm,
        department_id: addForm.department_id ? Number(addForm.department_id) : null,
        manager_id: addForm.manager_id ? Number(addForm.manager_id) : null,
      });

      // Optimistically insert into current view immediately!
      if (res && res.employee) {
        setEmployees(prev => [res.employee, ...prev.filter(e => e.id !== res.employee.id)]);
      }

      setShowAddModal(false);
      setAddForm({ name: '', employee_code: '', email: '', phone: '', designation: '', department_id: '', manager_id: '' });
      addToast?.('Employee Added', `${addForm.name} added to workforce directory`, 'success');
      
      // Refresh to ensure all relations are populated
      await loadData();
    } catch (err) {
      alert(`Failed to add employee: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewHistory = async (emp) => {
    setHistoryEmp(emp);
    try {
      const res = await api.employees.getHistory(emp.id);
      setHistoryData(res);
    } catch (err) {
      console.error('Failed to load employee history:', err);
    }
  };

  return (
    <div>
      {/* Page Header */}
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
            Employees & Workforces
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
            Manage staff credentials, assigned managers, secure token links, and attendance.
          </p>
        </div>

        {canManageEmployees && (
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Add Employee</span>
          </button>
        )}
      </div>

      {/* Search Toolbar */}
      <div className="card" style={{ marginBottom: '20px', padding: '14px 20px' }}>
        <div style={{ position: 'relative', maxWidth: '400px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search by name, code, designation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '36px', paddingRight: search ? '36px' : '12px', height: '40px' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
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
              title="Clear search"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Employees Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                <th style={{ padding: '14px 20px' }}>Employee</th>
                <th style={{ padding: '14px 16px' }}>Department</th>
                <th style={{ padding: '14px 16px' }}>Supervising Manager</th>
                <th style={{ padding: '14px 16px' }}>Current Task</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 16px' }}>Secure Link Actions</th>
                <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && employees.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '18px', height: '18px', border: '2px solid var(--border-medium)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      <span>Loading employee directory...</span>
                    </div>
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <div style={{ color: '#f43f5e', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                      {loadError}
                    </div>
                    <button onClick={loadData} className="btn btn-secondary btn-sm">
                      <RefreshCw size={13} />
                      <span>Retry</span>
                    </button>
                  </td>
                </tr>
              ) : employees.length > 0 ? (
                employees.map((emp) => (
                  <tr
                    key={emp.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <EmployeeAvatar emp={emp} />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                            {emp.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            {emp.employee_code} • {emp.designation}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {emp.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                      {emp.department_name || 'General'}
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                      {emp.manager_name || 'Admin'}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {emp.current_task_title ? (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-main)' }}>
                            {emp.current_task_title}
                          </div>
                          <span className={`badge badge-${emp.current_task_status?.toLowerCase().replace(/\s+/g, '-')}`} style={{ marginTop: '2px', padding: '1px 6px', fontSize: '0.68rem' }}>
                            {emp.current_task_status}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                          No active task today
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge ${emp.status === 'active' ? 'badge-approved' : 'badge-cancelled'}`}>
                        {emp.status}
                      </span>
                    </td>

                    {/* Secure Access Link Operations */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => {
                            window.location.hash = `#/employee/${emp.secure_access_token_hash}`;
                            if (onSelectEmployeePortal) {
                              onSelectEmployeePortal(emp.secure_access_token_hash);
                            }
                          }}
                          className="btn btn-sm btn-primary"
                          style={{ fontSize: '0.75rem', padding: '4px 10px', cursor: 'pointer' }}
                          title="Open Employee Portal"
                        >
                          <ExternalLink size={13} />
                          <span>Open</span>
                        </button>

                        <button
                          onClick={() => handleCopyLink(emp.secure_access_token_hash, emp.id)}
                          className="btn btn-sm btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                          title="Copy secure link"
                        >
                          <Copy size={13} />
                          <span>{copiedId === emp.id ? 'Copied!' : 'Copy'}</span>
                        </button>

                        {canManageEmployees && (
                          <>
                            <button
                              onClick={() => handleRegenerateToken(emp.id, emp.name)}
                              className="btn-icon"
                              title="Regenerate token (invalidates old link)"
                              style={{ padding: '4px' }}
                            >
                              <RefreshCw size={14} color="#f59e0b" />
                            </button>

                            <button
                              onClick={() => handleRevokeToken(emp.id, emp.name)}
                              className="btn-icon"
                              title="Revoke access"
                              style={{ padding: '4px' }}
                            >
                              <Ban size={14} color="#f43f5e" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => handleViewHistory(emp)}
                          className="btn btn-sm btn-secondary"
                          style={{ fontSize: '0.75rem' }}
                          title="View history"
                        >
                          <History size={13} />
                          <span>History</span>
                        </button>

                        {canManageEmployees && (
                          <button
                            onClick={() => handleDeleteEmployee(emp.id, emp.name, emp.employee_code)}
                            className="btn btn-sm"
                            style={{
                              fontSize: '0.75rem',
                              padding: '4px 8px',
                              backgroundColor: 'rgba(244, 63, 94, 0.1)',
                              color: '#f43f5e',
                              border: '1px solid rgba(244, 63, 94, 0.25)'
                            }}
                            title="Permanently Delete Employee"
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No employees registered yet. Click "Add Employee" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Add New Employee</h3>
              <button onClick={() => setShowAddModal(false)} className="btn-icon"><X size={18} /></button>
            </div>

            <form onSubmit={handleAddEmployee} style={{ padding: '24px' }}>
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Jordan Cooper"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    placeholder="jordan.cooper@company.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-1122"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="form-input"
                  />
                </div>
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
                    placeholder="e.g. Senior Frontend Engineer"
                    value={addForm.designation}
                    onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Supervising Manager</label>
                <select
                  value={addForm.manager_id}
                  onChange={(e) => setAddForm({ ...addForm, manager_id: e.target.value })}
                  className="form-select"
                >
                  <option value="">Select Manager</option>
                  {managers.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} ({m.designation})</option>
                  ))}
                </select>
              </div>

              <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '16px' }}>
                💡 <strong>Passwordless Security:</strong> A cryptographically secure, unique access token link will automatically be generated for this employee. No password creation required.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? 'Creating Employee...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyEmp && (
        <div className="modal-overlay" onClick={() => setHistoryEmp(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Task History & Attendance</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{historyEmp.name} ({historyEmp.employee_code})</div>
              </div>
              <button onClick={() => setHistoryEmp(null)} className="btn-icon"><X size={18} /></button>
            </div>

            <div style={{ padding: '24px', maxHeight: '500px', overflowY: 'auto' }}>
              <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '10px' }}>
                Tasks Completed & Assigned ({historyData?.tasks?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                {historyData?.tasks?.map((t) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{t.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{t.task_date} • {t.start_time} - {t.end_time}</div>
                    </div>
                    <span className={`badge badge-${t.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>

              <h4 style={{ fontSize: '0.82rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '10px' }}>
                Recent Attendance Logs ({historyData?.attendance?.length || 0})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {historyData?.attendance?.map((a) => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem' }}>
                    <span>{a.attendance_date}</span>
                    <span style={{ color: 'var(--text-muted)' }}>In: {a.clock_in?.split(' ')[1] || '--'} | Out: {a.clock_out?.split(' ')[1] || 'Active'}</span>
                    <span className={`badge badge-${a.status.toLowerCase()}`}>{a.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
