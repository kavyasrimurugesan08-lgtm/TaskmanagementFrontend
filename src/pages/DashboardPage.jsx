import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  AlertCircle,
  FileCheck2,
  Users,
  UserCheck,
  RotateCcw,
  Calendar,
  ArrowRight,
  TrendingUp,
  Activity,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function DashboardPage({ onSelectTab, onSelectTask, onOpenCreateTask }) {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [repRes, taskRes, subRes, actRes] = await Promise.all([
          api.reports.getMetrics(),
          api.tasks.getAll(),
          api.submissions.getAll(),
          api.activity.getAll({ limit: 8 })
        ]);
        setMetrics(repRes.summary);
        setTasks(taskRes.tasks || []);
        setSubmissions(subRes.submissions || []);
        setActivities(actRes.logs || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.task_date === todayStr);
  const upcomingTasks = tasks.filter(t => t.task_date > todayStr).slice(0, 5);
  const pendingApprovals = submissions.filter(s => s.status === 'Submitted');

  const summaryCards = [
    { label: "Today's Tasks", count: todayTasks.length, icon: Calendar, color: '#6366f1', tab: 'calendar' },
    { label: 'In Progress', count: metrics?.['In Progress'] || 0, icon: Clock, color: '#f59e0b', tab: 'tasks' },
    { label: 'Submitted (Pending Review)', count: metrics?.['Submitted'] || 0, icon: FileCheck2, color: '#06b6d4', tab: 'approvals' },
    { label: 'Approved', count: metrics?.['Approved'] || 0, icon: CheckSquare, color: '#10b981', tab: 'tasks' },
    { label: 'Rework Required', count: metrics?.['Rework Required'] || 0, icon: RotateCcw, color: '#f43f5e', tab: 'approvals' },
    { label: 'Overdue', count: metrics?.['Overdue'] || 0, icon: AlertCircle, color: '#ef4444', tab: 'tasks' },
  ];

  return (
    <div>
      {/* Top Banner / Hero */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Welcome back, {user?.name || 'Administrator'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Here is what is happening across <strong style={{ color: 'var(--text-main)' }}>{user?.company_name || 'your company'}</strong> today.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => onSelectTab('calendar')} className="btn btn-secondary">
            <Calendar size={16} />
            <span>Open Calendar</span>
          </button>
          <button onClick={onOpenCreateTask} className="btn btn-primary">
            <Plus size={16} />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Main Stat Summary Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div
              key={i}
              className="card"
              onClick={() => onSelectTab(card.tab)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderLeft: `4px solid ${card.color}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                  {card.label}
                </span>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: `${card.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: card.color,
                  }}
                >
                  <Icon size={16} />
                </div>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>
                {card.count}
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Today's Schedule & Pending Approvals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px', marginBottom: '28px' }}>
        {/* Today's Schedule */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Today's Schedule ({todayTasks.length})
              </h3>
            </div>
            <button
              onClick={() => onSelectTab('calendar')}
              style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Full Calendar <ArrowRight size={13} />
            </button>
          </div>

          {todayTasks.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {todayTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTask(t)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      {t.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      {t.employee_name} • {t.start_time} - {t.end_time}
                    </div>
                  </div>
                  <span className={`badge badge-${t.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              No tasks scheduled for today. Create your first task to populate the weekly schedule.
            </div>
          )}
        </div>

        {/* Pending Approvals Queue */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCheck2 size={18} color="#06b6d4" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Pending Submissions ({pendingApprovals.length})
              </h3>
            </div>
            <button
              onClick={() => onSelectTab('approvals')}
              style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              Review All <ArrowRight size={13} />
            </button>
          </div>

          {pendingApprovals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {pendingApprovals.slice(0, 4).map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => onSelectTab('approvals')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      {sub.task_title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                      By {sub.employee_name} ({sub.employee_code}) • {sub.files?.length || 0} file(s) attached
                    </div>
                  </div>
                  <span className="badge badge-submitted">
                    Pending Review
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              No completed task submissions currently pending review.
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} color="#a855f7" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Recent Audit & Activity Log
            </h3>
          </div>
          <button
            onClick={() => onSelectTab('activity')}
            style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            View Complete Log <ArrowRight size={13} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {activities.map((act) => (
            <div
              key={act.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                backgroundColor: 'var(--bg-surface-elevated)',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'var(--bg-main)',
                    color: 'var(--primary)',
                    fontSize: '0.75rem',
                  }}
                >
                  {act.action}
                </span>
                <span style={{ color: 'var(--text-main)' }}>{act.description}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>by {act.user_name}</span>
              </div>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                {act.created_at}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
