import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  Plus,
  Clock,
  User,
  Calendar as CalendarIcon,
  Tag,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function TasksPage({ onSelectTask, onOpenCreateTask, isAdminOrManager = true }) {
  const { user } = useAuth();
  const isManager = user?.role === 'manager';
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [deptFilter, setDeptFilter] = useState('all');
  const [viewStyle, setViewStyle] = useState('table'); // 'table' | 'cards'

  const loadTasks = async () => {
    try {
      const [taskRes, empRes, deptRes] = await Promise.all([
        api.tasks.getAll({
          status: statusFilter,
          priority: priorityFilter,
          department_id: deptFilter !== 'all' ? deptFilter : undefined,
          search: search || undefined
        }),
        api.employees.getAll(),
        api.departments.getAll()
      ]);
      setTasks(taskRes.tasks || []);
      setEmployees(empRes.employees || []);
      setDepartments(deptRes.departments || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [statusFilter, priorityFilter, deptFilter, search]);

  const getStatusBadge = (status) => {
    const cls = `badge badge-${status.toLowerCase().replace(/\s+/g, '-')}`;
    return <span className={cls}>{status}</span>;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return '#ef4444';
      case 'High': return '#f97316';
      case 'Normal': return '#6366f1';
      case 'Low': return '#64748b';
      default: return '#6366f1';
    }
  };

  return (
    <div>
      {/* Header & Controls */}
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
            Task Directory
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
            Manage, schedule, and track tasks across all company departments.
          </p>
        </div>

        {(user?.role === 'admin' || user?.role === 'manager') && (
          <button onClick={onOpenCreateTask} className="btn btn-primary">
            <Plus size={16} />
            <span>Create Task</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div
        className="card"
        style={{
          marginBottom: '20px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        {/* Search */}
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search by title, description, or assignee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="form-select"
          style={{ width: '160px', height: '40px' }}
        >
          <option value="all">All Statuses</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Submitted">Submitted</option>
          <option value="Approved">Approved</option>
          <option value="Rework Required">Rework Required</option>
          <option value="Overdue">Overdue</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="form-select"
          style={{ width: '150px', height: '40px' }}
        >
          <option value="all">All Priorities</option>
          <option value="Urgent">Urgent</option>
          <option value="High">High</option>
          <option value="Normal">Normal</option>
          <option value="Low">Low</option>
        </select>

        {/* Department Filter */}
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="form-select"
          style={{ width: '170px', height: '40px' }}
        >
          <option value="all">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      {/* Tasks Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                <th style={{ padding: '14px 20px' }}>Task Title</th>
                <th style={{ padding: '14px 16px' }}>Assignee</th>
                <th style={{ padding: '14px 16px' }}>Department</th>
                <th style={{ padding: '14px 16px' }}>Date & Window</th>
                <th style={{ padding: '14px 16px' }}>Priority</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px', maxWidth: '380px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.description || 'No description'}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {task.employee_name ? task.employee_name[0] : 'E'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{task.employee_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{task.employee_code}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                      {task.department_name || task.category || 'General'}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ color: 'var(--text-main)', fontWeight: 600 }}>{task.task_date}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{task.start_time} - {task.end_time}</div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 700, color: getPriorityColor(task.priority), fontSize: '0.78rem' }}>
                        ● {task.priority}
                      </span>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {getStatusBadge(task.status)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No tasks match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
