import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Receipt, Store } from 'lucide-react';
import api from '../api/api';

export default function BillView() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const customerId = urlParams.get('customerId');
  const uniqueCode = urlParams.get('uniqueCode');

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      // /status endpoint returns the order WITH restaurant name/address populated
      const resp = await api.get(`/orders/${orderId}/status`);
      setOrder(resp.data.order);
    } catch (error) {
      console.error('Error fetching bill:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPastOrders = () => {
    if (customerId) {
      navigate(`/past-orders/${customerId}?uniqueCode=${uniqueCode || ''}`);
    } else {
      navigate(-1);
    }
  };

  const handleDownload = () => {
    const billUrl = `${import.meta.env.VITE_BACKEND_URL}/api/orders/${orderId}/bill`;
    window.open(billUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Bill not found</p>
      </div>
    );
  }

  const restaurant = order.restaurant || {};
  const shortId = (orderId || '').slice(-8).toUpperCase();
  const isPaid = order.paymentStatus === 'paid';

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-lg mx-auto px-4">

        {/* Back to Past Orders */}
        <button
          onClick={handleBackToPastOrders}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Past Orders
        </button>

        {/* The Bill */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">

          {/* Restaurant header */}
          <div className="bg-blue-600 text-white text-center px-6 py-6">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Store className="h-6 w-6" />
              <h1 className="text-2xl font-bold">{restaurant.name || 'Restaurant'}</h1>
            </div>
            {restaurant.address && (restaurant.address.city || restaurant.address.street) && (
              <p className="text-blue-100 text-sm">
                {[restaurant.address.street, restaurant.address.city, restaurant.address.state]
                  .filter(Boolean).join(', ')}
              </p>
            )}
            {restaurant.phone && (
              <p className="text-blue-100 text-sm">Phone: {restaurant.phone}</p>
            )}
          </div>

          <div className="px-6 py-5">
            {/* Receipt label */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <Receipt className="h-5 w-5 text-blue-600" />
              <span className="font-bold text-gray-800 tracking-wide">RECEIPT</span>
            </div>

            {/* Order info */}
            <div className="text-sm text-gray-600 space-y-1 border-b border-dashed pb-4 mb-4">
              <div className="flex justify-between"><span>Bill No:</span><span className="font-mono font-semibold text-gray-800">{shortId}</span></div>
              <div className="flex justify-between"><span>Date:</span><span>{new Date(order.createdAt).toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span>Table:</span><span>{order.tableNumber || '-'}</span></div>
            </div>

            {/* Items */}
            <div className="space-y-2 border-b border-dashed pb-4 mb-4">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-800">
                    {item.name} <span className="text-gray-400">× {item.quantity}</span>
                  </span>
                  <span className="font-medium text-gray-800">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-bold text-gray-900">TOTAL</span>
              <span className="text-2xl font-bold text-blue-600">₹{order.totalAmount?.toFixed(2)}</span>
            </div>

            {/* Payment status */}
            <div className={`text-center text-sm font-bold py-2 rounded-lg mb-2 ${
              isPaid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
            }`}>
              {isPaid ? '✓ PAID ONLINE' : `Payment: ${(order.paymentStatus || '').toUpperCase()}`}
            </div>

            <p className="text-center text-xs text-gray-400">
              Thank you for dining with us! Please visit again.
            </p>
          </div>
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          className="w-full mt-5 bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl text-lg transition-colors shadow-lg flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Download Bill (PDF)
        </button>

        {/* Bottom back button */}
        <button
          onClick={handleBackToPastOrders}
          className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Past Orders
        </button>

      </div>
    </div>
  );
}
