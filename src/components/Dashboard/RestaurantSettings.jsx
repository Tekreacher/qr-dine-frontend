import { useState, useEffect, useRef } from 'react';
import { Store, Upload, Trash2, Save, Image as ImageIcon, Check, AlertCircle } from 'lucide-react';
import api from '../../api/api';

export default function RestaurantSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);

  const [logo, setLogo] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/restaurant/profile');
      const r = res.data.restaurant;
      setLogo(r.logo || '');
      setForm({
        name: r.name || '',
        phone: r.phone || '',
        street: r.address?.street || '',
        city: r.address?.city || '',
        state: r.address?.state || '',
        pincode: r.address?.pincode || ''
      });
    } catch (error) {
      console.error('Error loading restaurant profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type, text) => {
    setMessage(`${type}:${text}`);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleSaveDetails = async () => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      showMessage('error', 'Restaurant name must be at least 2 characters');
      return;
    }
    setSaving(true);
    try {
      await api.put('/restaurant/details', {
        name: form.name,
        phone: form.phone,
        address: {
          street: form.street,
          city: form.city,
          state: form.state,
          pincode: form.pincode
        }
      });
      showMessage('success', 'Details saved. Customers will see the new name right away.');
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Could not save details');
    } finally {
      setSaving(false);
    }
  };

  const handlePickFile = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please choose an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'Image must be smaller than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('logo', file);

    setUploading(true);
    try {
      const res = await api.post('/restaurant/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setLogo(res.data.logo);
      showMessage('success', 'Photo updated. Customers will see it on your menu page.');
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Could not upload image');
    } finally {
      setUploading(false);
      e.target.value = ''; // allow re-picking the same file
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Remove your photo? Customers will see the default icon instead.')) return;
    try {
      await api.delete('/restaurant/logo');
      setLogo('');
      showMessage('success', 'Photo removed');
    } catch (error) {
      showMessage('error', 'Could not remove photo');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-semibold">Restaurant Details</h2>
        <p className="text-sm text-gray-500 mt-1">
          This is what customers see at the top of your menu page.
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm flex items-start gap-2 ${
          message.startsWith('success')
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.startsWith('success')
            ? <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
            : <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />}
          <span>{message.split(':').slice(1).join(':')}</span>
        </div>
      )}

      {/* ── Logo / banner ── */}
      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-blue-600" />
          Restaurant Photo
        </h3>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Preview — mirrors exactly what the customer sees */}
          <div className="flex-shrink-0">
            {logo ? (
              <img
                src={logo}
                alt="Restaurant logo"
                className="h-24 w-24 rounded-xl object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="h-24 w-24 rounded-xl bg-blue-50 border-2 border-dashed border-blue-200 flex items-center justify-center">
                <Store className="h-10 w-10 text-blue-600" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-600 mb-3">
              {logo
                ? 'Customers see this photo next to your name.'
                : 'No photo yet — customers currently see the default icon shown here.'}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handlePickFile}
                disabled={uploading}
                className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Upload className="h-4 w-4" />
                {uploading ? 'Uploading...' : logo ? 'Change Photo' : 'Upload Photo'}
              </button>

              {logo && (
                <button
                  onClick={handleRemoveLogo}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 font-medium"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </button>
              )}
            </div>

            <p className="text-xs text-gray-400 mt-3">
              JPG or PNG, up to 5MB. A square photo looks best — your logo or a photo of the restaurant front.
            </p>
          </div>
        </div>
      </div>

      {/* ── Name & contact ── */}
      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Store className="h-5 w-5 text-blue-600" />
          Name &amp; Address
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restaurant Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field w-full"
              placeholder="Your restaurant name"
              maxLength={60}
            />
            <p className="text-xs text-gray-400 mt-1">
              Shown to every customer who scans your QR code.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input-field w-full"
              placeholder="Contact number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street / Area
            </label>
            <input
              type="text"
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              className="input-field w-full"
              placeholder="Street or area"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="input-field w-full"
                placeholder="City"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="input-field w-full"
                placeholder="State"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
              <input
                type="text"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                className="input-field w-full"
                placeholder="Pincode"
              />
            </div>
          </div>

          <button
            onClick={handleSaveDetails}
            disabled={saving}
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
