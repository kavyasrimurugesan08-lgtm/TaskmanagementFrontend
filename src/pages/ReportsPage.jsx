import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Filter,
  FileSpreadsheet,
  FileText,
  Calendar,
  Layers,
  Users,
  CheckCircle,
  Clock,
  RotateCcw,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { api } from '../services/api';

export function ReportsPage() {
  const [data, setData] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [deptFilter, setDeptFilter] = useState('all');
  const [empFilter, setEmpFilter] = useState('all');

  const loadReports = async () => {
    try {
      const [repRes, empRes, deptRes] = await Promise.all([
        api.reports.getMetrics({
          start_date: dateRange.start || undefined,
          end_date: dateRange.end || undefined,
          department_id: deptFilter !== 'all' ? deptFilter : undefined,
          employee_id: empFilter !== 'all' ? empFilter : undefined
        }),
        api.employees.getAll(),
        api.departments.getAll()
      ]);
      setData(repRes);
      setEmployees(empRes.employees || []);
      setDepartments(deptRes.departments || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [dateRange, deptFilter, empFilter]);

  // Export to CSV
  const handleExportCSV = () => {
    if (!data?.exportTasks || data.exportTasks.length === 0) {
      alert('No data available to export.');
      return;
    }

    const headers = ['Task ID', 'Title', 'Category', 'Priority', 'Date', 'Start Time', 'End Time', 'Status', 'Employee', 'Department', 'Manager'];
    const rows = data.exportTasks.map(t => [
      t.id,
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.category,
      t.priority,
      t.task_date,
      t.start_time,
      t.end_time,
      t.status,
      `"${t.employee_name} (${t.employee_code})"`,
      t.department_name || '',
      t.manager_name || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inkepen_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel using XLSX
  const handleExportExcel = () => {
    if (!data?.exportTasks || data.exportTasks.length === 0) {
      alert('No data available to export.');
      return;
    }

    const worksheetData = data.exportTasks.map(t => ({
      'Task ID': t.id,
      'Title': t.title,
      'Category': t.category,
      'Priority': t.priority,
      'Date': t.task_date,
      'Start Time': t.start_time,
      'End Time': t.end_time,
      'Status': t.status,
      'Assignee': `${t.employee_name} (${t.employee_code})`,
      'Department': t.department_name,
      'Manager': t.manager_name
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
    XLSX.writeFile(workbook, `Inkepen_Analytics_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Export to PDF using jsPDF
  const handleExportPDF = () => {
    if (!data?.exportTasks || data.exportTasks.length === 0) {
      alert('No data available to export.');
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Inkepen Enterprise Executive Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    doc.text(`Total Tasks: ${data.summary?.totalTasks || 0} | Approved: ${data.summary?.Approved || 0} | Pending Review: ${data.summary?.Submitted || 0}`, 14, 34);

    let y = 46;
    doc.setFontSize(9);
    doc.text('ID', 14, y);
    doc.text('Task Title', 26, y);
    doc.text('Assignee', 90, y);
    doc.text('Date', 135, y);
    doc.text('Status', 165, y);
    y += 4;
    doc.line(14, y, 196, y);
    y += 6;

    data.exportTasks.slice(0, 30).forEach((t) => {
      if (y > 275) {
        doc.addPage();
        y = 20;
      }
      doc.text(String(t.id), 14, y);
      doc.text(t.title.length > 32 ? t.title.substring(0, 30) + '...' : t.title, 26, y);
      doc.text(t.employee_name.length > 20 ? t.employee_name.substring(0, 18) + '...' : t.employee_name, 90, y);
      doc.text(t.task_date, 135, y);
      doc.text(t.status, 165, y);
      y += 7;
    });

    doc.save(`Inkepen_Executive_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const summary = data?.summary || {};

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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Analytics & Reports
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
            Auditable throughput metrics, department workload, and executive exports (CSV, Excel, PDF).
          </p>
        </div>

        {/* Functional Export Buttons */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExportCSV} className="btn btn-secondary btn-sm" title="Export as CSV">
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button onClick={handleExportExcel} className="btn btn-secondary btn-sm" style={{ color: '#10b981' }} title="Export as Excel Workbook">
            <FileSpreadsheet size={14} />
            <span>Export Excel</span>
          </button>
          <button onClick={handleExportPDF} className="btn btn-primary btn-sm" title="Export formatted PDF">
            <FileText size={14} />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>From Date</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="form-input"
            style={{ width: '150px', height: '38px' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>To Date</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="form-input"
            style={{ width: '150px', height: '38px' }}
          />
        </div>

        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Department</label>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="form-select"
            style={{ width: '170px', height: '38px' }}
          >
            <option value="all">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', display: 'block', marginBottom: '4px', textTransform: 'uppercase' }}>Employee</label>
          <select
            value={empFilter}
            onChange={(e) => setEmpFilter(e.target.value)}
            className="form-select"
            style={{ width: '170px', height: '38px' }}
          >
            <option value="all">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>

        {(dateRange.start || dateRange.end) && (
          <button
            onClick={() => setDateRange({ start: '', end: '' })}
            className="btn btn-secondary btn-sm"
            style={{ marginTop: '18px' }}
          >
            Clear Dates
          </button>
        )}
      </div>

      {/* Status Breakdown Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Total Tasks</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>{summary.totalTasks || 0}</div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '3px solid #3b82f6' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Assigned</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#3b82f6', marginTop: '4px' }}>{summary.Assigned || 0}</div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '3px solid #f59e0b' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>In Progress</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>{summary['In Progress'] || 0}</div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '3px solid #06b6d4' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Submitted</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#06b6d4', marginTop: '4px' }}>{summary.Submitted || 0}</div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '3px solid #10b981' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Approved</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>{summary.Approved || 0}</div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '3px solid #f43f5e' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Rework Req.</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f43f5e', marginTop: '4px' }}>{summary['Rework Required'] || 0}</div>
        </div>

        <div className="card" style={{ padding: '16px', borderLeft: '3px solid #ef4444' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Overdue</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>{summary.Overdue || 0}</div>
        </div>
      </div>

      {/* Two Column Section: Department Workload & Employee Workload */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Department Volume */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>
            Tasks by Department
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data?.departmentCounts && data.departmentCounts.length > 0 ? (
              data.departmentCounts.map((dept, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>{dept.department_name}</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>{dept.task_count} tasks</span>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No department data available.</div>
            )}
          </div>
        </div>

        {/* Employee Workload Summary */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-main)' }}>
            Employee Throughput
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {data?.employeeWorkload && data.employeeWorkload.length > 0 ? (
              data.employeeWorkload.map((ew, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{ew.employee_name} ({ew.employee_code})</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      Approved: {ew.approved_tasks} | Submitted: {ew.submitted_tasks} | In Progress: {ew.in_progress_tasks}
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    {ew.total_tasks} Total
                  </span>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No employee workload records available.</div>
            )}
          </div>
        </div>
      </div>

      {/* Exportable Task Records Preview Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Filtered Dataset Preview ({data?.exportTasks?.length || 0} Records)
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Ready for CSV, Excel, or PDF Export
          </span>
        </div>

        <div style={{ overflowX: 'auto', maxHeight: '360px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                <th style={{ padding: '10px 16px' }}>ID</th>
                <th style={{ padding: '10px 16px' }}>Task Title</th>
                <th style={{ padding: '10px 16px' }}>Employee</th>
                <th style={{ padding: '10px 16px' }}>Department</th>
                <th style={{ padding: '10px 16px' }}>Date</th>
                <th style={{ padding: '10px 16px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {data?.exportTasks?.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 16px', color: 'var(--text-dim)' }}>#{t.id}</td>
                  <td style={{ padding: '10px 16px', fontWeight: 600 }}>{t.title}</td>
                  <td style={{ padding: '10px 16px' }}>{t.employee_name}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--text-muted)' }}>{t.department_name}</td>
                  <td style={{ padding: '10px 16px' }}>{t.task_date}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <span className={`badge badge-${t.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
