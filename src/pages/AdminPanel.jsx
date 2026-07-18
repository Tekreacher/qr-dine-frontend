import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, XCircle, Power, RefreshCw, LogOut, Clock, AlertTriangle, Phone, Mail, Store } from 'lucide-react';
import api from '../api/api';
import SubscriptionRing from './SubscriptionRing';

export default function AdminPanel() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const adminToken = localStorage.getItem('adminToken');

  useEffect(() => {
    if (!adminToken) { navigate('/admin'); return; }
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    try {
      const res = await api.get('/admin/restaurants', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setRestaurants(res.data.restaurants);
    } catch (err) {
      if (err.response?.status === 401) { navigate('/admin'); }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/restaurants/${id}/approve`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      fetchRestaurants();
    } catch (err) { alert('Error approving restaurant'); }
  };

  const handleReject = async (id) => {
    if (!confirm('Reject this restaurant?')) return;
    try {
      await api.put(`/admin/restaurants/${id}/reject`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      fetchRestaurants();
    } catch (err) { alert('Error rejecting restaurant'); }
  };

  const handleToggle = async (id, name, isActive) => {
    if (!confirm(`${isActive ? 'Disable' : 'Enable'} ${name}? This takes effect immediately.`)) return;
    // Optimistic update — UI changes instantly before server responds
    setRestaurants(prev => prev.map(r => r._id === id ? { ...r, isActive: !isActive } : r));
    try {
      await api.put(`/admin/restaurants/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      // Silent background refresh to confirm server state
      fetchRestaurants();
    } catch (err) {
      // Revert on failure
      setRestaurants(prev => prev.map(r => r._id === id ? { ...r, isActive: isActive } : r));
      alert('Error toggling restaurant. Please try again.');
    }
  };

  const handleRenew = async (id, name) => {
    if (!confirm(`Renew subscription for ${name} for 30 days?`)) return;
    try {
      await api.put(`/admin/restaurants/${id}/renew`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      fetchRestaurants();
    } catch (err) { alert('Error renewing subscription'); }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/admin');
  };

  const getDaysLeft = (expiry) => {
    if (!expiry) return null;
    const days = Math.ceil((new Date(expiry) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getStatusBadge = (r) => {
    if (r.subscriptionStatus === 'rejected') return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Rejected</span>;
    if (r.subscriptionStatus === 'pending') return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Pending Approval</span>;
    if (r.subscriptionStatus === 'expired') return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Expired</span>;
    if (!r.isActive) return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Disabled</span>;
    const days = getDaysLeft(r.subscriptionExpiry);
    if (days !== null && days <= 7) return <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Expiring in {days}d</span>;
    return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Active</span>;
  };

  const filtered = restaurants.filter(r => {
    const matchesSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      (r.ownerPhone || r.phone || '').includes(search);
    if (!matchesSearch) return false;
    if (filter === 'pending') return r.subscriptionStatus === 'pending';
    if (filter === 'active') return r.isApproved && r.isActive && r.subscriptionStatus === 'active';
    if (filter === 'expiring') { const d = getDaysLeft(r.subscriptionExpiry); return d !== null && d <= 7 && d > 0; }
    if (filter === 'expired') return r.subscriptionStatus === 'expired';
    if (filter === 'disabled') return !r.isActive && r.isApproved;
    return true;
  });

  // Set your monthly subscription fee per restaurant here
  const MONTHLY_FEE = 1000;

  const counts = {
    pending: restaurants.filter(r => r.subscriptionStatus === 'pending').length,
    expiring: restaurants.filter(r => { const d = getDaysLeft(r.subscriptionExpiry); return d !== null && d <= 7 && d > 0; }).length,
    expired: restaurants.filter(r => r.subscriptionStatus === 'expired').length,
    active: restaurants.filter(r => r.isApproved && r.isActive && r.subscriptionStatus === 'active').length,
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><div className="text-white text-xl">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-red-400" />
            <div>
              <h1 className="text-xl font-bold text-white">QR Dine Admin</h1>
              <p className="text-gray-400 text-sm">Super Admin Panel</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          {[
            { label: 'Total Restaurants', value: restaurants.length, color: 'bg-blue-500' },
            { label: 'Active (Paying)', value: counts.active, color: 'bg-green-500' },
            { label: 'Monthly Revenue', value: `₹${(counts.active * MONTHLY_FEE).toLocaleString('en-IN')}`, color: 'bg-emerald-500' },
            { label: 'Pending Approval', value: counts.pending, color: 'bg-yellow-500' },
            { label: 'Expiring Soon', value: counts.expiring, color: 'bg-orange-500' },
            { label: 'Expired', value: counts.expired, color: 'bg-red-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <div className={`w-3 h-3 rounded-full ${stat.color} mb-2`}></div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-gray-400 text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: `Pending (${counts.pending})` },
            { key: 'active', label: `Active (${counts.active})` },
            { key: 'expiring', label: `Expiring (${counts.expiring})` },
            { key: 'expired', label: `Expired (${counts.expired})` },
            { key: 'disabled', label: 'Disabled' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === tab.key ? 'bg-red-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search by restaurant name, email or phone..."
            className="w-full bg-gray-800 border border-gray-600 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 placeholder-gray-400"
          />
        </div>

        {/* Restaurant List */}
        <div className="space-y-4">
          {filtered.length === 0 && (
            <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
              <p className="text-gray-400">No restaurants in this category</p>
            </div>
          )}

          {filtered.map(r => {
            const daysLeft = getDaysLeft(r.subscriptionExpiry);
            return (
              <div key={r._id} className={`bg-gray-800 rounded-xl p-5 border ${!r.isActive ? 'border-red-900' : daysLeft !== null && daysLeft <= 7 ? 'border-orange-700' : 'border-gray-700'}`}>
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Store className="h-5 w-5 text-blue-400" />
                      <h3 className="text-lg font-bold text-white">{r.name}</h3>
                      {getStatusBadge(r)}
                    </div>

                    <div className="space-y-1 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{r.email}</span>
                      </div>
                      {(r.ownerPhone || r.phone) && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          <span>{r.ownerPhone || r.phone}</span>
                        </div>
                      )}
                      {r.address && (
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          <span>{r.address.city}, {r.address.state}</span>
                        </div>
                      )}
                      {r.subscriptionExpiry && (
                        <div className={`flex items-center gap-2 ${daysLeft !== null && daysLeft <= 7 ? 'text-orange-400' : ''}`}>
                          <Clock className="h-4 w-4" />
                          <span>
                            Subscription: {new Date(r.subscriptionExpiry).toLocaleDateString('en-IN')}
                            {daysLeft !== null && ` (${daysLeft > 0 ? `${daysLeft} days left` : 'EXPIRED'})`}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="h-4 w-4" />
                        <span>Signed up: {new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Subscription Ring — only for approved restaurants */}
                  {r.isApproved && r.subscriptionExpiry && (
                    <div className="flex flex-col items-center justify-center px-4">
                      <SubscriptionRing daysLeft={daysLeft} size={72} strokeWidth={7} />
                      <span className="text-xs text-gray-400 mt-1">to renew</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2 items-start">
                    {r.subscriptionStatus === 'pending' && (
                      <>
                        <button onClick={() => handleApprove(r._id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors">
                          <CheckCircle className="h-4 w-4" /> Approve
                        </button>
                        <button onClick={() => handleReject(r._id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                          <XCircle className="h-4 w-4" /> Reject
                        </button>
                      </>
                    )}

                    {r.isApproved && (
                      <>
                        <button onClick={() => handleRenew(r._id, r.name)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            daysLeft !== null && daysLeft > 0
                              ? 'bg-white text-green-600 border border-green-500 hover:bg-green-50'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}>
                          {daysLeft !== null && daysLeft > 0 ? (
                            <><CheckCircle className="h-4 w-4" /> Renewed</>
                          ) : (
                            <><RefreshCw className="h-4 w-4" /> Renew 30d</>
                          )}
                        </button>
                        <button onClick={() => handleToggle(r._id, r.name, r.isActive)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${r.isActive ? 'bg-orange-600 hover:bg-orange-700' : 'bg-gray-600 hover:bg-gray-500'} text-white`}>
                          <Power className="h-4 w-4" />
                          {r.isActive ? 'Disable' : 'Enable'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expiry warning banner */}
                {daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && (
                  <div className="mt-3 bg-orange-900 bg-opacity-50 border border-orange-700 rounded-lg p-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0" />
                    <p className="text-orange-300 text-sm">
                      ⚠️ Subscription expiring in <strong>{daysLeft} days</strong> — Contact restaurant to collect payment and renew
                    </p>
                  </div>
                )}

                {daysLeft !== null && daysLeft <= 0 && (
                  <div className="mt-3 bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-3 flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                    <p className="text-red-300 text-sm">
                      🚫 Subscription expired — Restaurant cannot login until renewed
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
