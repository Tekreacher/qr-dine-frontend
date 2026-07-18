import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Package, Store, RefreshCw, ArrowLeft } from 'lucide-react';
import api from '../api/api';
import ThankYouModal from '../components/ThankYouModal';

export default function OrderStatus() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showThankYou, setShowThankYou] = useState(false);

  // Pull uniqueCode + customerId from URL query params (passed in after payment)
  const urlParams = new URLSearchParams(window.location.search);
  const customerId = urlParams.get('customerId');
  const uniqueCode = urlParams.get('uniqueCode');

  useEffect(() => {
    fetchOrderStatus();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchOrderStatus, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  // Watch for order completion → move to history + show Thank You modal
  useEffect(() => {
    if (order && order.orderStatus === 'completed' && !showThankYou) {
      // Move order to history + clear currentOrderId on the server.
      // Pass orderId in body as primary source (fixes first-order-in-history bug).
      if (customerId && customerId !== 'null') {
        api.post(`/customer/${customerId}/complete-order`, { orderId })
          .then(() => {
            // Clean up any old localStorage keys just in case
            if (uniqueCode) localStorage.removeItem(`currentOrder_${uniqueCode}`);
          })
          .catch(console.error);
      }
      setShowThankYou(true);
    }
  }, [order]);

  const fetchOrderStatus = async () => {
    try {
      const response = await api.get(`/order-status/${orderId}`);
      setOrder(response.data.order);
    } catch (error) {
      console.error('Error fetching order status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status) => {
    const steps = {
      received: 1,
      preparing: 2,
      ready: 3,
      completed: 4
    };
    return steps[status] || 1;
  };

  // Go back to the menu/cart page
  const handleBackToMenu = () => {
    if (uniqueCode) {
      navigate(`/menu/${uniqueCode}`);
    } else {
      navigate(-1); // fallback: browser back
    }
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
        <div className="card text-center">
          <p className="text-gray-600 mb-4">Order not found</p>
          <Link to="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const currentStep = getStatusStep(order.orderStatus);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">

        {/* ← Back to Menu button */}
        <button
          onClick={handleBackToMenu}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Menu
        </button>

        {/* Header */}
        <div className="card mb-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              {order.orderStatus === 'completed' ? (
                <div className="bg-green-500 rounded-full p-4">
                  <CheckCircle className="h-16 w-16 text-white" />
                </div>
              ) : order.isReady ? (
                <div className="bg-green-500 rounded-full p-4">
                  <CheckCircle className="h-16 w-16 text-white" />
                </div>
              ) : (
                <div className="bg-blue-500 rounded-full p-4">
                  <Clock className="h-16 w-16 text-white" />
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold mb-2">
              {order.orderStatus === 'completed'
                ? 'Order Completed! 🎉'
                : order.isReady
                ? 'Order Ready! 🎉'
                : 'Order In Progress'}
            </h1>

            <p className="text-gray-600 mb-4">
              Order #{order.id.slice(-8).toUpperCase()}
            </p>

            {order.isReady && order.orderStatus !== 'completed' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-semibold">
                  Your order is ready! Please collect it from the counter.
                </p>
              </div>
            )}

            <button
              onClick={fetchOrderStatus}
              className="btn-secondary flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Status
            </button>
          </div>
        </div>

        {/* Status Timeline */}
        <div className="card mb-6">
          <h2 className="font-semibold text-lg mb-6">Order Status</h2>

          <div className="space-y-6">

            {/* Received */}
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
                {currentStep >= 1 ? (
                  <CheckCircle className="h-6 w-6 text-white" />
                ) : (
                  <span className="text-white font-bold">1</span>
                )}
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-semibold">Order Received</h3>
                <p className="text-sm text-gray-600">Your order has been received by the restaurant</p>
              </div>
            </div>

            {/* Connector line */}
            <div className="ml-5 w-0.5 h-4 bg-gray-200 -mt-2"></div>

            {/* Preparing */}
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-yellow-500' : 'bg-gray-300'
              }`}>
                {currentStep >= 2 ? (
                  <Package className="h-6 w-6 text-white" />
                ) : (
                  <span className="text-white font-bold">2</span>
                )}
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-semibold">Preparing</h3>
                <p className="text-sm text-gray-600">Your food is being prepared</p>
              </div>
            </div>

            {/* Connector line */}
            <div className="ml-5 w-0.5 h-4 bg-gray-200 -mt-2"></div>

            {/* Ready */}
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {currentStep >= 3 ? (
                  <CheckCircle className="h-6 w-6 text-white" />
                ) : (
                  <span className="text-white font-bold">3</span>
                )}
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-semibold">Ready for Pickup</h3>
                <p className="text-sm text-gray-600">Your order is ready to be collected</p>
              </div>
            </div>

            {/* Connector line */}
            <div className="ml-5 w-0.5 h-4 bg-gray-200 -mt-2"></div>

            {/* Completed */}
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 4 ? 'bg-purple-500' : 'bg-gray-300'
              }`}>
                {currentStep >= 4 ? (
                  <CheckCircle className="h-6 w-6 text-white" />
                ) : (
                  <span className="text-white font-bold">4</span>
                )}
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-semibold">Completed</h3>
                <p className="text-sm text-gray-600">Order delivered and completed</p>
              </div>
            </div>

          </div>
        </div>

        {/* Order Details */}
        <div className="card mb-6">
          <h2 className="font-semibold text-lg mb-4">Order Details</h2>

          <div className="space-y-3">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                </div>
                <p className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}

            <div className="flex justify-between items-center pt-3 border-t-2">
              <span className="text-lg font-bold">Total</span>
              <span className="text-2xl font-bold text-blue-600">₹{order.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Restaurant Info */}
        {order.restaurant && (
          <div className="card mb-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Store className="h-5 w-5" />
              Restaurant Information
            </h2>
            <div className="space-y-2 text-sm">
              <p><strong>Name:</strong> {order.restaurant.name}</p>
              {order.restaurant.phone && (
                <p><strong>Phone:</strong> {order.restaurant.phone}</p>
              )}
              {order.restaurant.address && (
                <p>
                  <strong>Address:</strong> {order.restaurant.address.street}, {order.restaurant.address.city}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Back to Menu - bottom button (easier to reach on mobile) */}
        <button
          onClick={handleBackToMenu}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Menu &amp; Cart
        </button>

      </div>

      {/* Thank You Modal — appears when order is completed */}
      <ThankYouModal
        show={showThankYou}
        uniqueCode={uniqueCode}
        onClose={() => setShowThankYou(false)}
      />

    </div>
  );
}
