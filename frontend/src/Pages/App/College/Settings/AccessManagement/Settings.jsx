import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Shield,
  Users,
  Database,
  Bell,
  Download,
  Upload,
  Trash2,
  Save
} from 'lucide-react';

const Settings = () => {
  const [settings, setSettings] = useState({
    general: {
      system_name: 'Permission Management System',
      default_permission_mode: 'unified',
      session_timeout: 30,
      max_login_attempts: 3
    },
    security: {
      password_policy: 'strong',
      two_factor_auth: true,
      audit_logging: true,
      data_encryption: true
    },
    notifications: {
      email_notifications: true,
      permission_changes: true,
      user_assignments: true,
      system_alerts: true
    },
    backup: {
      auto_backup: true,
      backup_frequency: 'daily',
      retention_days: 30
    }
  });

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSaveSettings = () => {
    console.log('Saving settings:', settings);
    // Here you would typically save to your backend
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>System Settings</h3>
        <button 
          onClick={handleSaveSettings}
          className="btn btn-primary d-flex align-items-center gap-2"
        >
          <Save size={16} />
          <span>Save Changes</span>
        </button>
      </div>

      <div className="row g-4">
        {/* General Settings */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0 d-flex align-items-center gap-2">
                <SettingsIcon size={16} />
                General Settings
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">System Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={settings.general.system_name}
                  onChange={(e) => handleSettingChange('general', 'system_name', e.target.value)}
                />
              </div>
              
              <div className="mb-3">
                <label className="form-label">Default Permission Mode</label>
                <select
                  className="form-select"
                  value={settings.general.default_permission_mode}
                  onChange={(e) => handleSettingChange('general', 'default_permission_mode', e.target.value)}
                >
                  <option value="unified">Unified</option>
                  <option value="hierarchical">Hierarchical</option>
                  <option value="lead_based">Lead Based</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Session Timeout (minutes)</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.general.session_timeout}
                  onChange={(e) => handleSettingChange('general', 'session_timeout', parseInt(e.target.value))}
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Max Login Attempts</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.general.max_login_attempts}
                  onChange={(e) => handleSettingChange('general', 'max_login_attempts', parseInt(e.target.value))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0 d-flex align-items-center gap-2">
                <Shield size={16} />
                Security Settings
              </h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Password Policy</label>
                <select
                  className="form-select"
                  value={settings.security.password_policy}
                  onChange={(e) => handleSettingChange('security', 'password_policy', e.target.value)}
                >
                  <option value="basic">Basic</option>
                  <option value="strong">Strong</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={settings.security.two_factor_auth}
                  onChange={(e) => handleSettingChange('security', 'two_factor_auth', e.target.checked)}
                />
                <label className="form-check-label">
                  Enable Two-Factor Authentication
                </label>
              </div>

              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={settings.security.audit_logging}
                  onChange={(e) => handleSettingChange('security', 'audit_logging', e.target.checked)}
                />
                <label className="form-check-label">
                  Enable Audit Logging
                </label>
              </div>

              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={settings.security.data_encryption}
                  onChange={(e) => handleSettingChange('security', 'data_encryption', e.target.checked)}
                />
                <label className="form-check-label">
                  Enable Data Encryption
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0 d-flex align-items-center gap-2">
                <Bell size={16} />
                Notification Settings
              </h5>
            </div>
            <div className="card-body">
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={settings.notifications.email_notifications}
                  onChange={(e) => handleSettingChange('notifications', 'email_notifications', e.target.checked)}
                />
                <label className="form-check-label">
                  Enable Email Notifications
                </label>
              </div>

              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={settings.notifications.permission_changes}
                  onChange={(e) => handleSettingChange('notifications', 'permission_changes', e.target.checked)}
                />
                <label className="form-check-label">
                  Notify on Permission Changes
                </label>
              </div>

              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={settings.notifications.user_assignments}
                  onChange={(e) => handleSettingChange('notifications', 'user_assignments', e.target.checked)}
                />
                <label className="form-check-label">
                  Notify on User Assignments
                </label>
              </div>

              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={settings.notifications.system_alerts}
                  onChange={(e) => handleSettingChange('notifications', 'system_alerts', e.target.checked)}
                />
                <label className="form-check-label">
                  Enable System Alerts
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Backup & Data Management */}
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5 className="card-title mb-0 d-flex align-items-center gap-2">
                <Database size={16} />
                Backup & Data Management
              </h5>
            </div>
            <div className="card-body">
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={settings.backup.auto_backup}
                  onChange={(e) => handleSettingChange('backup', 'auto_backup', e.target.checked)}
                />
                <label className="form-check-label">
                  Enable Auto Backup
                </label>
              </div>

              <div className="mb-3">
                <label className="form-label">Backup Frequency</label>
                <select
                  className="form-select"
                  value={settings.backup.backup_frequency}
                  onChange={(e) => handleSettingChange('backup', 'backup_frequency', e.target.value)}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Retention Period (days)</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.backup.retention_days}
                  onChange={(e) => handleSettingChange('backup', 'retention_days', parseInt(e.target.value))}
                />
              </div>

              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-outline-primary btn-sm">
                  <Download size={14} className="me-1" />
                  Export Data
                </button>
                <button className="btn btn-outline-success btn-sm">
                  <Upload size={14} className="me-1" />
                  Import Data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Actions */}
        <div className="col-12">
          <div className="card border-warning">
            <div className="card-header bg-warning bg-opacity-10">
              <h5 className="card-title mb-0 text-warning">
                System Actions
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-medium">Clear System Cache</div>
                      <div className="small text-muted">Clear all cached data and sessions</div>
                    </div>
                    <button className="btn btn-outline-warning btn-sm">
                      Clear Cache
                    </button>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-medium">System Maintenance</div>
                      <div className="small text-muted">Run system maintenance tasks</div>
                    </div>
                    <button className="btn btn-outline-info btn-sm">
                      Run Maintenance
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="col-12">
          <div className="card border-danger">
            <div className="card-header bg-danger bg-opacity-10">
              <h5 className="card-title mb-0 text-danger">
                Danger Zone
              </h5>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="fw-medium text-danger">Reset All Data</div>
                  <div className="small text-muted">This will permanently delete all users, roles, and settings</div>
                </div>
                <button className="btn btn-danger btn-sm">
                  <Trash2 size={14} className="me-1" />
                  Reset System
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;