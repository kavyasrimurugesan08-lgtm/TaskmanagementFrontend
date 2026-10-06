import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle2,
  Play,
  UploadCloud,
  FileCheck2,
  RotateCcw,
  AlertCircle,
  Paperclip,
  X,
  Building2,
  User,
  Shield,
  Bell,
  Check,
  Camera,
  Send,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';

export function EmployeePortalPage({ token, onBackToAdmin }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'upcoming' | 'submitted' | 'approved' | 'rework'

  // Submission modal state
  const [submittingTask, setSubmittingTask] = useState(null);
  const [submissionNote, setSubmissionNote] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Clock in/out state
  const [clockActionLoading, setClockActionLoading] = useState(false);

  // Send Message to Manager state
  const [empMessage, setEmpMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [messageSentSuccess, setMessageSentSuccess] = useState(false);

  const handleSendEmpMessage = async (e) => {
    e.preventDefault();
    if (!empMessage.trim()) return;

    setIsSendingMessage(true);
    try {
      await api.portal.sendMessage(token, {
        message: empMessage.trim()
      });
      setEmpMessage('');
      setMessageSentSuccess(true);
      setTimeout(() => setMessageSentSuccess(false), 3000);
    } catch (err) {
      alert(`Message error: ${err.message}`);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const loadPortal = async () => {
    try {
      const res = await api.portal.getOverview(token);
      setData(res);
      setError(null);
    } catch (err) {
      setError(err.message || 'Access Link Expired or Revoked');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortal();
    const interval = setInterval(loadPortal, 12000); // Poll/sync every 12s in addition to sockets
    return () => clearInterval(interval);
  }, [token]);

  const handleStartTask = async (taskId) => {
    try {
      await api.portal.startTask(token, taskId);
      loadPortal();
    } catch (err) {
      alert(`Could not start task: ${err.message}`);
    }
  };

  const handleClockIn = async () => {
    setClockActionLoading(true);
    try {
      await api.portal.clockIn(token);
      loadPortal();
    } catch (err) {
      alert(err.message);
    } finally {
      setClockActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    setClockActionLoading(true);
    try {
      await api.portal.clockOut(token);
      loadPortal();
    } catch (err) {
      alert(err.message);
    } finally {
      setClockActionLoading(false);
    }
  };

  const handleOpenSubmitModal = (task) => {
    setSubmittingTask(task);
    setSubmissionNote('');
    setSelectedFiles([]);
    setSubmissionSuccess(false);
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handlePostSubmission = async (e) => {
    e.preventDefault();
    if (!submittingTask) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('submission_note', submissionNote);
      for (const file of selectedFiles) {
        formData.append('files', file);
      }

      await api.portal.submitTask(token, submittingTask.id, formData);
      setSubmissionSuccess(true);
      setTimeout(() => {
        setSubmittingTask(null);
        setSubmissionSuccess(false);
        loadPortal();
      }, 2000);
    } catch (err) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-medium)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Verifying secure employee credentials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)', padding: '20px' }}>
        <div className="card" style={{ maxWidth: '440px', textAlign: 'center', padding: '36px 28px' }}>
          <AlertCircle size={48} color="#f43f5e" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>
            Access Denied
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '20px' }}>
            {error}. This link may have been revoked or regenerated by your company administrator.
          </p>
          {onBackToAdmin && (
            <button onClick={onBackToAdmin} className="btn btn-secondary" style={{ width: '100%' }}>
              Return to Main Portal
            </button>
          )}
        </div>
      </div>
    );
  }

  const emp = data.employee;
  const grouped = data.grouped || {};
  const currentTasks = grouped[activeTab] || [];
  const attendance = data.attendance;
  const isClockedIn = attendance?.clock_in && !attendance?.clock_out;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)', color: 'var(--text-main)' }}>
      {/* Top Header */}
      <header
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem',
            }}
          >
            {emp.name[0]}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem' }}>{emp.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
              {emp.employee_code} • {emp.designation} • {emp.company_name}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Supervisor pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
            }}
          >
            <Shield size={13} color="var(--primary)" />
            <span>Manager: <strong>{emp.manager_name || 'System Admin'}</strong></span>
          </div>

          {onBackToAdmin && (
            <button onClick={onBackToAdmin} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
              Switch to Admin View
            </button>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '24px 16px' }}>
        {/* Attendance Stopwatch Banner */}
        <div
          className="card"
          style={{
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            background: isClockedIn
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)'
              : 'var(--bg-surface)',
            borderLeft: `5px solid ${isClockedIn ? '#10b981' : '#f59e0b'}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: isClockedIn ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                color: isClockedIn ? '#10b981' : '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-dim)' }}>
                Work Time Tracking
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                {isClockedIn ? (
                  <span style={{ color: '#10b981' }}>● Currently Clocked In (Since {attendance.clock_in.split(' ')[1]})</span>
                ) : attendance?.clock_out ? (
                  <span style={{ color: 'var(--text-muted)' }}>Clocked Out for Today (Shift Completed)</span>
                ) : (
                  <span>Ready to start work today</span>
                )}
              </div>
            </div>
          </div>

          <div>
            {!isClockedIn && !attendance?.clock_out && (
              <button
                onClick={handleClockIn}
                disabled={clockActionLoading}
                className="btn btn-success"
                style={{ padding: '10px 20px', fontWeight: 700 }}
              >
                <Clock size={16} />
                <span>Clock In Now</span>
              </button>
            )}

            {isClockedIn && (
              <button
                onClick={handleClockOut}
                disabled={clockActionLoading}
                className="btn btn-danger"
                style={{ padding: '10px 20px', fontWeight: 700 }}
              >
                <Clock size={16} />
                <span>Clock Out</span>
              </button>
            )}
          </div>
        </div>

        {/* Message Manager / Send Notification Card */}
        <div className="card" style={{ marginBottom: '24px', padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Send Message to Manager / Notification Center
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-dim)' }}>
                Directly notify your manager or update your team leads on progress
              </p>
            </div>
          </div>

          <form onSubmit={handleSendEmpMessage} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Type your message or update for manager..."
              value={empMessage}
              onChange={(e) => setEmpMessage(e.target.value)}
              className="form-input"
              style={{ flex: 1, minWidth: '240px', fontSize: '0.85rem' }}
              required
            />
            <button
              type="submit"
              disabled={isSendingMessage || !empMessage.trim()}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', fontSize: '0.84rem' }}
            >
              <Send size={15} />
              <span>{isSendingMessage ? 'Sending...' : 'Send Message'}</span>
            </button>
          </form>

          {messageSentSuccess && (
            <div style={{ color: '#10b981', fontSize: '0.82rem', fontWeight: 600, marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Check size={16} /> Message sent directly to manager notification panel!
            </div>
          )}
        </div>

        {/* Task Workflow Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '20px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {[
            { id: 'today', label: "Today's Tasks", count: grouped.today?.length || 0 },
            { id: 'upcoming', label: 'Upcoming', count: grouped.upcoming?.length || 0 },
            { id: 'rework', label: 'Rework Required', count: grouped.rework?.length || 0, badgeColor: '#f43f5e' },
            { id: 'submitted', label: 'Submitted (Review)', count: grouped.submitted?.length || 0 },
            { id: 'approved', label: 'Approved Completed', count: grouped.approved?.length || 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                fontWeight: 600,
                backgroundColor: activeTab === tab.id ? 'var(--bg-surface-elevated)' : 'transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
                border: activeTab === tab.id ? '1px solid var(--border-medium)' : '1px solid transparent',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  style={{
                    backgroundColor: tab.badgeColor || 'var(--primary)',
                    color: '#ffffff',
                    padding: '1px 6px',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tasks List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {currentTasks.length > 0 ? (
            currentTasks.map((task) => (
              <div
                key={task.id}
                className="card"
                style={{
                  borderLeft: `5px solid ${
                    task.status === 'Approved'
                      ? '#10b981'
                      : task.status === 'Rework Required'
                      ? '#f43f5e'
                      : task.status === 'In Progress'
                      ? '#f59e0b'
                      : 'var(--primary)'
                  }`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className={`badge badge-${task.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {task.status}
                      </span>
                      <span className={`priority-chip priority-${task.priority.toLowerCase()}`}>
                        ● {task.priority} Priority
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', background: 'var(--bg-surface-elevated)', padding: '2px 8px', borderRadius: '4px' }}>
                        {task.category || 'General'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                      {task.title}
                    </h3>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Calendar size={13} color="var(--primary)" />
                        <span>{task.task_date}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} color="var(--primary)" />
                        <span>{task.start_time} - {task.end_time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Task Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {task.status === 'Assigned' && (
                      <button
                        onClick={() => handleStartTask(task.id)}
                        className="btn btn-primary"
                      >
                        <Play size={15} />
                        <span>Start Task</span>
                      </button>
                    )}

                    {(task.status === 'In Progress' || task.status === 'Rework Required') && (
                      <button
                        onClick={() => handleOpenSubmitModal(task)}
                        className="btn btn-success"
                      >
                        <UploadCloud size={15} />
                        <span>{task.status === 'Rework Required' ? 'Submit Revised Work' : 'Submit Completed Work'}</span>
                      </button>
                    )}

                    {task.status === 'Submitted' && (
                      <span style={{ fontSize: '0.85rem', color: '#06b6d4', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <FileCheck2 size={16} />
                        Awaiting Manager Approval
                      </span>
                    )}

                    {task.status === 'Approved' && (
                      <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <CheckCircle2 size={16} />
                        Approved by Manager
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {task.description && (
                  <p style={{ marginTop: '12px', fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, background: 'var(--bg-surface-elevated)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                    {task.description}
                  </p>
                )}

                {/* Manager Rework Instructions Notice */}
                {task.status === 'Rework Required' && (
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '12px 16px',
                      backgroundColor: 'rgba(244, 63, 94, 0.1)',
                      borderLeft: '4px solid #f43f5e',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ fontWeight: 800, color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertCircle size={16} />
                      <span>Manager Requested Rework:</span>
                    </div>
                    <div style={{ color: 'var(--text-main)', marginTop: '4px', fontStyle: 'italic' }}>
                      Please review the feedback above, make necessary revisions, and re-upload your files using "Submit Revised Work".
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-dim)' }}>
              <CheckCircle2 size={36} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                No tasks in this category
              </h3>
              <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                You are all caught up! Check back when your manager schedules new tasks.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Task Completion Upload Modal */}
      {submittingTask && (
        <div className="modal-overlay" onClick={() => setSubmittingTask(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Submit Completed Work</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{submittingTask.title}</div>
              </div>
              <button onClick={() => setSubmittingTask(null)} className="btn-icon"><X size={18} /></button>
            </div>

            {submissionSuccess ? (
              <div style={{ padding: '36px 24px', textAlign: 'center' }}>
                <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Submitted Successfully!
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
                  Your task has been submitted successfully and is waiting for manager approval.
                </p>
              </div>
            ) : (
              <form onSubmit={handlePostSubmission} style={{ padding: '24px' }}>
                <div className="form-group">
                  <label className="form-label">Completion Notes & Summary</label>
                  <textarea
                    placeholder="Describe what was done, changes made, or key links for the reviewer..."
                    value={submissionNote}
                    onChange={(e) => setSubmissionNote(e.target.value)}
                    className="form-textarea"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Attach Deliverable Files (Multiple files supported)</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.zip"
                    onChange={handleFileChange}
                    className="form-input"
                    style={{ padding: '8px' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    Supported: PDF, Images (Camera upload), Word, Excel, ZIP (Max 25MB).
                  </div>
                </div>

                {selectedFiles.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '6px' }}>
                      Selected Files ({selectedFiles.length}):
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {selectedFiles.map((file, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-main)' }}>
                          <Paperclip size={13} color="var(--primary)" />
                          <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                  <button type="button" onClick={() => setSubmittingTask(null)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                    {isSubmitting ? 'Uploading...' : 'Submit Deliverable'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
