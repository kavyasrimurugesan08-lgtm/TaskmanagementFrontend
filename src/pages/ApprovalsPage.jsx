import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  RotateCcw,
  Paperclip,
  Download,
  Clock,
  User,
  Filter,
  AlertCircle,
  FileCheck2,
  X,
  Send
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export function ApprovalsPage() {
  const { user } = useAuth();
  const { lastSocketEvent } = useSocket() || {};
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Rework Modal State
  const [reworkSub, setReworkSub] = useState(null);
  const [reworkComment, setReworkComment] = useState('');
  const [submittingRework, setSubmittingRework] = useState(false);

  const loadSubmissions = async () => {
    try {
      const res = await api.submissions.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined
      });
      setSubmissions(res.submissions || []);
    } catch (err) {
      console.error('Failed to load submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [statusFilter]);

  // Real-time automatic updates on task submission or approval
  useEffect(() => {
    if (lastSocketEvent) {
      loadSubmissions();
    }
  }, [lastSocketEvent]);

  const handleApprove = async (sub) => {
    if (!window.confirm(`Approve task "${sub.task_title}" completed by ${sub.employee_name}?`)) return;
    try {
      await api.submissions.review(sub.id, 'Approved', 'Task deliverables reviewed and approved.');
      alert('Task approved successfully!');
      loadSubmissions();
    } catch (err) {
      alert(`Approval failed: ${err.message}`);
    }
  };

  const handleOpenReworkModal = (sub) => {
    setReworkSub(sub);
    setReworkComment('');
  };

  const handleConfirmRework = async (e) => {
    e.preventDefault();
    if (!reworkComment.trim()) {
      alert('Please provide detailed instructions explaining what needs rework.');
      return;
    }

    setSubmittingRework(true);
    try {
      await api.submissions.review(reworkSub.id, 'Rework Required', reworkComment.trim());
      alert('Rework requested. The employee has been notified in real time.');
      setReworkSub(null);
      loadSubmissions();
    } catch (err) {
      alert(`Rework request failed: ${err.message}`);
    } finally {
      setSubmittingRework(false);
    }
  };

  const pendingCount = submissions.filter(s => s.status === 'Submitted').length;

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Submission Approvals
            </h1>
            {pendingCount > 0 && (
              <span className="badge badge-submitted" style={{ fontSize: '0.8rem' }}>
                {pendingCount} Pending Review
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
            Review employee deliverables, inspect attached files, and either approve or request rework with clear guidance.
          </p>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-surface)', padding: '4px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          {['all', 'Submitted', 'Approved', 'Rework Required'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                backgroundColor: statusFilter === st ? 'var(--primary)' : 'transparent',
                color: statusFilter === st ? '#ffffff' : 'var(--text-muted)',
              }}
            >
              {st === 'all' ? 'All Submissions' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Submissions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {submissions.length > 0 ? (
          submissions.map((sub) => (
            <div
              key={sub.id}
              className="card"
              style={{
                borderLeft: `5px solid ${
                  sub.status === 'Approved'
                    ? '#10b981'
                    : sub.status === 'Rework Required'
                    ? '#f43f5e'
                    : '#06b6d4'
                }`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span className={`badge badge-${sub.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {sub.status}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      Submitted: {sub.submitted_at}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                    {sub.task_title}
                  </h3>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <User size={13} color="var(--primary)" />
                      <span>{sub.employee_name} ({sub.employee_code})</span>
                    </div>
                    {sub.task_category && (
                      <span>• Category: <strong>{sub.task_category}</strong></span>
                    )}
                    <span>• Priority: <strong className={`priority-${sub.task_priority?.toLowerCase()}`}>{sub.task_priority}</strong></span>
                  </div>
                </div>

                {/* Action Buttons for Pending Submissions */}
                {sub.status === 'Submitted' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleOpenReworkModal(sub)}
                      className="btn btn-secondary"
                      style={{ color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                    >
                      <RotateCcw size={15} />
                      <span>Request Rework</span>
                    </button>

                    <button
                      onClick={() => handleApprove(sub)}
                      className="btn btn-success"
                    >
                      <CheckCircle2 size={15} />
                      <span>Approve Work</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Completion Note */}
              {sub.submission_note && (
                <div
                  style={{
                    margin: '14px 0',
                    padding: '12px 16px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.88rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.5,
                  }}
                >
                  <strong style={{ color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
                    Employee Completion Notes:
                  </strong>
                  "{sub.submission_note}"
                </div>
              )}

              {/* Uploaded Files */}
              {sub.files && sub.files.length > 0 && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Uploaded Deliverable Files ({sub.files.length}):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {sub.files.map((file) => (
                      <a
                        key={file.id}
                        href={file.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 14px',
                          backgroundColor: 'var(--bg-main)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-medium)',
                          color: 'var(--primary)',
                          textDecoration: 'none',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                        }}
                      >
                        <Paperclip size={14} />
                        <span>{file.file_name}</span>
                        <Download size={13} color="var(--text-dim)" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Review History comment */}
              {sub.review_comment && (
                <div
                  style={{
                    marginTop: '14px',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: sub.status === 'Approved' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                    borderLeft: `4px solid ${sub.status === 'Approved' ? '#10b981' : '#f43f5e'}`,
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ fontWeight: 700, color: sub.status === 'Approved' ? '#10b981' : '#f43f5e', marginBottom: '2px' }}>
                    Reviewed by {sub.reviewed_by} on {sub.reviewed_at}:
                  </div>
                  <div style={{ color: 'var(--text-main)' }}>
                    {sub.review_comment}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="card" style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <FileCheck2 size={40} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>No Submissions Found</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              No completed task deliverables are matching your selected status filter.
            </p>
          </div>
        )}
      </div>

      {/* Rework Request Modal */}
      {reworkSub && (
        <div className="modal-overlay" onClick={() => setReworkSub(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f43f5e' }}>Request Rework</h3>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{reworkSub.task_title}</div>
              </div>
              <button onClick={() => setReworkSub(null)} className="btn-icon"><X size={18} /></button>
            </div>

            <form onSubmit={handleConfirmRework} style={{ padding: '24px' }}>
              <div className="form-group">
                <label className="form-label">Rework Instructions * (Mandatory)</label>
                <textarea
                  placeholder="e.g. Please correct the payment calculation formula on slide 4 and upload the updated PDF."
                  value={reworkComment}
                  onChange={(e) => setReworkComment(e.target.value)}
                  className="form-textarea"
                  style={{ minHeight: '120px' }}
                  required
                />
              </div>

              <div style={{ background: 'rgba(244, 63, 94, 0.1)', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: '#f43f5e', marginBottom: '20px' }}>
                ⚠️ The employee will immediately receive a high-priority notification with these instructions and can upload a revised submission.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setReworkSub(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submittingRework} className="btn btn-danger">
                  {submittingRework ? 'Submitting...' : 'Send Rework Instructions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
