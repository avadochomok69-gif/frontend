import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff } from 'lucide-react';
import './Admin.css';

interface AdminLoginProps {
  onLoginSuccess: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsShaking(false);

    const validUsernames = ['chomok', 'admin', 'chomok_fashion'];
    if (validUsernames.includes(username.trim().toLowerCase()) && password === 'chomok88') {
      setIsLoading(true);
      setTimeout(() => {
        localStorage.setItem('chomok_admin_token', 'chomok_authenticated');
        onLoginSuccess();
      }, 600);
    } else {
      setIsShaking(true);
      setError('Invalid credentials. Use password: chomok88');
      setTimeout(() => setIsShaking(false), 500);
    }
  };

  return (
    <div className="al-wrapper">
      <div className="al-bg"></div>
      <div className={`al-card ${isShaking ? 'al-shake' : ''}`}>
        <div className="al-logo">
          <div className="al-logo-ring">
            <Lock size={24} />
          </div>
        </div>
        <h1 className="al-brand">Chomok Fashion</h1>
        <p className="al-subtitle">Admin Panel</p>

        <form onSubmit={handleSubmit} className="al-form">
          {error && <div className="al-error">{error}</div>}

          <div className="al-field">
            <label>Username</label>
            <div className="al-input-wrap">
              <User size={16} className="al-icon" />
              <input
                type="text"
                placeholder="chomok / admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="al-field">
            <label>Password</label>
            <div className="al-input-wrap">
              <Lock size={16} className="al-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="al-eye"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="al-submit" disabled={isLoading}>
            {isLoading ? <span className="al-spinner" /> : 'Login to Admin Panel'}
          </button>
        </form>
      </div>
    </div>
  );
};
