import { useState } from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Store, Mail, Lock, Phone, MapPin, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import api from '../api/api';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', street: '', city: '', state: '', pincode: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
        }
      });

      if (res.data.success && res.data.pending) {
        setSubmitted(true);
      } else {
        setError(res.data.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show pending approval screen after successful registration
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full card text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="h-10 w-10 text-yellow-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Registration Submitted!</h2>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-yellow-800 font-medium">⏳ Your account is pending admin approval</p>
            <p className="text-yellow-700 text-sm mt-2">
              Your registration for <strong>{formData.name}</strong> has been received. 
              The admin will review and approve your account shortly.
            </p>
          </div>
          <div className="space-y-3 text-left mb-6">
            <div className="flex items-center gap-3 text-gray-600">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span className="text-sm">Registration details submitted</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0" />
              <span className="text-sm">Waiting for admin approval</span>
            </div>
            <div className="flex items-center gap-3 text-gray-400">
              <CheckCircle className="h-5 w-5 text-gray-300 flex-shrink-0" />
              <span className="text-sm">Login and access dashboard</span>
            </div>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            Once approved, you can login with your email and password at:
          </p>
          <Link to="/login" className="btn-primary w-full block text-center">
            Go to Login Page
          </Link>
          <p className="text-xs text-gray-400 mt-4">
            Questions? Contact us at support@qrdine.com
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <QrCode className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">QR Dine</h1>
          <p className="text-gray-600 mt-2">Register Your Restaurant</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Restaurant Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Store className="h-5 w-5" /> Restaurant Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Restaurant Name *</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange}
                    className="input-field" placeholder="The Great Restaurant" required />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input type="email" name="email" value={formData.email} onChange={handleChange}
                        className="input-field pl-10" placeholder="contact@restaurant.com" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                        className="input-field pl-10" placeholder="+91 9876543210" required />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" /> Address
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
                  <input type="text" name="street" value={formData.street} onChange={handleChange}
                    className="input-field" placeholder="123 Main Street" />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input type="text" name="city" value={formData.city} onChange={handleChange}
                      className="input-field" placeholder="Mumbai" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input type="text" name="state" value={formData.state} onChange={handleChange}
                      className="input-field" placeholder="Maharashtra" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                    <input type="text" name="pincode" value={formData.pincode} onChange={handleChange}
                      className="input-field" placeholder="400001" />
                  </div>
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lock className="h-5 w-5" /> Security
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange}
                    className="input-field" placeholder="••••••••" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                  <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                    className="input-field" placeholder="••••••••" required />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <strong>Note:</strong> After registration, your account will be reviewed by the admin. 
                You will be able to login once your account is approved.
              </p>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary py-3 text-lg disabled:opacity-50">
              {loading ? 'Submitting Registration...' : 'Submit Registration'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">Login</Link>
            </p>
          </div>
          <div className="mt-4 text-center">
            <Link to="/" className="text-gray-600 hover:text-blue-600">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
