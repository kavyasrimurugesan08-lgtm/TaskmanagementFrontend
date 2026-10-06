import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Shield, Tag, AlertCircle, Plus } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

function formatYMD(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function CreateTaskModal({ onClose, onTaskCreated, initialDate = null }) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    employee_id: '',
    manager_id: user?.role === 'manager' ? String(user.id) : '',
    department_id: '',
    task_date: initialDate || formatYMD(new Date()),
    start_time: '09:00',
    end_time: '12:00',
    priority: 'Normal',
    category: 'Technical',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [empRes, mgrRes, deptRes] = await Promise.all([
          api.employees.getAll(),
          api.managers.getAll(),
          api.departments.getAll()
        ]);
        setEmployees(empRes.employees || []);
        setManagers(mgrRes.managers || []);
        setDepartments(deptRes.departments || []);

        if (empRes.employees && empRes.employees.length > 0) {
          setFormData(prev => ({
            ...prev,
            employee_id: String(empRes.employees[0].id)
          }));
        }
      } catch (err) {
        console.error('Failed to load task creation dependencies:', err);
      } finally {
        setLoadingOptions(false);
      }
    }
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.employee_id || !formData.task_date) {
      setError('Please provide a title, assign an employee, and select a valid date.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await api.tasks.create({
        ...formData,
        employee_id: Number(formData.employee_id),
        manager_id: formData.manager_id ? Number(formData.manager_id) : null
      });
      if (onTaskCreated) onTaskCreated(res.task);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create task');
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)',
              }}
            >
              <Plus size={18} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Create New Task
            </h3>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div
              style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#ef4444',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              name="title"
              placeholder="e.g. Implement Webhook Handlers for Payments"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Task Description & Instructions</label>
            <textarea
              name="description"
              placeholder="Outline deliverables, acceptance criteria, and specific requirements..."
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
            />
          </div>

          {/* Employee & Manager Selectors */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Assign Employee *</label>
              <select
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                className="form-select"
                required
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employee_code}) - {emp.designation}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Supervising Manager</label>
              <select
                name="manager_id"
                value={formData.manager_id}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Default (Admin / Team Lead)</option>
                {managers.map(mgr => (
                  <option key={mgr.id} value={mgr.id}>
                    {mgr.name} - {mgr.designation}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Time Window */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
            <div className="form-group">
              <label className="form-label">Task Date *</label>
              <input
                type="date"
                name="task_date"
                value={formData.task_date}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Start Time *</label>
              <input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Time *</label>
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Priority & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Priority Level</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="form-select"
              >
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="form-select"
              >
                <option value="Technical">Technical</option>
                <option value="Designing">Designing</option>
                <option value="Academic">Academic</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Scheduling...' : 'Create & Schedule Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
