import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Package, Store, RefreshCw, ArrowLeft, ShoppingBag } from 'lucide-react';
import api from '../api/api';
import ThankYouModal from '../components/ThankYouModal';

export default function OrderStatus() {
  const { orderId } = useParams();
  const navigate = useNavigate();

  const urlParams = new URLSearchParams(window.location.search);
  const customerId = urlParams.get('customerId');
  const uniqueCode = urlParams.get('uniqueCode');
  const hasCustomerId = customerId && customerId !== 'null' && customerId !== 'undefined';

  // The FULL list of the customer's still-active orders — this is what
  // makes multi-order tracking possible. If there's no customerId (an old
  // link, or a restaurant-info-only view), we fall back to tracking just
  // the single order from the URL, same as before.
  const [orders, setOrders] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showThankYou, setShowThankYou] = useState(false);
  const [justCompletedOrder, setJustCompletedOrder] = useState(null);

  useEffect(() => {
    fetchOrders(true);
    const interval = setInterval(() => fetchOrders(false), 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, customerId]);

  const fetchOrders = async (isFirstLoad) => {
    try {
      if (hasCustomerId) {
        const res = await api.get(`/customer/${customerId}/active-orders`);
        const list = res.data.orders || [];

        // On first load, open on whichever order brought us here (usually
        // the one just placed). If it's not in the list anymore (already
        // completed, or a stale link), default to the most recent one.
        if (isFirstLoad) {
          const idx = list.findIndex(o => o.id === orderId);
          setOrders(list);
          setSelectedIndex(idx >= 0 ? idx : 0);
        } else {
          // IMPORTANT: this poll runs on a 5-second interval that was set up
          // once, on mount. A plain closure read of `selectedIndex` here
          // would be FROZEN at whatever it was at that moment — so if the
          // customer later clicked to a different page, every subsequent
          // poll would silently keep tracking the wrong order. Nesting
          // functional updaters (setOrders(prev => ...), setSelectedIndex
          // (prev => ...)) forces React to hand us the true CURRENT value
          // every time, regardless of when this closure was created.
          setOrders(prevOrders => {
            setSelectedIndex(prevSelectedIndex => {
              const currentlyViewedId = prevOrders[prevSelectedIndex]?.id;
              const newIdx = list.findIndex(o => o.id === currentlyViewedId);

              if (currentlyViewedId && newIdx === -1) {
                // The order actually being viewed just left the active
                // list — it was completed. Show the Thank You modal for
                // THAT specific order, then land on the first of whatever
                // remains (or the empty state).
                const finished = prevOrders[prevSelectedIndex];
                if (finished) {
                  setJustCompletedOrder(finished);
                  setShowThankYou(true);
                  // File it into history immediately rather than waiting for
                  // Past Orders to be opened (the backend also self-heals
                  // this lazily, so this call is a redundancy, not a
                  // dependency).
                  api.post(`/customer/${customerId}/complete-order`, { orderId: finished.id })
                    .catch(console.error);
                }
                return 0;
              }

              // Still around — just keep pointing at the SAME order even if
              // the list re-sorted and it's now at a different position.
              return newIdx >= 0 ? newIdx : 0;
            });
            return list; // now actually apply the fresh list
          });
        }
      } else {
        // No customerId available — fall back to single-order tracking,
        // exactly as this page always worked before.
        const res = await api.get(`/order-status/${orderId}`);
        setOrders(res.data.order ? [res.data.order] : []);
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error('Error fetching order status:', error);
    } finally {
      setLoading(false);
    }
  };

  const order = orders[selectedIndex] || null;

  const handleThankYouClose = () => {
    setShowThankYou(false);
    setJustCompletedOrder(null);
  };

  const getStatusStep = (status) => {
    const steps = { received: 1, preparing: 2, ready: 3, completed: 4 };
    return steps[status] || 1;
  };

  const handleBackToMenu = () => {
    if (uniqueCode) {
      navigate(`/menu/${uniqueCode}`);
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner"></div>
      </div>
    );
  }

  // Nothing active left to track — every order this customer placed has
  // either been completed (and is now in Past Orders) or never existed.
  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4">
          <button
            onClick={handleBackToMenu}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Menu
          </button>

          <div className="card text-center py-16">
            <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-700 font-semibold text-lg mb-1">No active orders</p>
            <p className="text-gray-500 text-sm mb-6">
              Completed orders move to Past Orders automatically.
            </p>
            <Link to={uniqueCode ? `/menu/${uniqueCode}` : '/'} className="btn-primary">
              Browse Menu
            </Link>
          </div>
        </div>

        <ThankYouModal
          show={showThankYou}
          uniqueCode={uniqueCode}
          onClose={handleThankYouClose}
        />
      </div>
    );
  }

  const currentStep = getStatusStep(order.orderStatus);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">

        <button
          onClick={handleBackToMenu}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium mb-5 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Menu
        </button>

        {/* Order-switcher — one page per active order, most recent first.
            Only shows once there's more than one order to switch between. */}
        {orders.length > 1 && (
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
            <span className="text-xs font-medium text-gray-500 flex-shrink-0 mr-1">
              Your orders:
            </span>
            {orders.map((o, i) => (
              <button
                key={o.id}
                onClick={() => setSelectedIndex(i)}
                title={`Order #${o.id.slice(-8).toUpperCase()}`}
                className={`flex-shrink-0 min-w-[2.25rem] h-9 px-2 rounded-lg text-sm font-semibold transition-colors ${
                  i === selectedIndex
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}

        {/* Header */}
        <div className="card mb-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              {order.orderStatus === 'completed' || order.isReady ? (
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
              {orders.length > 1 && (
                <span className="text-gray-400"> · {selectedIndex + 1} of {orders.length}</span>
              )}
            </p>

            {order.isReady && order.orderStatus !== 'completed' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-semibold">
                  Your order is ready! Please collect it from the counter.
                </p>
              </div>
            )}

            <button
              onClick={() => fetchOrders(false)}
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
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
                {currentStep >= 1 ? <CheckCircle className="h-6 w-6 text-white" /> : <span className="text-white font-bold">1</span>}
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-semibold">Order Received</h3>
                <p className="text-sm text-gray-600">Your order has been received by the restaurant</p>
              </div>
            </div>

            <div className="ml-5 w-0.5 h-4 bg-gray-200 -mt-2"></div>

            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-yellow-500' : 'bg-gray-300'
              }`}>
                {currentStep >= 2 ? <Package className="h-6 w-6 text-white" /> : <span className="text-white font-bold">2</span>}
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-semibold">Preparing</h3>
                <p className="text-sm text-gray-600">Your food is being prepared</p>
              </div>
            </div>

            <div className="ml-5 w-0.5 h-4 bg-gray-200 -mt-2"></div>

            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-green-500' : 'bg-gray-300'
              }`}>
                {currentStep >= 3 ? <CheckCircle className="h-6 w-6 text-white" /> : <span className="text-white font-bold">3</span>}
              </div>
              <div className="flex-1 pt-1">
                <h3 className="font-semibold">Ready for Pickup</h3>
                <p className="text-sm text-gray-600">Your order is ready to be collected</p>
              </div>
            </div>

            <div className="ml-5 w-0.5 h-4 bg-gray-200 -mt-2"></div>

            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                currentStep >= 4 ? 'bg-purple-500' : 'bg-gray-300'
              }`}>
                {currentStep >= 4 ? <CheckCircle className="h-6 w-6 text-white" /> : <span className="text-white font-bold">4</span>}
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
              {order.restaurant.phone && <p><strong>Phone:</strong> {order.restaurant.phone}</p>}
              {order.restaurant.address && (
                <p><strong>Address:</strong> {order.restaurant.address.street}, {order.restaurant.address.city}</p>
              )}
            </div>
          </div>
        )}

        <button
          onClick={handleBackToMenu}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Menu &amp; Cart
        </button>
      </div>

      <ThankYouModal
        show={showThankYou}
        uniqueCode={uniqueCode}
        onClose={handleThankYouClose}
      />
    </div>
  );
}
