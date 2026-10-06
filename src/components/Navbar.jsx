import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  Moon,
  Sun,
  LogOut,
  Building2,
  UserCheck,
  ChevronDown,
  Clock,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export function Navbar({ onOpenSearch, onOpenCreateTask, unreadCount = 0, onOpenNotifications }) {
  const { user, logout, theme, toggleTheme } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = currentTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <header
      style={{
        height: '68px',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand & Organization info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: '1.1rem',
              boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)',
            }}
          >
            I
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              Inkpen
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Building2 size={12} />
              {user?.company_name || 'Inkpen'}
            </div>
          </div>
        </div>
      </div>

      {/* Global Search Bar */}
      <div style={{ flex: 1, maxWidth: '460px', margin: '0 20px' }}>
        <button
          onClick={onOpenSearch}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-dim)',
            fontSize: '0.85rem',
            transition: 'border 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-medium)')}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={15} />
            <span>Search tasks, employees, departments...</span>
          </div>
          <kbd
            style={{
              padding: '2px 6px',
              fontSize: '0.7rem',
              backgroundColor: 'var(--bg-main)',
              borderRadius: '4px',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-muted)',
            }}
          >
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Action Tools */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Live Date/Time widget */}
        <div
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            backgroundColor: 'var(--bg-surface-elevated)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
          }}
          className="desktop-clock"
        >
          <Clock size={13} color="var(--primary)" />
          <span style={{ fontWeight: 600, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
            {formattedTime}
          </span>
          <span style={{ opacity: 0.5 }}>•</span>
          <span>{formattedDate}</span>
        </div>

        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="btn-icon"
          style={{ position: 'relative' }}
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#ef4444',
                color: '#fff',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unreadCount}
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="btn-icon"
          aria-label="Toggle Theme"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Profile & Account */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '5px 12px 5px 6px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: user?.role === 'admin' ? '#6366f1' : (user?.designation === 'Team Leader' ? '#06b6d4' : '#10b981'),
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              {user?.name ? user.name[0] : 'U'}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {user?.name || 'User'}
              </div>
              <div style={{ fontSize: '0.70rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                {user?.email || (user?.role === 'admin' ? 'admin@inkpen.com' : 'manager@inkpen.com')}
              </div>
            </div>
            <ChevronDown size={14} color="var(--text-dim)" />
          </button>

          {showProfileMenu && (
            <div
              style={{
                position: 'absolute',
                top: '110%',
                right: 0,
                width: '260px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                padding: '8px',
                zIndex: 100,
              }}
            >
              <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-main)', borderRadius: 'var(--radius-md) var(--radius-md) 0 0' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>{user?.name || 'User'}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px', fontWeight: 500, wordBreak: 'break-all' }}>{user?.email || 'user@inkpen.com'}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '6px', padding: '3px 8px', borderRadius: '12px', background: user?.role === 'admin' ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)', color: user?.role === 'admin' ? '#818cf8' : '#34d399', fontSize: '0.7rem', fontWeight: 600 }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                  <span>{user?.role === 'admin' ? 'Company Administrator' : `${user?.designation || 'Manager'} (${user?.department_name || 'All Departments'})`}</span>
                </div>
              </div>

              <div style={{ padding: '6px 4px 2px' }}>
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 12px',
                    color: '#f43f5e',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(244, 63, 94, 0.08)',
                    cursor: 'pointer',
                    border: '1px solid rgba(244, 63, 94, 0.2)',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <LogOut size={15} />
                  <span>Switch Account / Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
