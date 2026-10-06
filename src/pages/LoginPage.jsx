import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LoginPage({ onOpenEmployeePortal }) {
  const { login } = useAuth();

  // Route determination from location hash (Employee Login or Admin Login)
  const getTabFromHash = () => {
    const rawHash = window.location.hash || '';
    const decodedHash = decodeURIComponent(rawHash).toLowerCase();
    if (decodedHash.includes('admin')) return 'admin';
    return 'employee'; // Default view
  };

  const [activeTab, setActiveTab] = useState(getTabFromHash);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync state when location hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const tab = getTabFromHash();
      setActiveTab(tab);
      setError(null);
      setEmail('');
      setPassword('');
      setShowPassword(false);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (tab) => {
    setError(null);
    setEmail('');
    setPassword('');
    setShowPassword(false);
    if (tab === 'admin') {
      window.location.hash = '#/admin-login';
    } else {
      window.location.hash = '#/employee-login';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email, employee code, or access credentials.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const resUser = await login(email.trim(), password, activeTab);
      if (activeTab === 'employee' || resUser?.role === 'employee') {
        const empTok = resUser?.token || resUser?.employee_token || resUser?.user?.token;
        if (empTok) {
          window.location.hash = `#/employee/${empTok}`;
          if (onOpenEmployeePortal) {
            onOpenEmployeePortal(empTok);
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-main)',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background radial atmosphere */}
      <div
        style={{
          position: 'absolute',
          width: '700px',
          height: '700px',
          background:
            activeTab === 'admin'
              ? 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(0,0,0,0) 70%)'
              : 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(0,0,0,0) 70%)',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
          transition: 'background 0.5s ease',
        }}
      />

      <div style={{ width: '100%', maxWidth: '440px', zIndex: 1 }}>
        {/* DEDICATED PORTAL NAVIGATION TABS */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-surface-elevated)',
            padding: '4px',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '24px',
            border: '1px solid var(--border-subtle)',
            gap: '4px',
          }}
        >
          <button
            type="button"
            onClick={() => navigateTo('employee')}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'employee' ? '#06b6d4' : 'transparent',
              color: activeTab === 'employee' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: activeTab === 'employee' ? 700 : 500,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Users size={16} />
            <span>Employee Login</span>
          </button>

          <button
            type="button"
            onClick={() => navigateTo('admin')}
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: activeTab === 'admin' ? '#6366f1' : 'transparent',
              color: activeTab === 'admin' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: activeTab === 'admin' ? 700 : 500,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <Shield size={16} />
            <span>Admin Login</span>
          </button>
        </div>

        {/* 1. EMPLOYEE LOGIN VIEW */}
        {activeTab === 'employee' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 22px rgba(6, 182, 212, 0.35)',
                  marginBottom: '12px',
                }}
              >
                <Users size={28} />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                Employee Login
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '4px' }}>
                Enter your employee email or employee code to open your portal
              </p>
            </div>

            <div className="card" style={{ padding: '28px 24px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-medium)' }}>
              {error && (
                <div
                  style={{
                    marginBottom: '18px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(244, 63, 94, 0.12)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#f43f5e',
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    lineHeight: 1.4,
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Employee Email or Code *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-dim)' }} />
                    <input
                      type="text"
                      placeholder="e.g. EMP-1008 or mekha@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '40px', height: '44px' }}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Access Code / Password (Optional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-dim)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter access code or password..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '40px', paddingRight: '44px', height: '44px' }}
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

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginTop: '6px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#06b6d4',
                    borderColor: '#0891b2'
                  }}
                >
                  {loading ? (
                    'Opening Portal...'
                  ) : (
                    <>
                      <span>Sign In to Employee Portal</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* 2. ADMIN LOGIN VIEW */}
        {activeTab === 'admin' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '18px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 22px rgba(99, 102, 241, 0.4)',
                  marginBottom: '12px',
                }}
              >
                <Shield size={28} />
              </div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                Admin Login
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '4px' }}>
                Enter administrator credentials for complete system management
              </p>
            </div>

            <div className="card" style={{ padding: '28px 24px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-medium)' }}>
              {error && (
                <div
                  style={{
                    marginBottom: '18px',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'rgba(244, 63, 94, 0.12)',
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    color: '#f43f5e',
                    fontSize: '0.84rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    lineHeight: 1.4,
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Admin Email Address *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-dim)' }} />
                    <input
                      type="email"
                      placeholder="Enter admin email..."
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '40px', height: '44px' }}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                    Password / Access Code *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-dim)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter admin password..."
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-input"
                      style={{ paddingLeft: '40px', paddingRight: '44px', height: '44px' }}
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

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    marginTop: '6px',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  {loading ? (
                    'Signing in...'
                  ) : (
                    <>
                      <span>Sign In to Admin Portal</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
