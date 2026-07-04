import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { History, ArrowLeft, Clock, ShoppingBag, CheckCircle } from 'lucide-react';
import api from '../api/api';

export default function PastOrders() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const uniqueCode = urlParams.get('uniqueCode');

  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    fetchData();
  }, [customerId]);

  const fetchData = async () => {
    try {
      // Get customer name
      const profileResp = await api.get(`/customer/${customerId}/profile`);
      if (profileResp.data.success) {
        setCustomerName(profileResp.data.customer.name || '');
      }

      // Get order history
      const histResp = await api.get(`/customer/${customerId}/order-history`);
      setOrderHistory(histResp.data.orderHistory || []);
    } catch (error) {
      console.error('Error fetching past orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToMenu = () => {
    if (uniqueCode) {
      navigate(`/menu/${uniqueCode}`);
    } else {
      navigate(-1);
    }
  };

  const handleViewOrder = (orderId) => {
    navigate(`/order-status/${orderId}?uniqueCode=${uniqueCode || ''}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">

        {/* Back button */}
        <button
          onClick={handleBackToMenu}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Menu &amp; Cart
        </button>

        {/* Header */}
        <div className="card mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-full">
              <History className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Past Orders</h1>
              {customerName && (
                <p className="text-gray-500 text-sm">{customerName}</p>
              )}
            </div>
          </div>
        </div>

        {/* Orders List */}
        {orderHistory.length === 0 ? (
          <div className="card text-center py-16">
            <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No past orders yet</h3>
            <p className="text-gray-500 text-sm mb-6">Your completed orders will appear here.</p>
            <button onClick={handleBackToMenu} className="btn-primary">
              Browse Menu
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orderHistory.map((entry, index) => {
              const order = entry.orderId;
              if (!order) return null;

              const orderId = order._id || order;
              const isPopulated = typeof order === 'object' && order.items;

              return (
                <div
                  key={index}
                  onClick={() => handleViewOrder(orderId)}
                  className="card hover:shadow-lg transition-shadow cursor-pointer border border-gray-100 hover:border-blue-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-semibold text-gray-800">
                        Order #{(orderId?.toString() || '').slice(-6).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                      Completed
                    </span>
                  </div>

                  {isPopulated && (
                    <>
                      <div className="mb-3 space-y-1">
                        {order.items.slice(0, 3).map((item, i) => (
                          <p key={i} className="text-sm text-gray-600">
                            {item.name} × {item.quantity}
                          </p>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-sm text-gray-400">+{order.items.length - 3} more items</p>
                        )}
                      </div>

                      <div className="flex justify-between items-center border-t pt-3">
                        <span className="text-sm text-gray-500">Total</span>
                        <span className="font-bold text-blue-600 text-lg">₹{order.totalAmount?.toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  {entry.completedAt && (
                    <div className="flex items-center gap-1 mt-2">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <p className="text-xs text-gray-500">
                        {new Date(entry.completedAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom back button */}
        <button
          onClick={handleBackToMenu}
          className="w-full mt-6 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Menu &amp; Cart
        </button>

      </div>
    </div>
  );
}
