import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Send, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';

export function NotificationsPage() {
  const { lastSocketEvent, addToast } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Send Message form state
  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await api.notifications.getAll();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Real-time notification updates
  useEffect(() => {
    if (lastSocketEvent?.type === 'notification_created' || lastSocketEvent) {
      loadNotifications();
    }
  }, [lastSocketEvent]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageBody.trim()) return;

    setIsSending(true);
    try {
      await api.notifications.send({
        title: messageTitle.trim() || undefined,
        message: messageBody.trim(),
        type: 'Manager Broadcast'
      });
      setMessageTitle('');
      setMessageBody('');
      setSendSuccess(true);
      addToast?.('Message Sent', 'Notification posted to panel successfully', 'success');
      setTimeout(() => setSendSuccess(false), 3000);
      loadNotifications();
    } catch (err) {
      alert(`Failed to send notification: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await api.notifications.markRead(id);
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      loadNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Notification Center
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
            System updates, employee messages, task alerts, and manager broadcasts.
          </p>
        </div>

        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn btn-secondary btn-sm">
            <CheckCheck size={14} />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Send Message to Panel Card */}
      <div className="card" style={{ marginBottom: '24px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageSquare size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Send Message to Notification Panel
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              Post an announcement or send a direct alert to the notification feed
            </p>
          </div>
        </div>

        <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Title / Subject (Optional e.g. Important Announcement)"
            value={messageTitle}
            onChange={(e) => setMessageTitle(e.target.value)}
            className="form-input"
            style={{ fontSize: '0.86rem' }}
          />

          <textarea
            placeholder="Type your message here..."
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            className="form-input"
            rows={3}
            style={{ resize: 'vertical', fontSize: '0.86rem', minHeight: '70px' }}
            required
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {sendSuccess ? (
              <span style={{ color: '#10b981', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} /> Message posted to notification panel!
              </span>
            ) : <span />}

            <button
              type="submit"
              disabled={isSending || !messageBody.trim()}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', fontSize: '0.84rem' }}
            >
              <Send size={15} />
              <span>{isSending ? 'Sending...' : 'Send Message'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Notifications List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '12px 20px', backgroundColor: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Notification Feed ({notifications.length})
        </div>

        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div
              key={n.id}
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '16px',
                backgroundColor: n.is_read ? 'transparent' : 'rgba(99, 102, 241, 0.05)',
                transition: 'background 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: n.type === 'Employee Message' ? 'rgba(16, 185, 129, 0.15)' : (n.is_read ? 'var(--bg-surface-elevated)' : 'rgba(99, 102, 241, 0.2)'),
                    color: n.type === 'Employee Message' ? '#10b981' : (n.is_read ? 'var(--text-dim)' : 'var(--primary)'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  {n.type === 'Employee Message' ? <MessageSquare size={18} /> : <Bell size={18} />}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{n.title}</span>
                    {n.type === 'Employee Message' && (
                      <span className="badge badge-approved" style={{ fontSize: '0.65rem', padding: '1px 6px' }}>Employee Msg</span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '6px' }}>
                    {n.created_at}
                  </div>
                </div>
              </div>

              {!n.is_read && (
                <button
                  onClick={() => handleMarkRead(n.id)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                >
                  <Check size={12} />
                  <span>Mark Read</span>
                </button>
              )}
            </div>
          ))
        ) : (
          <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-dim)' }}>
            <Bell size={36} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>No notifications yet</h3>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>You will see real-time updates and task notifications here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
