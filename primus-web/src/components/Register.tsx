import React, { useState } from 'react';
import './Register.css';

interface RegisterFormData {
  telegram_username: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    telegram_username: '',
    email: '',
    phone: '',
    first_name: '',
    last_name: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [checking, setChecking] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const checkTelegramId = async () => {
    if (!formData.telegram_username) {
      setError('Please enter your Telegram username');
      return;
    }

    setChecking(true);
    setError(null);

    try {
      const cleanUsername = formData.telegram_username.replace('@', '');
      const response = await fetch(`${API_URL}/api/auth/check/${cleanUsername}`);
      const data = await response.json();

      if (data.registered) {
        setError('This Telegram username is already registered. Please login via the Telegram bot.');
      } else {
        setError(null);
        alert('✅ Telegram username is available!');
      }
    } catch (err) {
      setError('Failed to check Telegram username. Please try again.');
    } finally {
      setChecking(false);
    }
  };
  const validateForm = () => {
    if (!formData.telegram_username) {
      setError('Telegram username is required');
      return false;
    }

    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!formData.phone || !/^\+?[1-9]\d{6,14}$/.test(formData.phone.replace(/[\s\-()]/g, ''))) {
      setError('Please enter a valid phone number with country code (e.g., +60123456789)');
      return false;
    }

    if (!formData.first_name) {
      setError('First name is required');
      return false;
    }

    return true;
  };return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setFormData({
          telegram_username: '',
          email: '',
          phone: '',
          first_name: '',
          last_name: ''
        });
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const openTelegram = () => {
    const botUsername = import.meta.env.VITE_BOT_USERNAME || 'your_bot_username';
    window.open(`https://t.me/${botUsername}`, '_blank');
  };

  if (success) {
    return (
      <div className="register-container">
        <div className="register-card success-card">
          <div className="success-icon">✅</div>
          <h1>Registration Successful!</h1>
          <p>Your account has been created successfully.</p>
          <div className="success-steps">
            <h3>Next Steps:</h3>
            <ol>
              <li>Open Telegram</li>
              <li>Search for our bot</li>
              <li>Send <code>/start</code> to login</li>
              <li>Start analyzing markets!</li>
            </ol>
          </div>
          <button onClick={openTelegram} className="btn btn-primary">
            Open Telegram Bot
          </button>
          <button 
            onClick={() => setSuccess(false)} 
            className="btn btn-secondary"
          >
            Register Another Account
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <h1>Register for PRIMUS GPT</h1>
        <p className="subtitle">
          Create your account to access AI-powered trading analysis
        </p>

        <div className="telegram-id-info">
          <h3>📱 Your Telegram Username:</h3>
          <ol>
            <li>Open Telegram</li>
            <li>Go to Settings</li>
            <li>Your username appears under your name (starts with @)</li>
            <li>Enter it below (with or without @)</li>
          </ol>
          <p className="info-note">
            ℹ️ Don't have a username? Tap "Username" in Settings to create one.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="telegram_username">
              Telegram Username <span className="required">*</span>
            </label>
            <div className="input-with-button">
              <input
                type="text"
                id="telegram_username"
                name="telegram_username"
                value={formData.telegram_username}
                onChange={handleChange}
                placeholder="Enter your username (e.g., @johndoe or johndoe)"
                required
              />
              <button
                type="button"
                onClick={checkTelegramId}
                disabled={checking || !formData.telegram_username}
                className="btn btn-check"
              >
                {checking ? 'Checking...' : 'Check'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              Phone Number <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+60123456789"
              required
            />
            <small>Include country code (e.g., +60 for Malaysia)</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">
                First Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="John"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Doe"
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-submit"
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="login-link">
          Already registered? 
          <button onClick={openTelegram} className="link-button">
            Login via Telegram
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
