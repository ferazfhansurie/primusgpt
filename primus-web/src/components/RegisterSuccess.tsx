import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './Register.css';

interface RegisteredData {
  email: string;
  phone: string;
  first_name: string;
}

const RegisterSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userData, setUserData] = useState<RegisteredData | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const BOT_USERNAME = import.meta.env.VITE_BOT_USERNAME || 'primusgpt_ai_bot';

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setError('Invalid session');
      setLoading(false);
      return;
    }

    // Verify payment and complete registration
    verifyPayment(sessionId);
  }, [searchParams]);

  const verifyPayment = async (sessionId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/payment/verify-session/${sessionId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setUserData(data.user);
        
        // Store registration data
        localStorage.setItem('primus_registration', JSON.stringify({
          ...data.user,
          registered_at: new Date().toISOString()
        }));

        // Clear pending registration
        localStorage.removeItem('primus_registration_pending');
      } else {
        setError(data.error || 'Payment verification failed');
      }
    } catch (err) {
      console.error('Verification error:', err);
      setError('Failed to verify payment. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  const openTelegram = () => {
    if (userData) {
      const message = encodeURIComponent(
        `/start\nEmail: ${userData.email}\nPhone: ${userData.phone}`
      );
      window.open(`https://t.me/${BOT_USERNAME}?text=${message}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="register-container">
        <div className="register-card">
          <div className="loading-spinner"></div>
          <h2>Verifying your payment...</h2>
          <p>Please wait while we complete your registration.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="register-container">
        <div className="register-card">
          <div className="error-icon">❌</div>
          <h2>Registration Error</h2>
          <p className="error-message">{error}</p>
          <button 
            onClick={() => navigate('/register')} 
            className="btn btn-primary"
          >
            Back to Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-card success-card">
        <div className="success-icon">✅</div>
        <h1 className="register-title">Payment Successful!</h1>
        <p className="success-message">
          Welcome to PRIMUS GPT! Your account has been created successfully.
        </p>

        {userData && (
          <div className="user-info">
            <h3>Account Details:</h3>
            <p><strong>Email:</strong> {userData.email}</p>
            <p><strong>Phone:</strong> {userData.phone}</p>
            <p><strong>Name:</strong> {userData.first_name}</p>
          </div>
        )}

        <div className="success-steps">
          <h3>Next Steps:</h3>
          <ol>
            <li>Click the button below to open our Telegram bot</li>
            <li>Click /start to begin your session</li>
            <li>The bot will recognize you automatically</li>
            <li>Start receiving AI-powered trading analysis!</li>
          </ol>
        </div>

        <button onClick={openTelegram} className="btn btn-primary">
          <span>🚀 Open Telegram Bot</span>
        </button>

        <button 
          onClick={() => navigate('/')} 
          className="btn btn-outline"
        >
          <span>← Back to Home</span>
        </button>
      </div>
    </div>
  );
};

export default RegisterSuccess;
