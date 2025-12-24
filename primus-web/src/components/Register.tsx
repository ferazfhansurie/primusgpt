import React, { useState } from 'react';
import './Register.css';

interface RegisterFormData {
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    phone: '',
    first_name: '',
    last_name: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [registeredData, setRegisteredData] = useState<RegisterFormData | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || 'primusgpt_ai_bot';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const validateForm = () => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!formData.phone || !/^\+?[1-9]\d{6,14}$/.test(formData.phone.replace(/[\s\-()]/g, ''))) {
      setError('Please enter a valid phone number with country code (e.g., +971501234567)');
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

    // Prepare data
    const registrationData = {
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim()
    };
    
    try {
      // Send to API
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
        setRegisteredData(registrationData);
        
        // Store registration data in localStorage for reference
        const storedData = {
          ...registrationData,
          registered_at: new Date().toISOString()
        };
        
        localStorage.setItem('primus_registration', JSON.stringify(storedData));
        
        // Clear form
        setFormData({
          email: '',
          phone: '',
          first_name: '',
          last_name: ''
        });
      } else {
        setError(data.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Network error:', err);
      setError('Network error. Please check if the API server is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  const openTelegram = () => {
    const email = registeredData?.email || formData.email;
    const phone = registeredData?.phone || formData.phone;
    const message = encodeURIComponent(
      `/start\nEmail: ${email}\nPhone: ${phone}`
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
              <li>Click /start to begin</li>
              <li>The bot will recognize you automatically</li>
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
        <div className="sale-banner-register">
          🎉 NEW YEAR SALE 🎉
          <span className="sale-subtitle-register">Save Up To 25% - Limited Time!</span>
        </div>
        
        <h1 className="register-title">Register for <span className="text-gradient">PRIMUS GPT</span></h1>
        <p className="register-subtitle">
          Create your account to access AI-powered trading analysis
        </p>

        <div className="telegram-id-info">
          <h3>📱 Registration Info:</h3>
          <p className="info-note">
            After registration, you'll be redirected to our Telegram bot. Click /start and the bot will recognize you automatically using your email or phone.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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
              placeholder="+971501234567"
              required
            />
            <small>Include country code (e.g., +971 for UAE)</small>
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
