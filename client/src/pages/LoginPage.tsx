import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useFormValidation } from '../hooks/useFormValidation';
import { loginSchema } from '../schemas';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { errors, validate, clearErrors } = useFormValidation(loginSchema);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate({ username, password })) return;
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      navigate('/');
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/minierp-logo.webp" alt="Mini ERP Logo" className="app-logo" />
          <h1>Mini ERP</h1>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className={`form-group ${errors.username ? 'has-error' : ''}`}>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); if (errors.username) clearErrors(); }}
              placeholder="Enter your username"
              autoFocus
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          <div className={`form-group ${errors.password ? 'has-error' : ''}`}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (errors.password) clearErrors(); }}
              placeholder="Enter your password"
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <Button type="submit" variant="primary" loading={loading} className="login-button">
            Sign In
          </Button>
        </form>

        <div className="login-footer">
          <p className="small">
            Default credentials: <strong>admin</strong> / <strong>admin123</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
