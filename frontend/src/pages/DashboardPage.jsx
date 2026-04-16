import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { api } from '../api';
import {
  GitBranch, Star, Users, Code2, Flame, Trophy,
  TrendingUp, Activity, Github, Clock
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid
} from 'recharts';

const LANG_COLORS = [
  '#6366f1', '#a855f7', '#22d3ee', '#34d399',
  '#fbbf24', '#fb7185', '#3b82f6', '#f97316',
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getDashboard()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <div className="loading-text">Loading your dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚠️</div>
        <h3>Error loading dashboard</h3>
        <p>{error}</p>
      </div>
    );
  }

  const gh = data?.github;
  const lc = data?.leetcode;
  const activity = data?.activity || [];

  const hasData = gh || lc;

  return (
    <div>
      <div className="page-header animate-fade-in">
        <h2>Welcome back, {user?.username} 👋</h2>
        <p>Here's your coding activity overview</p>
      </div>

      {!hasData ? (
        <div className="card empty-state animate-fade-in animate-fade-in-delay-1">
          <div className="empty-state-icon">📊</div>
          <h3>No data yet</h3>
          <p>
            Go to <strong>Settings</strong> and add your GitHub/LeetCode usernames.
            The worker service will fetch your data automatically.
          </p>
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="stat-grid animate-fade-in animate-fade-in-delay-1">
            {gh && (
              <>
                <div className="stat-card" style={{ '--stat-accent': 'var(--gradient-github)' }}>
                  <div className="stat-card-icon" style={{ background: 'rgba(35,134,54,0.15)', color: '#4ade80' }}>
                    <GitBranch size={20} />
                  </div>
                  <div className="stat-card-value">{gh.total_repos}</div>
                  <div className="stat-card-label">Repositories</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
                    <Star size={20} />
                  </div>
                  <div className="stat-card-value">{gh.total_stars}</div>
                  <div className="stat-card-label">Total Stars</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
                    <Users size={20} />
                  </div>
                  <div className="stat-card-value">{gh.followers}</div>
                  <div className="stat-card-label">Followers</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon" style={{ background: 'rgba(251,113,133,0.15)', color: '#fb7185' }}>
                    <Flame size={20} />
                  </div>
                  <div className="stat-card-value">{gh.current_streak}</div>
                  <div className="stat-card-label">Day Streak</div>
                </div>
              </>
            )}
            {lc && (
              <>
                <div className="stat-card" style={{ '--stat-accent': 'var(--gradient-leetcode)' }}>
                  <div className="stat-card-icon" style={{ background: 'rgba(255,161,22,0.15)', color: '#fbbf24' }}>
                    <Code2 size={20} />
                  </div>
                  <div className="stat-card-value">{lc.total_solved}</div>
                  <div className="stat-card-label">Problems Solved</div>
                </div>
                <div className="stat-card">
                  <div className="stat-card-icon" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
                    <Trophy size={20} />
                  </div>
                  <div className="stat-card-value">#{lc.ranking?.toLocaleString()}</div>
                  <div className="stat-card-label">LeetCode Rank</div>
                </div>
              </>
            )}
          </div>

          {/* Charts */}
          <div className="charts-grid animate-fade-in animate-fade-in-delay-2">
            {/* Contributions Chart */}
            {gh?.contribution_data && gh.contribution_data.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <TrendingUp size={18} /> Contributions (Last 30 Days)
                  </div>
                  <span className="badge badge-github">GitHub</span>
                </div>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={gh.contribution_data}>
                      <defs>
                        <linearGradient id="contribGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickFormatter={(d) => d.slice(5)}
                        axisLine={false}
                      />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: '#1e293b',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 8,
                          color: '#f1f5f9',
                          fontSize: 13,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#6366f1"
                        fill="url(#contribGrad)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* LeetCode Difficulty Breakdown */}
            {lc && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <Code2 size={18} /> Problem Difficulty
                  </div>
                  <span className="badge badge-leetcode">LeetCode</span>
                </div>
                <div className="difficulty-rings">
                  <DifficultyRing label="Easy" solved={lc.easy_solved} total={lc.total_questions} color="#34d399" />
                  <DifficultyRing label="Medium" solved={lc.medium_solved} total={lc.total_questions} color="#fbbf24" />
                  <DifficultyRing label="Hard" solved={lc.hard_solved} total={lc.total_questions} color="#fb7185" />
                </div>
              </div>
            )}

            {/* Top Languages */}
            {gh?.top_languages && gh.top_languages.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <Github size={18} /> Top Languages
                  </div>
                </div>
                <div className="language-bars">
                  {gh.top_languages.map((lang, i) => {
                    const maxCount = gh.top_languages[0].count;
                    const pct = Math.round((lang.count / maxCount) * 100);
                    return (
                      <div key={lang.name} className="language-bar-item">
                        <span className="language-bar-name">{lang.name}</span>
                        <div className="language-bar-track">
                          <div
                            className="language-bar-fill"
                            style={{
                              width: `${pct}%`,
                              background: LANG_COLORS[i % LANG_COLORS.length],
                            }}
                          />
                        </div>
                        <span className="language-bar-count">{lang.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* LeetCode Submissions */}
            {lc?.recent_submissions && lc.recent_submissions.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    <Activity size={18} /> Recent Submissions
                  </div>
                  <span className="badge badge-leetcode">Last 30 days</span>
                </div>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={lc.recent_submissions}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickFormatter={(d) => d.slice(5)}
                        axisLine={false}
                      />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: '#1e293b',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 8,
                          color: '#f1f5f9',
                          fontSize: 13,
                        }}
                      />
                      <Bar dataKey="count" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Streaks */}
          {gh && (
            <div className="card animate-fade-in animate-fade-in-delay-3" style={{ marginBottom: '1.5rem' }}>
              <div className="card-header">
                <div className="card-title"><Flame size={18} /> Coding Streaks</div>
                <span className="badge badge-github">GitHub</span>
              </div>
              <div className="streak-display">
                <div className="streak-item">
                  <div className="streak-value current">{gh.current_streak}</div>
                  <div className="streak-label">Current Streak</div>
                </div>
                <div className="streak-item">
                  <div className="streak-value longest">{gh.longest_streak}</div>
                  <div className="streak-label">Longest Streak</div>
                </div>
                <div className="streak-item">
                  <div className="streak-value" style={{ color: '#34d399' }}>{gh.total_contributions}</div>
                  <div className="streak-label">Total Contributions</div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Feed */}
          {activity.length > 0 && (
            <div className="card animate-fade-in animate-fade-in-delay-4">
              <div className="card-header">
                <div className="card-title"><Clock size={18} /> Recent Activity</div>
              </div>
              <div className="activity-feed">
                {activity.slice(0, 10).map((item) => (
                  <div key={item.id} className="activity-item">
                    <div className={`activity-icon ${item.platform}`}>
                      {item.platform === 'github' ? <Github size={14} /> : <Code2 size={14} />}
                    </div>
                    <div className="activity-content">
                      <div className="activity-action">
                        Data fetched from {item.platform}
                        {' '}
                        <span className={`badge badge-${item.status}`}>{item.status}</span>
                      </div>
                      <div className="activity-time">
                        {new Date(item.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Difficulty ring component
function DifficultyRing({ label, solved, total, color }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const pct = total > 0 ? solved / total : 0;
  const offset = circumference - pct * circumference;

  return (
    <div className="difficulty-ring">
      <div className="ring-visual">
        <svg width="100" height="100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="ring-label" style={{ color }}>{solved}</div>
      </div>
      <div className="ring-title">{label}</div>
    </div>
  );
}
