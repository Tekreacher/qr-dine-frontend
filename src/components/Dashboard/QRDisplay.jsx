import { useState, useEffect } from 'react';
import { Download, RefreshCw, ExternalLink, QrCode as QrCodeIcon, Lock, Eye, EyeOff, Shield, X, Mail } from 'lucide-react';
import api from '../../api/api';

export default function QRDisplay() {
  const [qrCode, setQrCode] = useState('');
  const [orderUrl, setOrderUrl] = useState('');
  const [uniqueCode, setUniqueCode] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchQRCode();
  }, []);

  const fetchQRCode = async () => {
    try {
      const response = await api.get('/restaurant/profile');
      const restaurant = response.data.restaurant;

      setUniqueCode(restaurant.uniqueCode);

      if (restaurant.qrCode) {
        setQrCode(restaurant.qrCode);
        setOrderUrl(`${window.location.origin}/menu/${restaurant.uniqueCode}`);
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
    }
  };

  const generateQR = async () => {
    setGenerating(true);
    try {
      const response = await api.post('/menu/generate-qr');
      setQrCode(response.data.qrCode);
      setOrderUrl(response.data.orderUrl);
      if (response.data.uniqueCode) {
        setUniqueCode(response.data.uniqueCode);
      }
    } catch (error) {
      alert('Failed to generate QR code');
    } finally {
      setGenerating(false);
    }
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `restaurant-qr-${uniqueCode}.png`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <QrCodeIcon className="h-6 w-6" />
        QR Code for Tables
      </h2>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          <strong>How to use:</strong> Generate your QR code, download it, print and place it on your restaurant tables.
          Customers can scan to view menu and place orders.
        </p>
      </div>

      {qrCode ? (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card text-center">
            <h3 className="font-semibold mb-4">Your QR Code</h3>
            <div className="bg-white p-6 rounded-lg inline-block border-2 border-gray-200">
              <img src={qrCode} alt="Restaurant QR Code" className="w-64 h-64 mx-auto" />
            </div>
            <div className="mt-6 flex gap-3 justify-center">
              <button onClick={downloadQR} className="btn-primary flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download QR
              </button>
              <button onClick={generateQR} className="btn-secondary flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold mb-4">Order Page Details</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Unique Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={uniqueCode}
                    readOnly
                    className="input-field flex-1"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(uniqueCode);
                      alert('Code copied!');
                    }}
                    className="btn-secondary"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Order Page URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={orderUrl}
                    readOnly
                    className="input-field flex-1 text-sm"
                  />
                  <button
                    onClick={() => window.open(orderUrl, '_blank')}
                    className="btn-secondary flex items-center justify-center"
                  >
                    <ExternalLink className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Usage Instructions:</h4>
                <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                  <li>Download the QR code image</li>
                  <li>Print it in a visible size</li>
                  <li>Place on restaurant tables</li>
                  <li>Customers scan with phone camera</li>
                  <li>They will be redirected to ordering page</li>
                </ol>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Tip:</strong> Make sure you have uploaded your menu and configured Razorpay payment details.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <QrCodeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-6">No QR code generated yet</p>
          <button
            onClick={generateQR}
            disabled={generating}
            className="btn-primary disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Generate QR Code'}
          </button>
        </div>
      )}

      <div className="card bg-orange-50 border border-orange-200">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          💳 Payment Configuration
        </h3>
        <RazorpayConfig />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Razorpay Vault — securely stores & protects live payment credentials
