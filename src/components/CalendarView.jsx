import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Clock,
  User,
  Filter,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

const TIME_SLOTS = [
  { label: '8:00 AM', hour: 8 },
  { label: '9:00 AM', hour: 9 },
  { label: '10:00 AM', hour: 10 },
  { label: '11:00 AM', hour: 11 },
  { label: '12:00 PM', hour: 12 },
  { label: '1:00 PM', hour: 13 },
  { label: '2:00 PM', hour: 14 },
  { label: '3:00 PM', hour: 15 },
  { label: '4:00 PM', hour: 16 },
  { label: '5:00 PM', hour: 17 },
  { label: '6:00 PM', hour: 18 },
  { label: '7:00 PM', hour: 19 },
];

const SLOT_HEIGHT = 72; // px per hour

function formatYMD(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function CalendarView({
  tasks = [],
  onSelectTask,
  onOpenCreateTask,
  onRefresh,
  isAdminOrManager = true
}) {
  const [viewMode, setViewMode] = useState('week'); // 'day' | 'week' | 'month'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedTask, setDraggedTask] = useState(null);
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Compute Monday of the current selected week
  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = (day + 6) % 7; // Monday is 0, Sunday is 6
    date.setDate(date.getDate() - diff);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const monday = getMonday(currentDate);

  // Generate the 7 days of the week (Monday - Sunday)
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return {
      name: dayNames[i],
      dateObj: d,
      dateString: formatYMD(d),
      dayNumber: d.getDate(),
      monthName: d.toLocaleDateString([], { month: 'short' }),
      isToday: formatYMD(d) === formatYMD(new Date())
    };
  });

  // Week navigation
  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - (viewMode === 'day' ? 1 : 7));
    setCurrentDate(d);
  };

  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (viewMode === 'day' ? 1 : 7));
    setCurrentDate(d);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Convert time "09:30" to decimal hours (9.5)
  const timeToDecimal = (timeStr) => {
    if (!timeStr) return 8;
    const [h, m] = timeStr.split(':').map(Number);
    return h + (m || 0) / 60;
  };

  // Drag and Drop Rescheduling
  const handleDragStart = (e, task) => {
    if (!isAdminOrManager) return;
    setDraggedTask(task);
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragOver = (e) => {
    if (!isAdminOrManager) return;
    e.preventDefault();
  };

  const handleDrop = async (e, dateString, targetHour) => {
    if (!isAdminOrManager || !draggedTask) return;
    e.preventDefault();

    // Calculate new start and end time based on drop hour
    const durationHours = Math.max(1, timeToDecimal(draggedTask.end_time) - timeToDecimal(draggedTask.start_time));
    const startH = String(targetHour).padStart(2, '0');
    const endH = String(Math.min(20, targetHour + Math.round(durationHours))).padStart(2, '0');

    const newStartTime = `${startH}:00`;
    const newEndTime = `${endH}:00`;

    try {
      await api.tasks.reschedule(draggedTask.id, {
        task_date: dateString,
        start_time: newStartTime,
        end_time: newEndTime
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Failed to reschedule task: ${err.message}`);
    } finally {
      setDraggedTask(null);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (filterEmployee !== 'all' && String(t.employee_id) !== filterEmployee) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Assigned': return 'badge-assigned';
      case 'In Progress': return 'badge-in-progress';
      case 'Submitted': return 'badge-submitted';
      case 'Approved': return 'badge-approved';
      case 'Rework Required': return 'badge-rework-required';
      case 'Overdue': return 'badge-overdue';
      case 'Cancelled': return 'badge-cancelled';
      default: return 'badge-assigned';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return '#ef4444';
      case 'High': return '#f97316';
      case 'Normal': return '#6366f1';
      case 'Low': return '#64748b';
      default: return '#6366f1';
    }
  };

  return (
    <div className="calendar-wrapper">
      {/* Calendar Header Toolbar */}
      <div className="calendar-header-toolbar">
        {/* Navigation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', padding: '2px', border: '1px solid var(--border-subtle)' }}>
            <button onClick={prevWeek} className="btn-icon" aria-label="Previous week">
              <ChevronLeft size={16} />
            </button>
            <button onClick={goToToday} className="btn btn-sm btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
              Today
            </button>
            <button onClick={nextWeek} className="btn-icon" aria-label="Next week">
              <ChevronRight size={16} />
            </button>
          </div>

          <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', marginLeft: '8px' }}>
            {weekDays[0].monthName} {weekDays[0].dayNumber} - {weekDays[6].monthName} {weekDays[6].dayNumber}, {weekDays[6].dateObj.getFullYear()}
          </div>
        </div>

        {/* Filters and View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Priority filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="form-select"
            style={{ width: '130px', padding: '6px 10px', fontSize: '0.8rem' }}
          >
            <option value="all">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>

          {/* View Mode Switcher */}
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-main)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            {['day', 'week', 'month'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  backgroundColor: viewMode === mode ? 'var(--primary)' : 'transparent',
                  color: viewMode === mode ? '#fff' : 'var(--text-muted)'
                }}
              >
                {mode}
              </button>
            ))}
          </div>

          {isAdminOrManager && (
            <button onClick={onOpenCreateTask} className="btn btn-primary btn-sm">
              <Plus size={15} />
              <span>Add Task</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Weekly Calendar Grid */}
      <div style={{ overflowX: 'auto', position: 'relative' }}>
        <div className="calendar-grid">
          {/* Top Left Corner */}
          <div
            style={{
              padding: '14px 8px',
              borderBottom: '1px solid var(--border-subtle)',
              borderRight: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-surface)',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: 'var(--text-dim)',
              textAlign: 'center',
              position: 'sticky',
              top: 0,
              zIndex: 20
            }}
          >
            TIME
          </div>

          {/* 7 Days Column Headers (Monday - Sunday) */}
          {weekDays.map((day) => (
            <div
              key={day.dateString}
              className={`calendar-day-header ${day.isToday ? 'today' : ''}`}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: day.isToday ? 'var(--primary)' : 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {day.name}
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  marginTop: '4px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  backgroundColor: day.isToday ? 'var(--primary)' : 'transparent',
                  color: day.isToday ? '#ffffff' : 'var(--text-main)',
                }}
              >
                {day.dayNumber}
              </div>
            </div>
          ))}

          {/* Left Vertical Hours Column */}
          <div className="calendar-time-col">
            {TIME_SLOTS.map((slot) => (
              <div key={slot.hour} className="time-slot-label" style={{ height: `${SLOT_HEIGHT}px` }}>
                {slot.label}
              </div>
            ))}
          </div>

          {/* Day Columns with Time Slots & Task Cards */}
          {weekDays.map((day) => {
            const dayTasks = filteredTasks.filter(t => t.task_date === day.dateString);

            return (
              <div
                key={day.dateString}
                className={`day-column ${day.isToday ? 'today' : ''}`}
                style={{ position: 'relative' }}
              >
                {/* Time slot drop targets */}
                {TIME_SLOTS.map((slot) => (
                  <div
                    key={slot.hour}
                    className="day-slot-cell"
                    style={{ height: `${SLOT_HEIGHT}px` }}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day.dateString, slot.hour)}
                  />
                ))}

                {/* Task Cards placed over the day column */}
                {dayTasks.map((task) => {
                  const startDec = timeToDecimal(task.start_time);
                  const endDec = timeToDecimal(task.end_time);

                  // Calculate position relative to 8:00 AM
                  const topOffset = Math.max(0, (startDec - 8) * SLOT_HEIGHT);
                  const cardHeight = Math.max(50, (endDec - startDec) * SLOT_HEIGHT - 6);

                  return (
                    <div
                      key={task.id}
                      draggable={isAdminOrManager}
                      onDragStart={(e) => handleDragStart(e, task)}
                      onClick={() => onSelectTask(task)}
                      className="task-calendar-card"
                      style={{
                        top: `${topOffset + 3}px`,
                        height: `${cardHeight}px`,
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                        borderTop: '1px solid var(--border-medium)',
                        borderRight: '1px solid var(--border-medium)',
                        borderBottom: '1px solid var(--border-medium)',
                      }}
                    >
                      {/* Top row: Priority & Status badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '2px' }}>
                        <span className={`badge ${getStatusBadgeClass(task.status)}`} style={{ padding: '1px 6px', fontSize: '0.68rem' }}>
                          {task.status}
                        </span>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: getPriorityColor(task.priority) }}>
                          {task.priority}
                        </span>
                      </div>

                      {/* Task Title */}
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          color: 'var(--text-main)',
                          lineHeight: 1.25,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          margin: '2px 0',
                        }}
                      >
                        {task.title}
                      </div>

                      {/* Bottom row: Employee name & Time range */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          {task.employee_image ? (
                            <img
                              src={task.employee_image}
                              alt=""
                              style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <User size={12} />
                          )}
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '85px' }}>
                            {task.employee_name}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                          <Clock size={11} />
                          <span>{task.start_time} - {task.end_time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
