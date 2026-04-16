import { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    github_username: '',
    leetcode_username: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await login(form.email, form.password);
      } else {
        if (!form.username || !form.email || !form.password) {
          setError('Username, email, and password are required.');
          setLoading(false);
          return;
        }
        await register(form);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container animate-fade-in">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">⚡</div>
            <h1>CodeBoard</h1>
            <p>Developer Analytics Platform</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group">
                <label className="form-label" htmlFor="username">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  className="form-input"
                  placeholder="johndoe"
                  value={form.username}
                  onChange={handleChange}
                  autoComplete="username"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
            </div>

            {!isLogin && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="github_username">GitHub Username</label>
                  <input
                    id="github_username"
                    name="github_username"
                    type="text"
                    className="form-input"
                    placeholder="your-github-username"
                    value={form.github_username}
                    onChange={handleChange}
                  />
                  <p className="form-hint">Optional – used to fetch your GitHub stats</p>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="leetcode_username">LeetCode Username</label>
                  <input
                    id="leetcode_username"
                    name="leetcode_username"
                    type="text"
                    className="form-input"
                    placeholder="your-leetcode-username"
                    value={form.leetcode_username}
                    onChange={handleChange}
                  />
                  <p className="form-hint">Optional – used to fetch your LeetCode stats</p>
                </div>
              </>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
              style={{ marginTop: '0.5rem' }}
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="auth-toggle">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }}>
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
