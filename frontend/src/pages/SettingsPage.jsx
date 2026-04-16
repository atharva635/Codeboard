import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import { Settings, User, Github, Code2, Shield, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const [form, setForm] = useState({
    github_username: user?.github_username || '',
    leetcode_username: user?.leetcode_username || '',
  });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const data = await api.updateProfile(form);
      updateUser(data.user);
      setMessage({ type: 'success', text: 'Profile updated successfully! Data will be fetched on next worker run.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setMessage({ type: '', text: '' });
    try {
      const data = await api.syncNow();
      const parts = [];
      if (data.results.github === 'success') parts.push('✅ GitHub data fetched');
      if (data.results.leetcode === 'success') parts.push('✅ LeetCode data fetched');
      if (data.results.errors?.length > 0) parts.push('⚠️ ' + data.results.errors.join(', '));
      setMessage({ type: parts.length > 0 && !data.results.errors?.length ? 'success' : 'error', text: parts.join(' | ') || 'No platforms configured. Add usernames above first.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <div className="page-header animate-fade-in">
        <h2>Settings</h2>
        <p>Manage your account and connected platforms</p>
      </div>

      {/* Profile Section */}
      <div className="card animate-fade-in animate-fade-in-delay-1" style={{ marginBottom: '1.5rem' }}>
        <div className="settings-section">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} /> Account Information
          </h3>
          <div className="settings-form">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" value={user?.username || ''} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={user?.email || ''} disabled />
            </div>
            <div className="form-group">
              <label className="form-label">Member Since</label>
              <input className="form-input" value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : ''} disabled />
            </div>
          </div>
        </div>
      </div>

      {/* Platform Usernames */}
      <div className="card animate-fade-in animate-fade-in-delay-2" style={{ marginBottom: '1.5rem' }}>
        <div className="settings-section">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={20} /> Connected Platforms
          </h3>

          {message.text && (
            <div className={`alert alert-${message.type}`}>{message.text}</div>
          )}

          <form onSubmit={handleSave}>
            <div className="settings-form">
              <div className="form-group">
                <label className="form-label" htmlFor="settings-github">
                  <Github size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                  GitHub Username
                </label>
                <input
                  id="settings-github"
                  name="github_username"
                  className="form-input"
                  placeholder="e.g., torvalds"
                  value={form.github_username}
                  onChange={handleChange}
                />
                <p className="form-hint">Your public GitHub username. Used to fetch repos, contributions, and stats.</p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="settings-leetcode">
                  <Code2 size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
                  LeetCode Username
                </label>
                <input
                  id="settings-leetcode"
                  name="leetcode_username"
                  className="form-input"
                  placeholder="e.g., neal_wu"
                  value={form.leetcode_username}
                  onChange={handleChange}
                />
                <p className="form-hint">Your LeetCode username. Used to fetch solved problems, rankings, and submissions.</p>
              </div>

              <div className="settings-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={handleSync} disabled={syncing} style={{ gap: '0.4rem' }}>
                  <RefreshCw size={15} className={syncing ? 'spinning' : ''} style={syncing ? { animation: 'spin 1s linear infinite' } : {}} />
                  {syncing ? 'Syncing...' : '⚡ Sync Now'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Info Section */}
      <div className="card animate-fade-in animate-fade-in-delay-3" style={{ marginBottom: '1.5rem' }}>
        <div className="settings-section">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Settings size={20} /> How It Works
          </h3>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
            <p>📡 <strong>Automatic Data Fetching:</strong> The worker service runs every 6 hours and fetches your latest data from GitHub and LeetCode.</p>
            <p style={{ marginTop: '0.5rem' }}>🐙 <strong>GitHub API:</strong> Uses the GitHub REST API v3 (public data, no token required). Add a personal access token in the worker config for higher rate limits.</p>
            <p style={{ marginTop: '0.5rem' }}>🧩 <strong>LeetCode API:</strong> Uses LeetCode's public GraphQL API at <code>leetcode.com/graphql</code>. No authentication needed for public profiles.</p>
            <p style={{ marginTop: '0.5rem' }}>🐳 <strong>DevOps:</strong> The entire application is containerized with Docker and can be deployed using Kubernetes.</p>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card animate-fade-in animate-fade-in-delay-4">
        <div className="settings-section">
          <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚠️ Danger Zone
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            Logging out will clear your session. You can log back in anytime.
          </p>
          <button className="btn btn-danger" onClick={logout}>
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
