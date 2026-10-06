import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  Users,
  UserCheck,
  Building,
  UploadCloud,
  CheckCircle2,
  Clock,
  Bell,
  BarChart3,
  History,
  Settings,
  Plus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ENROLLED_ADMIN_EMAILS } from '../config/authConfig';

export function Sidebar({ currentTab, onSelectTab, pendingApprovalsCount = 0, onOpenCreateTask }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isEnrolledAdmin = isAdmin && ENROLLED_ADMIN_EMAILS.includes(user?.email?.toLowerCase());

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'calendar', label: 'Weekly Calendar', icon: CalendarDays, highlight: true },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'employees', label: 'Employees', icon: Users },
    { id: 'managers', label: 'Managers', icon: UserCheck },
    { id: 'departments', label: 'Departments', icon: Building },
    { id: 'submissions', label: 'Submissions', icon: UploadCloud, hideAdmin: true },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle2, badge: pendingApprovalsCount, hideAdmin: true },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'activity', label: 'Activity Log', icon: History },
    { id: 'settings', label: 'Company Settings', icon: Settings, adminOnly: true },
  ];

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 14px',
        minHeight: 'calc(100vh - 68px)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Quick Task Creation Trigger */}
        {(isAdmin || user?.role === 'manager') && (
          <button
            onClick={onOpenCreateTask}
            className="btn btn-primary"
            style={{
              width: '100%',
              marginBottom: '16px',
              padding: '10px 16px',
              borderRadius: 'var(--radius-lg)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Plus size={16} />
            <span>New Task</span>
          </button>
        )}

        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', padding: '0 10px 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Work Management
        </div>

        {/* Navigation list */}
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          if (item.managerOnly && isAdmin) return null;
          if (item.hideAdmin && isAdmin) return null;
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.875rem',
                border: isActive ? '1px solid var(--border-medium)' : '1px solid transparent',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface-hover)';
                  e.currentTarget.style.color = 'var(--text-main)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon size={18} color={isActive ? 'var(--primary)' : 'currentColor'} />
                <span>{item.label}</span>
              </div>

              {item.badge > 0 && (
                <span
                  style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '9999px',
                    padding: '1px 7px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer System Status */}
      <div
        style={{
          padding: '12px',
          backgroundColor: 'var(--bg-surface-elevated)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          fontSize: '0.75rem',
          color: 'var(--text-dim)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>WebSocket Real-Time</span>
        </div>
        <div>Tenant: {user?.company_name || 'Inkpen Technologies'}</div>
      </div>
    </aside>
  );
}
