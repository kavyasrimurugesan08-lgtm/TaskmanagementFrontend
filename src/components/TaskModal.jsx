import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Shield,
  Tag,
  Paperclip,
  Send,
  Download,
  AlertTriangle,
  CheckCircle,
  FileText,
  Trash2
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function TaskModal({ task: initialTask, onClose, onRefresh, isAdminOrManager = true }) {
  const { user } = useAuth();
  const [taskDetail, setTaskDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [status, setStatus] = useState(initialTask.status);

  useEffect(() => {
    async function loadTask() {
      try {
        const res = await api.tasks.getOne(initialTask.id);
        setTaskDetail(res.task);
        setStatus(res.task.status);
      } catch (err) {
        console.error('Failed to load task details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTask();
  }, [initialTask.id]);

  const handleStatusChange = async (newStatus) => {
    try {
      await api.tasks.updateStatus(initialTask.id, newStatus);
      setStatus(newStatus);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await api.tasks.addComment(initialTask.id, newComment);
      setTaskDetail(prev => ({
        ...prev,
        comments: [...(prev.comments || []), res.comment]
      }));
      setNewComment('');
    } catch (err) {
      alert(`Failed to add comment: ${err.message}`);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete or cancel "${initialTask.title}"?`)) return;
    try {
      await api.tasks.delete(initialTask.id);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const t = taskDetail || initialTask;

  const validStatuses = [
    'Assigned',
    'In Progress',
    'Submitted',
    'Approved',
    'Rework Required',
    'Overdue',
    'Cancelled'
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            backgroundColor: 'var(--bg-surface-elevated)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className={`badge badge-${status.toLowerCase().replace(/\s+/g, '-')}`}>
                {status}
              </span>
              <span className={`priority-chip priority-${t.priority.toLowerCase()}`}>
                ● {t.priority} Priority
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', background: 'var(--bg-main)', padding: '2px 8px', borderRadius: '4px' }}>
                {t.category || 'General'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.3 }}>
              {t.title}
            </h2>
          </div>

          <button onClick={onClose} className="btn-icon" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Key Meta Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              padding: '16px',
              backgroundColor: 'var(--bg-main)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                Assigned Employee
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontWeight: 600, fontSize: '0.85rem' }}>
                <User size={14} color="var(--primary)" />
                <span>{t.employee_name || 'Unassigned'}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                Supervising Manager
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Shield size={14} color="#10b981" />
                <span>{t.manager_name || 'System Admin'}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                Scheduled Date
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Calendar size={14} color="var(--primary)" />
                <span>{t.task_date}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>
                Time Window
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontWeight: 600, fontSize: '0.85rem' }}>
                <Clock size={14} color="var(--primary)" />
                <span>{t.start_time} - {t.end_time}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '6px' }}>
              Description & Objectives
            </h4>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: 'var(--bg-surface-elevated)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              {t.description || 'No detailed instructions provided.'}
            </div>
          </div>

          {/* Status Switcher (Admin / Manager) */}
          {isAdminOrManager && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-surface-elevated)', padding: '12px 16px', borderRadius: 'var(--radius-md)' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Update Status:
              </span>
              <select
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="form-select"
                style={{ width: 'auto', flex: 1, padding: '6px 12px', fontSize: '0.85rem' }}
              >
                {validStatuses.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          )}

          {/* Submissions Section */}
          <div>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px' }}>
              Submissions & Deliverables ({taskDetail?.submissions?.length || 0})
            </h4>

            {taskDetail?.submissions && taskDetail.submissions.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {taskDetail.submissions.map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      padding: '14px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className={`badge badge-${sub.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {sub.status}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        Submitted on {sub.submitted_at}
                      </span>
                    </div>

                    {sub.submission_note && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '10px', fontStyle: 'italic' }}>
                        "{sub.submission_note}"
                      </p>
                    )}

                    {/* Files */}
                    {sub.files && sub.files.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                        {sub.files.map((file) => (
                          <a
                            key={file.id}
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 10px',
                              backgroundColor: 'var(--bg-main)',
                              border: '1px solid var(--border-medium)',
                              borderRadius: 'var(--radius-sm)',
                              color: 'var(--primary)',
                              fontSize: '0.78rem',
                              textDecoration: 'none',
                              fontWeight: 600,
                            }}
                          >
                            <Paperclip size={13} />
                            <span>{file.file_name}</span>
                            <Download size={12} color="var(--text-muted)" />
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Manager Review Comment */}
                    {sub.review_comment && (
                      <div
                        style={{
                          marginTop: '8px',
                          padding: '10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: sub.status === 'Approved' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                          borderLeft: `3px solid ${sub.status === 'Approved' ? '#10b981' : '#f43f5e'}`,
                          fontSize: '0.8rem',
                        }}
                      >
                        <div style={{ fontWeight: 700, color: sub.status === 'Approved' ? '#10b981' : '#f43f5e' }}>
                          Manager Review ({sub.reviewed_by}):
                        </div>
                        <div style={{ color: 'var(--text-main)', marginTop: '2px' }}>
                          {sub.review_comment}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '16px', textAlign: 'center', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                No completed work submitted yet.
              </div>
            )}
          </div>

          {/* Comments Discussion Thread */}
          <div>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '8px' }}>
              Activity Comments ({taskDetail?.comments?.length || 0})
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', marginBottom: '12px' }}>
              {taskDetail?.comments && taskDetail.comments.length > 0 ? (
                taskDetail.comments.map((c) => (
                  <div key={c.id} style={{ padding: '8px 12px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-main)' }}>
                        {c.user_name} ({c.user_role})
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                        {c.created_at}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{c.comment}</p>
                  </div>
                ))
              ) : (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  No comments yet. Start a discussion below.
                </div>
              )}
            </div>

            {/* Comment Input */}
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Write a comment or update..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="form-input"
                style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !newComment.trim()}
                className="btn btn-primary btn-sm"
              >
                <Send size={14} />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-surface-elevated)',
          }}
        >
          {isAdminOrManager ? (
            <button
              onClick={handleDelete}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#f43f5e',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              <Trash2 size={15} />
              <span>Delete Task</span>
            </button>
          ) : <div />}

          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
