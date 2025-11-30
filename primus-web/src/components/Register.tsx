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

  const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || 'PrimusGPT_bot';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    // Simulate processing
    setTimeout(() => {
      setSuccess(true);
      setLoading(false);
      
      // Store registration data in localStorage for reference
      const registrationData = {
        telegram_username: formData.telegram_username.replace('@', ''),
        email: formData.email,
        phone: formData.phone,
        first_name: formData.first_name,
        last_name: formData.last_name,
        registered_at: new Date().toISOString()
      };
      
      localStorage.setItem('primus_registration', JSON.stringify(registrationData));
      
      setFormData({
        telegram_username: '',
        email: '',
        phone: '',
        first_name: '',
        last_name: ''
      });
    }, 1000);
  };

  const openTelegram = () => {
    const cleanUsername = formData.telegram_username.replace('@', '');
    const message = encodeURIComponent(
      `/start\nUsername: ${cleanUsername}\nEmail: ${formData.email || 'N/A'}`
    );
    window.open(`https://t.me/${BOT_USERNAME}?text=${message}`, '_blank');
  };

  if (success) {
    return (
      <div className="register-container">
        <div className="register-card success-card">
          <div className="success-icon">✅</div>
          <h1 className="register-title">Registration Successful!</h1>
          <p className="success-message">Your account has been created successfully.</p>
          <div className="success-steps">
            <h3>Next Steps:</h3>
            <ol>
              <li>Click the button below to open Telegram</li>
              <li>Send the pre-filled message to our bot</li>
              <li>Follow the bot's instructions to complete registration</li>
              <li>Start analyzing markets!</li>
            </ol>
          </div>
          <button onClick={openTelegram} className="btn btn-primary">
            <span>Open Telegram Bot</span>
          </button>
          <button 
            onClick={() => setSuccess(false)} 
            className="btn btn-outline"
          >
            <span>Register Another Account</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">Register for <span className="text-gradient">PRIMUS GPT</span></h1>
        <p className="register-subtitle">
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
          <p className="info-note">
            💡 After submitting, you'll be redirected to our Telegram bot to complete registration.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="telegram_username">
              Telegram Username <span className="required">*</span>
            </label>
            <input
              type="text"
              id="telegram_username"
              name="telegram_username"
              value={formData.telegram_username}
              onChange={handleChange}
              placeholder="Enter your username (e.g., @johndoe or johndoe)"
              required
            />
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
            <span>{loading ? 'Registering...' : 'Register'}</span>
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
