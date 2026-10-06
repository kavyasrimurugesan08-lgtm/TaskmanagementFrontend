import React, { useState, useEffect } from 'react';
import { Settings, Save, Building, Clock, UploadCloud, Bell, Check } from 'lucide-react';
import { api } from '../services/api';

export function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    phone: '',
    address: '',
    timezone: 'America/New_York',
    working_hours: { start: '08:00', end: '19:00' },
    max_upload_size: 25,
    allowed_file_types: ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg', 'zip'],
    task_categories: ['Technical', 'Designing', 'Academic'],
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.settings.get();
        if (res.company && res.settings) {
          setFormData({
            company_name: res.company.company_name || '',
            email: res.company.email || '',
            phone: res.company.phone || '',
            address: res.company.address || '',
            timezone: res.settings.timezone || 'America/New_York',
            working_hours: res.settings.working_hours || { start: '08:00', end: '19:00' },
            max_upload_size: res.settings.max_upload_size || 25,
            allowed_file_types: res.settings.allowed_file_types || ['pdf', 'docx', 'xlsx', 'png', 'jpg', 'jpeg', 'zip'],
            task_categories: res.settings.task_categories || ['Technical', 'Designing', 'Academic'],
          });
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.settings.update(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(`Save error: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Company Settings & Configuration
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '2px' }}>
          Configure enterprise operational hours, timezone, upload constraints, and default task categories.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Organization Info */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Building size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Organization Profile
            </h3>
          </div>

          <div className="form-group">
            <label className="form-label">Company Name *</label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="form-input"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Company Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Office Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="form-input"
            />
          </div>
        </div>

        {/* Operating Hours & Timezone */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Clock size={18} color="#f59e0b" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Operating Hours & Weekly Scheduling
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Day Start Time</label>
              <input
                type="time"
                value={formData.working_hours.start}
                onChange={(e) => setFormData({
                  ...formData,
                  working_hours: { ...formData.working_hours, start: e.target.value }
                })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Day End Time</label>
              <input
                type="time"
                value={formData.working_hours.end}
                onChange={(e) => setFormData({
                  ...formData,
                  working_hours: { ...formData.working_hours, end: e.target.value }
                })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Organization Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="form-select"
              >
                <option value="America/New_York">Eastern Time (ET - America/New_York)</option>
                <option value="America/Chicago">Central Time (CT - America/Chicago)</option>
                <option value="America/Denver">Mountain Time (MT - America/Denver)</option>
                <option value="America/Los_Angeles">Pacific Time (PT - America/Los_Angeles)</option>
                <option value="Europe/London">Greenwich Mean Time (GMT - Europe/London)</option>
                <option value="Asia/Kolkata">India Standard Time (IST - Asia/Kolkata)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Deliverables Upload Rules */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <UploadCloud size={18} color="#06b6d4" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Task Deliverable Upload Rules
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Max File Size (MB)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.max_upload_size}
                onChange={(e) => setFormData({ ...formData, max_upload_size: Number(e.target.value) })}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Allowed File Extensions</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                {formData.allowed_file_types.map((ext) => (
                  <span
                    key={ext}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.8rem',
                      fontFamily: 'var(--font-mono)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--primary)',
                    }}
                  >
                    .{ext}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          {saved && (
            <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={16} />
              Settings Saved Successfully
            </span>
          )}
          <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
            <Save size={16} />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
}