// ────────────────────────────────────────────────────────────────
function RazorpayConfig() {
  const [config, setConfig] = useState({ razorpayKeyId: '', razorpayKeySecret: '' });
  const [status, setStatus] = useState({ configured: false, vaultEnabled: false, maskedKeyId: null });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  // Modals
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/restaurant/razorpay-status');
      setStatus({
        configured: res.data.configured,
        vaultEnabled: res.data.vaultEnabled,
        maskedKeyId: res.data.maskedKeyId
      });
      // If not vault-protected yet but already configured, show the raw fields for editing convenience
      if (res.data.configured && !res.data.vaultEnabled) {
        setEditing(true);
      }
    } catch (error) {
      console.error('Error fetching razorpay status:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config.razorpayKeyId || !config.razorpayKeySecret) return;
    setSaving(true);
    setMessage('');
    try {
      await api.put('/restaurant/razorpay', config);
      setMessage('success:Razorpay credentials saved successfully!');
      // If the vault was already protected, snap back to the hidden/locked view
      // instead of leaving the plain-text credentials sitting on screen.
      if (status.vaultEnabled) {
        setEditing(false);
        setConfig({ razorpayKeyId: '', razorpayKeySecret: '' });
      }
      await fetchStatus();
      setTimeout(() => setMessage(''), 4000);
    } catch (error) {
      setMessage('error:Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };

  const handleUnlocked = (keyId, keySecret) => {
    setConfig({ razorpayKeyId: keyId, razorpayKeySecret: keySecret });
    setEditing(true);
    setShowUnlock(false);
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Loading payment configuration...</p>;
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">
        Configure your Razorpay credentials to accept payments directly into your own account.
      </p>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${
          message.startsWith('success')
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.split(':').slice(1).join(':')}
        </div>
      )}

      {/* ── LOCKED STATE: vault enabled, credentials hidden ── */}
      {status.vaultEnabled && !editing && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-full">
              <Lock className="h-5 w-5 text-green-700" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">Your credentials are secured</p>
              <p className="text-sm text-gray-500 font-mono">{status.maskedKeyId || '••••••••••••'}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowUnlock(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              View / Edit Credentials
            </button>
            <button
              onClick={() => setShowForgot(true)}
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot vault password?
            </button>
          </div>
        </div>
      )}

      {/* ── UNLOCKED / EDITABLE STATE ── */}
      {(!status.vaultEnabled || editing) && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Razorpay Key ID
            </label>
            <input
              type="text"
              value={config.razorpayKeyId}
              onChange={(e) => setConfig({ ...config, razorpayKeyId: e.target.value })}
              className="input-field"
              placeholder="rzp_live_xxxxxxxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Razorpay Key Secret
            </label>
            <input
              type="password"
              value={config.razorpayKeySecret}
              onChange={(e) => setConfig({ ...config, razorpayKeySecret: e.target.value })}
              className="input-field"
              placeholder="Enter your secret key"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={saveConfig}
              disabled={saving || !config.razorpayKeyId || !config.razorpayKeySecret}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Razorpay Credentials'}
            </button>

            {status.configured && !status.vaultEnabled && (
              <button
                onClick={() => setShowSetPassword(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <Shield className="h-4 w-4" />
                Secure with Password
              </button>
            )}

            {status.vaultEnabled && editing && (
              <button
                onClick={() => { setEditing(false); setConfig({ razorpayKeyId: '', razorpayKeySecret: '' }); }}
                className="btn-secondary"
              >
                Cancel
              </button>
            )}
          </div>
        </>
      )}

      {showSetPassword && (
        <SetPasswordModal
          onClose={() => setShowSetPassword(false)}
          onSuccess={() => { setShowSetPassword(false); setEditing(false); setConfig({ razorpayKeyId: '', razorpayKeySecret: '' }); fetchStatus(); }}
        />
      )}

      {showUnlock && (
        <UnlockModal
          onClose={() => setShowUnlock(false)}
          onUnlocked={handleUnlocked}
          onForgot={() => { setShowUnlock(false); setShowForgot(true); }}
        />
      )}

      {showForgot && (
        <ForgotPasswordModal
          onClose={() => setShowForgot(false)}
          onSuccess={() => { setShowForgot(false); fetchStatus(); }}
        />
      )}
    </div>
  );
}

// ── Modal: Set vault password for the first time ──
function SetPasswordModal({ onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await api.post('/restaurant/razorpay-vault/set-password', { password });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Error setting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell onClose={onClose} icon={<Shield className="h-7 w-7 text-green-600" />} title="Secure Your Credentials">
      <p className="text-sm text-gray-500 mb-4">
        Set a password to hide your Razorpay credentials from view. You'll need this password every time you want to see or edit them again.
      </p>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <div className="space-y-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field w-full"
          placeholder="New vault password"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input-field w-full"
          placeholder="Confirm password"
        />
        <p className="text-xs text-gray-400">Minimum 8 characters, must include a letter, a number, and a special character.</p>
      </div>
      <button
        onClick={handleSubmit}
        disabled={loading || !password || !confirmPassword}
        className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium disabled:opacity-50 transition-colors"
      >
        {loading ? 'Securing...' : 'Set Password & Secure'}
      </button>
    </ModalShell>
  );
}

// ── Modal: Unlock existing credentials with vault password ──
function UnlockModal({ onClose, onUnlocked, onForgot }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(null);

  const handleUnlock = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/restaurant/razorpay-vault/unlock', { password });
      setRevealed({ keyId: res.data.razorpayKeyId, keySecret: res.data.razorpayKeySecret });
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect password');
    } finally {
      setLoading(false);
    }
  };

  if (revealed) {
    return (
      <ModalShell onClose={onClose} icon={<Eye className="h-7 w-7 text-blue-600" />} title="Credentials Unlocked">
        <p className="text-sm text-gray-500 mb-4">Here are your saved credentials. Click below to load them into the edit form.</p>
        <div className="bg-gray-50 rounded-lg p-3 space-y-2 mb-4">
          <div>
            <p className="text-xs text-gray-500">Razorpay Key ID</p>
            <p className="font-mono text-sm break-all">{revealed.keyId}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Razorpay Key Secret</p>
            <p className="font-mono text-sm break-all">{revealed.keySecret}</p>
          </div>
        </div>
        <button
          onClick={() => onUnlocked(revealed.keyId, revealed.keySecret)}
          className="w-full btn-primary py-2.5"
        >
          Load into Editor
        </button>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose} icon={<Lock className="h-7 w-7 text-blue-600" />} title="Enter Vault Password">
      <p className="text-sm text-gray-500 mb-4">Enter your vault password to view or edit your Razorpay credentials.</p>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
        className="input-field w-full"
        placeholder="Vault password"
        autoFocus
      />
      <button
        onClick={handleUnlock}
        disabled={loading || !password}
        className="w-full mt-4 btn-primary py-2.5 disabled:opacity-50"
      >
        {loading ? 'Verifying...' : 'Unlock'}
      </button>
      <button onClick={onForgot} className="w-full mt-3 text-sm text-blue-600 hover:underline">
        Forgot password?
      </button>
    </ModalShell>
  );
}

