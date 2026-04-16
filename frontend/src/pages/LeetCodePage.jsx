import { useState, useEffect } from 'react';
import { api } from '../api';
import { Code2, Trophy, Target, TrendingUp, Award } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell
} from 'recharts';

const DIFFICULTY_COLORS = {
  easy: '#34d399',
  medium: '#fbbf24',
  hard: '#fb7185',
};

export default function LeetCodePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getLeetCode()
      .then((res) => setData(res.leetcode))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <div className="loading-text">Loading LeetCode data...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <div className="page-header">
          <h2>LeetCode Analytics</h2>
          <p>Your LeetCode problem-solving insights</p>
        </div>
        <div className="card empty-state">
          <div className="empty-state-icon">🧩</div>
          <h3>{error || 'No LeetCode data available'}</h3>
          <p>Make sure you've added your LeetCode username in Settings. Data is fetched automatically.</p>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: 'Easy', value: data.easy_solved, color: DIFFICULTY_COLORS.easy },
    { name: 'Medium', value: data.medium_solved, color: DIFFICULTY_COLORS.medium },
    { name: 'Hard', value: data.hard_solved, color: DIFFICULTY_COLORS.hard },
  ];

  const skills = data.skills_data || {};
  const languages = skills.languages || [];

  return (
    <div>
      <div className="page-header animate-fade-in">
        <h2>LeetCode Analytics</h2>
        <p>Problem-solving performance and trends</p>
      </div>

      {/* Stats */}
      <div className="stat-grid animate-fade-in animate-fade-in-delay-1">
        <div className="stat-card" style={{ '--stat-accent': 'var(--gradient-leetcode)' }}>
          <div className="stat-card-icon" style={{ background: 'rgba(255,161,22,0.15)', color: '#fbbf24' }}>
            <Code2 size={20} />
          </div>
          <div className="stat-card-value">{data.total_solved}</div>
          <div className="stat-card-label">Total Solved</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(52,211,153,0.15)', color: '#34d399' }}>
            <Target size={20} />
          </div>
          <div className="stat-card-value">{data.acceptance_rate}%</div>
          <div className="stat-card-label">Solve Rate</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}>
            <Trophy size={20} />
          </div>
          <div className="stat-card-value">#{data.ranking?.toLocaleString()}</div>
          <div className="stat-card-label">Global Ranking</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>
            <Award size={20} />
          </div>
          <div className="stat-card-value">{skills.totalActiveDays || 0}</div>
          <div className="stat-card-label">Active Days</div>
        </div>
      </div>

      <div className="charts-grid animate-fade-in animate-fade-in-delay-2">
        {/* Difficulty Breakdown */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Code2 size={18} /> Difficulty Breakdown</div>
          </div>
          <div className="difficulty-rings">
            <DifficultyRing label="Easy" solved={data.easy_solved} total={data.total_questions} color={DIFFICULTY_COLORS.easy} />
            <DifficultyRing label="Medium" solved={data.medium_solved} total={data.total_questions} color={DIFFICULTY_COLORS.medium} />
            <DifficultyRing label="Hard" solved={data.hard_solved} total={data.total_questions} color={DIFFICULTY_COLORS.hard} />
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><Target size={18} /> Solved Distribution</div>
          </div>
          <div className="chart-container" style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 8,
                    color: '#f1f5f9',
                    fontSize: 13,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Submissions Chart */}
        {data.recent_submissions && data.recent_submissions.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="card-title"><TrendingUp size={18} /> Submission Activity</div>
              <span className="badge badge-leetcode">Last 30 days</span>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.recent_submissions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(d) => d.slice(5)} axisLine={false} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f1f5f9', fontSize: 13 }} />
                  <Bar dataKey="count" fill="#fbbf24" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Language Skills */}
        {languages.length > 0 && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Languages Used</div>
            </div>
            <div className="language-bars">
              {languages.map((lang, i) => {
                const max = languages[0].problemsSolved;
                const pct = max > 0 ? Math.round((lang.problemsSolved / max) * 100) : 0;
                return (
                  <div key={lang.languageName} className="language-bar-item">
                    <span className="language-bar-name">{lang.languageName}</span>
                    <div className="language-bar-track">
                      <div
                        className="language-bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: ['#6366f1', '#a855f7', '#22d3ee', '#34d399', '#fbbf24', '#fb7185'][i % 6],
                        }}
                      />
                    </div>
                    <span className="language-bar-count">{lang.problemsSolved}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
            fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={circumference} strokeDashoffset={offset}
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
