import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children, employeePortalContext = null }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [toasts, setToasts] = useState([]);
  const [lastSocketEvent, setLastSocketEvent] = useState(null);

  const addToast = (title, message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, title, message, type }]);

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    // Determine companyId and user info from either logged in user or employee portal
    const companyId = user?.company_id || employeePortalContext?.company_id;
    const role = user?.role || (employeePortalContext ? 'employee' : null);
    const userId = user?.id || employeePortalContext?.id;

    const socketTarget = (typeof window !== 'undefined' && (window.location.port === '5173' || window.location.port === '5174'))
      ? 'http://localhost:5000'
      : '/';

    const socket = io(socketTarget, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (companyId) {
        socket.emit('join_company', companyId);
      }
      if (role && userId) {
        socket.emit('join_user', { role, id: userId, companyId });
      }
    });

    socket.on('new_notification', (data) => {
      addToast(data.title || 'New Notification', data.message, 'info');
      setLastSocketEvent({ type: 'new_notification', data, timestamp: Date.now() });
    });

    socket.on('task_created', (task) => {
      addToast('Task Created', `"${task.title}" scheduled for ${task.employee_name}`, 'success');
      setLastSocketEvent({ type: 'task_created', task, timestamp: Date.now() });
    });

    socket.on('task_rescheduled', (task) => {
      addToast('Task Rescheduled', `"${task.title}" moved to ${task.task_date} (${task.start_time})`, 'info');
      setLastSocketEvent({ type: 'task_rescheduled', task, timestamp: Date.now() });
    });

    socket.on('task_status_changed', (task) => {
      addToast('Task Status Updated', `"${task.title}" is now ${task.status}`, 'warning');
      setLastSocketEvent({ type: 'task_status_changed', task, timestamp: Date.now() });
    });

    socket.on('task_submitted', (data) => {
      addToast('Deliverables Submitted', `${data.task?.employee_name} submitted work for "${data.task?.title}"`, 'success');
      setLastSocketEvent({ type: 'task_submitted', data, timestamp: Date.now() });
    });

    socket.on('activity_logged', (log) => {
      setLastSocketEvent({ type: 'activity_logged', log, timestamp: Date.now() });
    });

    socket.on('attendance_update', (data) => {
      setLastSocketEvent({ type: 'attendance_update', data, timestamp: Date.now() });
    });

    socket.on('employee_created', (employee) => {
      addToast('Employee Registered', `${employee.name} added to company directory`, 'success');
      setLastSocketEvent({ type: 'employee_created', employee, timestamp: Date.now() });
    });

    socket.on('employee_updated', (employee) => {
      setLastSocketEvent({ type: 'employee_updated', employee, timestamp: Date.now() });
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.company_id, user?.id, user?.role, employeePortalContext?.id]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        toasts,
        addToast,
        removeToast,
        lastSocketEvent
      }}
    >
      {children}
      {/* Toast Render Viewport */}
      <div className="toast-container" role="region" aria-label="Notifications">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '2px', color: 'var(--text-main)' }}>
                {toast.title}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              style={{ color: 'var(--text-dim)', fontSize: '1rem', padding: '0 4px', lineHeight: 1 }}
              aria-label="Dismiss toast"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
