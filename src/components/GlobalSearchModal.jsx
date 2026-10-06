import React, { useState, useEffect, useRef } from 'react';
import { Search, X, CheckSquare, User, Shield, Building, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export function GlobalSearchModal({ isOpen, onClose, onSelectTask, onSelectEmployee, onSelectDepartment }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ tasks: [], employees: [], managers: [], departments: [] });
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ tasks: [], employees: [], managers: [], departments: [] });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open search modal
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ tasks: [], employees: [], managers: [], departments: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search.query(query);
        setResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const totalResults =
    (results.tasks?.length || 0) +
    (results.employees?.length || 0) +
    (results.managers?.length || 0) +
    (results.departments?.length || 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', padding: 0, overflow: 'hidden' }}
      >
        {/* Search Input Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface-elevated)',
            gap: '12px',
          }}
        >
          <Search size={20} color="var(--primary)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type to search tasks, employees, managers, departments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-main)',
              fontSize: '1rem',
              fontFamily: 'inherit',
            }}
          />
          {query && (
            <button onClick={() => setQuery('')} className="btn-icon" aria-label="Clear search">
              <X size={16} />
            </button>
          )}
          <kbd
            style={{
              padding: '2px 8px',
              fontSize: '0.72rem',
              backgroundColor: 'var(--bg-main)',
              borderRadius: '4px',
              border: '1px solid var(--border-medium)',
              color: 'var(--text-muted)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results Container */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '16px 20px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              Searching organization database...
            </div>
          )}

          {!loading && query && totalResults === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-dim)' }}>
              No matching records found for "{query}".
            </div>
          )}

          {!loading && !query && (
            <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              Search across scheduled tasks, employees, managers, and departments.
            </div>
          )}

          {/* Tasks Results */}
          {results.tasks && results.tasks.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Tasks ({results.tasks.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {results.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      onSelectTask(task);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      border: '1px solid var(--border-subtle)',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <CheckSquare size={16} color="var(--primary)" />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                          {task.employee_name} • {task.task_date} ({task.start_time} - {task.end_time})
                        </div>
                      </div>
                    </div>
                    <span className={`badge badge-${task.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employees Results */}
          {results.employees && results.employees.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Employees ({results.employees.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {results.employees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => {
                      if (onSelectEmployee) onSelectEmployee(emp);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <User size={16} color="#10b981" />
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{emp.name} ({emp.employee_code})</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{emp.designation} • {emp.department_name}</div>
                      </div>
                    </div>
                    <ArrowRight size={14} color="var(--text-dim)" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Departments Results */}
          {results.departments && results.departments.length > 0 && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Departments ({results.departments.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {results.departments.map((dept) => (
                  <div
                    key={dept.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <Building size={16} color="#f59e0b" />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{dept.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{dept.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
