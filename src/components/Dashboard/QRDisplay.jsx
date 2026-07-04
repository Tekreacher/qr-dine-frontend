import { useState, useEffect } from 'react';
import { Download, RefreshCw, ExternalLink, QrCode as QrCodeIcon } from 'lucide-react';
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
setOrderUrl(`${window.location.origin}/menu/${restaurant.uniqueCode}`);      }
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

function RazorpayConfig() {
  const [config, setConfig] = useState({
    razorpayKeyId: '',
    razorpayKeySecret: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await api.get('/restaurant/profile');
      const restaurant = response.data.restaurant;
      setConfig({
        razorpayKeyId: restaurant.razorpayKeyId || '',
        razorpayKeySecret: restaurant.razorpayKeySecret || ''
      });
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage('');
    
    try {
      await api.put('/restaurant/razorpay', config);
      setMessage('Razorpay credentials saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to save credentials');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">
        Configure your Razorpay credentials to accept payments.
      </p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Razorpay Key ID
        </label>
        <input
          type="text"
          value={config.razorpayKeyId}
          onChange={(e) => setConfig({ ...config, razorpayKeyId: e.target.value })}
          className="input-field"
          placeholder="rzp_test_xxxxxxxxxxxxx"
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

      {message && (
        <div className={`p-3 rounded-lg ${
          message.includes('success') 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <button
        onClick={saveConfig}
        disabled={saving || !config.razorpayKeyId || !config.razorpayKeySecret}
        className="btn-primary disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Razorpay Credentials'}
      </button>
    </div>
  );
}