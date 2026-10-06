import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  User,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export function AttendancePage() {
  const { user } = useAuth();
  const { lastSocketEvent } = useSocket() || {};
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filterDate, setFilterDate] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Manual record modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    employee_id: '',
    attendance_date: new Date().toISOString().split('T')[0],
    clock_in: '09:00:00',
    clock_out: '17:30:00',
    status: 'Present'
  });

  const loadAttendance = async () => {
    try {
      const [attRes, empRes] = await Promise.all([
        api.attendance.getAll({
          date: filterDate || undefined,
          employee_id: filterEmployee !== 'all' ? filterEmployee : undefined,
          status: filterStatus !== 'all' ? filterStatus : undefined
        }),
        api.employees.getAll()
      ]);
      setRecords(attRes.records || []);
      setStats(attRes.stats || null);
      setEmployees(empRes.employees || []);

      if (empRes.employees && empRes.employees.length > 0 && !manualForm.employee_id) {
        setManualForm(prev => ({ ...prev, employee_id: String(empRes.employees[0].id) }));
      }
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [filterDate, filterEmployee, filterStatus]);

  // Real-time automatic updates on clock in / clock out
  useEffect(() => {
    if (lastSocketEvent) {
      loadAttendance();
    }
  }, [lastSocketEvent]);

  // Live interval ticker to update duration of currently working employees every 30s
  useEffect(() => {
    const timer = setInterval(() => {
      setRecords(prev =>
        prev.map(r => {
          if (r.is_live && r.clock_in) {
            const start = new Date(r.clock_in);
            const end = new Date();
            const diffMs = Math.max(0, end - start);
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            return { ...r, duration: `${hours}h ${minutes}m` };
          }
          return r;
        })
      );
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveManualRecord = async (e) => {
    e.preventDefault();
    try {
      const clockInFull = `${manualForm.attendance_date} ${manualForm.clock_in}`;
      const clockOutFull = manualForm.clock_out ? `${manualForm.attendance_date} ${manualForm.clock_out}` : null;

      await api.attendance.record({
        employee_id: Number(manualForm.employee_id),
        attendance_date: manualForm.attendance_date,
        clock_in: clockInFull,
        clock_out: clockOutFull,
        status: manualForm.status
      });

      setShowManualModal(false);
      loadAttendance();
    } catch (err) {
      alert(`Failed to save record: ${err.message}`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Present': return <span className="badge badge-approved">Present</span>;
      case 'Late': return <span className="badge badge-in-progress">Late</span>;
      case 'Half Day': return <span className="badge badge-assigned">Half Day</span>;
      case 'Leave': return <span className="badge badge-rework-required">On Leave</span>;
      case 'Absent': return <span className="badge badge-overdue">Absent</span>;
      default: return <span className="badge">{status}</span>;
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
            Time & Attendance Tracking
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
            Accurate daily clock-in/out timestamps and total work hours separate from task durations.
          </p>
        </div>

        {isAdminOrManager && (
          <button onClick={() => setShowManualModal(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Record Attendance</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Present Today
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
              {stats.present_today}
            </div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Late Today
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
              {stats.late_today}
            </div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Half Day
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6', marginTop: '4px' }}>
              {stats.half_day_today}
            </div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #f43f5e' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              On Leave
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f43f5e', marginTop: '4px' }}>
              {stats.on_leave_today}
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Date</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="form-input"
            style={{ width: '160px', height: '38px' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Employee</label>
          <select
            value={filterEmployee}
            onChange={(e) => setFilterEmployee(e.target.value)}
            className="form-select"
            style={{ width: '180px', height: '38px' }}
          >
            <option value="all">All Employees</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="form-select"
            style={{ width: '150px', height: '38px' }}
          >
            <option value="all">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Late">Late</option>
            <option value="Half Day">Half Day</option>
            <option value="Leave">Leave</option>
            <option value="Absent">Absent</option>
          </select>
        </div>

        {filterDate && (
          <button
            onClick={() => setFilterDate('')}
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '18px' }}
          >
            Clear Date
          </button>
        )}
      </div>

      {/* Attendance Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                <th style={{ padding: '14px 20px' }}>Employee</th>
                <th style={{ padding: '14px 16px' }}>Date</th>
                <th style={{ padding: '14px 16px' }}>Clock In</th>
                <th style={{ padding: '14px 16px' }}>Clock Out</th>
                <th style={{ padding: '14px 16px' }}>Total Working Time</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length > 0 ? (
                records.map((r) => (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
                          {r.employee_name ? r.employee_name[0] : 'E'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.employee_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{r.employee_code} • {r.department_name}</div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-main)' }}>
                      {r.attendance_date}
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                      {r.clock_in ? r.clock_in.split(' ')[1] : '--:--'}
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>
                      {r.clock_out ? (
                        r.clock_out.split(' ')[1]
                      ) : (
                        <span style={{ color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                          Currently Working
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text-main)' }}>
                      {r.duration}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {getStatusBadge(r.status)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No attendance records found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Attendance Record Modal */}
      {showManualModal && (
        <div className="modal-overlay" onClick={() => setShowManualModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Record Attendance</h3>
              <button onClick={() => setShowManualModal(false)} className="btn-icon"><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveManualRecord} style={{ padding: '24px' }}>
              <div className="form-group">
                <label className="form-label">Employee *</label>
                <select
                  value={manualForm.employee_id}
                  onChange={(e) => setManualForm({ ...manualForm, employee_id: e.target.value })}
                  className="form-select"
                  required
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.employee_code})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  value={manualForm.attendance_date}
                  onChange={(e) => setManualForm({ ...manualForm, attendance_date: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Clock In Time</label>
                  <input
                    type="time"
                    step="1"
                    value={manualForm.clock_in}
                    onChange={(e) => setManualForm({ ...manualForm, clock_in: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Clock Out Time</label>
                  <input
                    type="time"
                    step="1"
                    value={manualForm.clock_out}
                    onChange={(e) => setManualForm({ ...manualForm, clock_out: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Attendance Status</label>
                <select
                  value={manualForm.status}
                  onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                  className="form-select"
                >
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Leave">Leave</option>
                  <option value="Absent">Absent</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setShowManualModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
