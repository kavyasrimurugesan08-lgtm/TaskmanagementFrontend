import React, { useState, useEffect } from 'react';
import { History, Search, Filter, Shield, User, Clock } from 'lucide-react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';

export function ActivityLogPage() {
  const { lastSocketEvent } = useSocket() || {};
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const loadLogs = async () => {
    try {
      const res = await api.activity.getAll({
        user_role: roleFilter !== 'all' ? roleFilter : undefined,
        search: search || undefined,
        limit: 100
      });
      setLogs(res.logs || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [roleFilter, search]);

  // Real-time automatic updates on new activity logs
  useEffect(() => {
    if (lastSocketEvent) {
      loadLogs();
    }
  }, [lastSocketEvent]);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="badge badge-rework-required" style={{ fontSize: '0.68rem' }}>Admin</span>;
      case 'manager':
        return <span className="badge badge-approved" style={{ fontSize: '0.68rem' }}>Manager</span>;
      default:
        return <span className="badge badge-assigned" style={{ fontSize: '0.68rem' }}>Employee</span>;
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Activity & Audit Logs
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
          Immutable audit trail of authentication events, task changes, submissions, and access revocations.
        </p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Search action, description, or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="form-select"
          style={{ width: '160px', height: '40px' }}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admins</option>
          <option value="manager">Managers</option>
          <option value="employee">Employees</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
                <th style={{ padding: '14px 20px' }}>Timestamp</th>
                <th style={{ padding: '14px 16px' }}>User & Role</th>
                <th style={{ padding: '14px 16px' }}>Action</th>
                <th style={{ padding: '14px 20px' }}>Description</th>
                <th style={{ padding: '14px 16px' }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <td style={{ padding: '14px 20px', whiteSpace: 'nowrap', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                      {log.created_at}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{log.user_name}</span>
                        {getRoleBadge(log.user_role)}
                      </div>
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--primary)', backgroundColor: 'rgba(99, 102, 241, 0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem' }}>
                        {log.action}
                      </span>
                    </td>

                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                      {log.description}
                    </td>

                    <td style={{ padding: '14px 16px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      {log.ip_address || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-dim)' }}>
                    No activity logs recorded matching criteria.
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
