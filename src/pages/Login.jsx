import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { QrCode, Mail, Lock, AlertCircle, Eye, EyeOff, X, KeyRound } from 'lucide-react';
import api from '../api/api';

export default function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <QrCode className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">QR Dine</h1>
          <p className="text-gray-600 mt-2">Restaurant Portal Login</p>
        </div>

        {/* Login Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="input-field pl-10"
                  placeholder="restaurant@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input-field pl-10 pr-10"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-lg disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link to="/" className="text-gray-600 hover:text-blue-600">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      {showForgotModal && (
        <ForgotPasswordModal
          initialEmail={formData.email}
          onClose={() => setShowForgotModal(false)}
        />
      )}
    </div>
  );
}

// ── Forgot Password: request OTP by email → verify OTP + set new password ──
function ForgotPasswordModal({ initialEmail, onClose }) {
  const [step, setStep] = useState('request'); // request | verify
  const [email, setEmail] = useState(initialEmail || '');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const sendOtp = async () => {
    setError('');
    if (!email) {
      setError('Enter the email address you used to register.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setInfo(res.data.message || 'If that email is registered, an OTP has been sent.');
      setStep('verify');
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending OTP');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <ModalShell onClose={onClose} icon={<KeyRound className="h-7 w-7 text-green-600" />} title="Password Reset">
        <p className="text-sm text-gray-600 mb-4">
          Your password has been reset successfully. You can now log in with your new password.
        </p>
        <button onClick={onClose} className="w-full btn-primary py-2.5">
          Back to Login
        </button>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose} icon={<KeyRound className="h-7 w-7 text-blue-600" />} title="Reset Your Password">
      {step === 'request' ? (
        <>
          <p className="text-sm text-gray-500 mb-4">
            Enter your registered email — we'll send a 6-digit OTP to reset your login password.
          </p>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="relative mb-4">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
              className="input-field pl-10 w-full"
              placeholder="restaurant@example.com"
              autoFocus
            />
          </div>
          <button
            onClick={sendOtp}
            disabled={loading || !email}
            className="w-full btn-primary py-2.5 disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send OTP to my Email'}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-green-600 mb-4">{info}</p>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="space-y-3">
            <input
              type="text"
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="input-field w-full text-center tracking-[0.5em] font-bold"
              placeholder="000000"
              maxLength={6}
              autoFocus
            />

            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field w-full pr-10"
                placeholder="New password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>

            <input
              type={showNewPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field w-full"
              placeholder="Confirm new password"
            />

            <p className="text-xs text-gray-400">
              Minimum 8 characters, must include a letter, a number, and a special character.
            </p>
          </div>
          <button
            onClick={resetPassword}
            disabled={loading || otp.length !== 6 || !newPassword || !confirmPassword}
            className="w-full mt-4 btn-primary py-2.5 disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
          <button
            onClick={() => { setStep('request'); setOtp(''); setError(''); }}
            className="w-full mt-3 text-sm text-blue-600 hover:underline"
          >
            Didn't get it? Send again
          </button>
        </>
      )}
    </ModalShell>
  );
}

// ── Shared modal shell (same pattern used by the Razorpay vault modals) ──
function ModalShell({ onClose, icon, title, children }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gray-100 p-2.5 rounded-full">{icon}</div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  );
}