// ── Modal: Forgot password → OTP via email → reset ──
function ForgotPasswordModal({ onClose, onSuccess }) {
  const [step, setStep] = useState('request'); // request | verify
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/restaurant/razorpay-vault/forgot-password');
      setInfo(res.data.message);
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
      await api.post('/restaurant/razorpay-vault/reset-password', { otp, newPassword });
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell onClose={onClose} icon={<Mail className="h-7 w-7 text-orange-600" />} title="Reset Vault Password">
      {step === 'request' ? (
        <>
          <p className="text-sm text-gray-500 mb-4">
            We'll send a 6-digit OTP to your registered restaurant email to verify it's you.
          </p>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button
            onClick={sendOtp}
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2.5 rounded-lg font-medium disabled:opacity-50 transition-colors"
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
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field w-full"
              placeholder="New vault password"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-field w-full"
              placeholder="Confirm new password"
            />
            <p className="text-xs text-gray-400">Minimum 8 characters, must include a letter, a number, and a special character.</p>
          </div>
          <button
            onClick={resetPassword}
            disabled={loading || otp.length !== 6 || !newPassword || !confirmPassword}
            className="w-full mt-4 btn-primary py-2.5 disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </>
      )}
    </ModalShell>
  );
}

// ── Shared modal shell ──
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
