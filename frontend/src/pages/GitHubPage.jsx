import { useState, useEffect } from 'react';
import { api } from '../api';
import {
  GitBranch, Star, GitFork, Users, Flame, TrendingUp, ExternalLink
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

const LANG_COLORS = [
  '#6366f1', '#a855f7', '#22d3ee', '#34d399',
  '#fbbf24', '#fb7185', '#3b82f6', '#f97316',
];

export default function GitHubPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getGitHub()
      .then((res) => setData(res.github))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <div className="loading-text">Loading GitHub data...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <div className="page-header">
          <h2>GitHub Analytics</h2>
          <p>Your GitHub contribution insights</p>
        </div>
        <div className="card empty-state">
          <div className="empty-state-icon">🐙</div>
          <h3>{error || 'No GitHub data available'}</h3>
          <p>Make sure you've added your GitHub username in Settings. Data is fetched automatically by the worker service.</p>
        </div>
      </div>
    );
  }

  const profile = data.profile_data || {};

  return (
    <div>
      <div className="page-header animate-fade-in">
        <h2>GitHub Analytics</h2>
        <p>
          {profile.name || 'Your GitHub'} —{' '}
          {profile.html_url && (
            <a href={profile.html_url} target="_blank" rel="noopener noreferrer">
              View Profile <ExternalLink size={12} style={{ display: 'inline' }} />
            </a>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="stat-grid animate-fade-in animate-fade-in-delay-1">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(35,134,54,0.15)', color: '#4ade80' }}>
            <GitBranch size={20} />
          </div>
          <div className="stat-card-value">{data.total_repos}</div>
          <div className="stat-card-label">Repositories</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
            <Star size={20} />
          </div>
          <div className="stat-card-value">{data.total_stars}</div>
          <div className="stat-card-label">Total Stars</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
            <GitFork size={20} />
          </div>
          <div className="stat-card-value">{data.total_forks}</div>
          <div className="stat-card-label">Total Forks</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
            <Users size={20} />
          </div>
          <div className="stat-card-value">{data.followers}</div>
          <div className="stat-card-label">Followers</div>
        </div>
      </div>

      {/* Streaks */}
      <div className="card animate-fade-in animate-fade-in-delay-2" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title"><Flame size={18} /> Coding Streaks</div>
        </div>
        <div className="streak-display">
          <div className="streak-item">
            <div className="streak-value current">{data.current_streak}</div>
            <div className="streak-label">Current Streak</div>
          </div>
          <div className="streak-item">
            <div className="streak-value longest">{data.longest_streak}</div>
            <div className="streak-label">Longest Streak</div>
          </div>
          <div className="streak-item">
            <div className="streak-value" style={{ color: '#34d399' }}>{data.total_contributions}</div>
            <div className="streak-label">Total Contributions</div>
          </div>
        </div>
      </div>

      <div className="charts-grid animate-fade-in animate-fade-in-delay-3">
        {/* Contributions Chart */}
        {data.contribution_data && data.contribution_data.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="card-title"><TrendingUp size={18} /> Contribution Activity</div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.contribution_data}>
                  <defs>
                    <linearGradient id="ghGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(d) => d.slice(5)} axisLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: 13 }} />
                  <Area type="monotone" dataKey="count" stroke="#34d399" fill="url(#ghGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Languages */}
        {data.top_languages && data.top_languages.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Top Languages</div>
            </div>
            <div className="language-bars">
              {data.top_languages.map((lang, i) => {
                const max = data.top_languages[0].count;
                const pct = Math.round((lang.count / max) * 100);
                return (
                  <div key={lang.name} className="language-bar-item">
                    <span className="language-bar-name">{lang.name}</span>
                    <div className="language-bar-track">
                      <div className="language-bar-fill" style={{ width: `${pct}%`, background: LANG_COLORS[i % LANG_COLORS.length] }} />
                    </div>
                    <span className="language-bar-count">{lang.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Recent Repos */}
      {data.recent_repos && data.recent_repos.length > 0 && (
        <div className="card animate-fade-in animate-fade-in-delay-4" style={{ marginTop: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title"><GitBranch size={18} /> Recent Repositories</div>
          </div>
          <div className="repo-list">
            {data.recent_repos.map((repo) => (
              <a
                key={repo.name}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="repo-item"
                style={{ textDecoration: 'none' }}
              >
                <div className="repo-item-header">
                  <span className="repo-item-name">{repo.name}</span>
                  {repo.language && <span className="repo-item-lang">{repo.language}</span>}
                </div>
                {repo.description && <div className="repo-item-desc">{repo.description}</div>}
                <div className="repo-item-stats">
                  <span>⭐ {repo.stars}</span>
                  <span>🍴 {repo.forks}</span>
                  <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
