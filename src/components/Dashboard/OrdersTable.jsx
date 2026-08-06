import { useState, useEffect } from 'react';
import { RefreshCw, Download, Check, Clock, Package, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../../api/api';

// Works out, from data we already store, WHY an order never completed.
// No new database fields needed — every signal below already exists.
function getPendingReason(order) {
  if (order.paymentStatus === 'failed') {
    return {
      title: 'Payment failed',
      detail: 'The payment attempt did not go through. No money was charged to the customer.'
    };
  }
  if (!order.razorpayOrderId) {
    return {
      title: 'Waiting for payment at counter',
      detail: 'Online payment is not set up for this restaurant, so the customer was asked to pay at the counter.'
    };
  }
  return {
    title: 'Customer did not complete payment',
    detail: 'The payment window was opened but closed or cancelled before paying. No money was charged.'
  };
}

function minutesAgo(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
}

export default function OrdersTable({ onOrderUpdate }) {
  const [orders, setOrders] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
    fetchPendingCount();

    // Poll for new orders every 10 seconds
    const interval = setInterval(() => {
      fetchOrders();
      fetchPendingCount();
    }, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchOrders = async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/admin/orders${params}`);
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Separate lightweight call so the badge stays accurate on every tab
  const fetchPendingCount = async () => {
    try {
      const response = await api.get('/admin/orders?status=pending');
      setPendingCount((response.data.orders || []).length);
    } catch (error) {
      // Badge is cosmetic — never block the page on it
    }
  };

  const markAsReady = async (orderId) => {
    try {
      await api.put(`/admin/orders/${orderId}/ready`);
      await fetchOrders();
      if (onOrderUpdate) onOrderUpdate();
    } catch (error) {
      alert('Failed to mark order as ready');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status });
      await fetchOrders();
      await fetchPendingCount();
      if (onOrderUpdate) onOrderUpdate();
    } catch (error) {
      alert('Failed to update order status');
    }
  };

  const handleResolve = (order) => {
    const shortId = order._id.slice(-6).toUpperCase();
    const items = order.items.map(i => `${i.name} x${i.quantity}`).join(', ');

    const confirmed = window.confirm(
      `Are you sure this pending order has been resolved?\n\n` +
      `Order #${shortId}\n` +
      `Table ${order.tableNumber} — ₹${order.totalAmount.toFixed(2)}\n` +
      `${items}\n\n` +
      `IT WILL BE REMOVED FROM PENDING ORDERS FOREVER.`
    );

    if (confirmed) {
      updateOrderStatus(order._id, 'cancelled');
    }
  };

  const exportOrders = async () => {
    try {
      const response = await api.get('/admin/orders/export', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `orders-${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Failed to export orders');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-red-100 text-red-700',
      received: 'bg-blue-100 text-blue-700',
      preparing: 'bg-yellow-100 text-yellow-700',
      ready: 'bg-green-100 text-green-700',
      completed: 'bg-gray-100 text-gray-700',
      cancelled: 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-xl font-semibold">Orders</h2>
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={() => { fetchOrders(); fetchPendingCount(); }}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={exportOrders}
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'received', 'preparing', 'ready', 'completed', 'pending'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`relative px-4 py-2 rounded-lg capitalize whitespace-nowrap ${
              filter === status
                ? status === 'pending'
                  ? 'bg-red-600 text-white'
                  : 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {status}
            {status === 'pending' && pendingCount > 0 && (
              <span className={`ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full ${
                filter === 'pending'
                  ? 'bg-white text-red-600'
                  : 'bg-red-600 text-white animate-pulse'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Pending tab explainer */}
      {filter === 'pending' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-900">
            <p className="font-semibold mb-1">Orders that were never paid</p>
            <p>
              Nothing was charged for these — do not cook them. Most are customers who
              closed the payment screen and simply ordered again. Once you have checked
              an order and there is nothing left to do, press <strong>Resolved</strong> to
              clear it from this list.
            </p>
          </div>
        </div>
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          {filter === 'pending' ? (
            <>
              <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No pending orders</p>
              <p className="text-gray-400 text-sm mt-1">Everything is settled.</p>
            </>
          ) : (
            <>
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No orders found</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isPending = order.paymentStatus !== 'paid' && order.orderStatus === 'pending';
            const reason = isPending ? getPendingReason(order) : null;

            return (
              <div
                key={order._id}
                className={`rounded-lg p-6 border ${
                  isPending
                    ? 'bg-red-50/60 border-red-400 border-2'
                    : 'bg-white'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-lg">
                        Order #{order._id.slice(-6).toUpperCase()}
                      </h3>
                      <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus}
                      </span>
                      {order.isReady && (
                        <span className="text-xs px-3 py-1 rounded-full bg-green-500 text-white">
                          Ready ✓
                        </span>
                      )}
                      {isPending && (
                        <span className="text-xs px-3 py-1 rounded-full bg-red-600 text-white font-bold">
                          ⚠ NOT PAID — DO NOT COOK
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Table: {order.tableNumber}</p>
                      {order.customerName && <p>Customer: {order.customerName}</p>}
                      {order.customerPhone && <p>Phone: {order.customerPhone}</p>}
                      <p>Time: {new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right flex-shrink-0">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      ₹{order.totalAmount.toFixed(2)}
                    </div>
                    <div className={`text-sm mt-1 font-bold ${
                      order.paymentStatus === 'paid' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {order.paymentStatus === 'paid'
                        ? 'Paid ✓'
                        : order.paymentStatus === 'failed'
                          ? 'Payment failed'
                          : 'Not paid'}
                    </div>
                  </div>
                </div>

                {/* Why this order is pending */}
                {isPending && reason && (
                  <div className="bg-white border border-red-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-800 text-sm">{reason.title}</p>
                        <p className="text-sm text-gray-600 mt-0.5">{reason.detail}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Waiting {minutesAgo(order.createdAt)} minute{minutesAgo(order.createdAt) === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Items */}
                <div className={`rounded-lg p-4 mb-4 ${isPending ? 'bg-white' : 'bg-gray-50'}`}>
                  <h4 className="font-semibold mb-3">Items:</h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>
                          {item.name} x {item.quantity}
                        </span>
                        <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 flex-wrap">
                  {!order.isReady && order.paymentStatus === 'paid' && (
                    <button
                      onClick={() => markAsReady(order._id)}
                      className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <Check className="h-4 w-4" />
                      Mark as Ready
                    </button>
                  )}

                  {/* Cash collected at the counter — send it to the kitchen */}
                  {isPending && (
                    <button
                      onClick={() => {
                        if (window.confirm('Only accept this order if you have ALREADY collected the payment at the counter.\n\nAccept this order and send it to the kitchen?')) {
                          updateOrderStatus(order._id, 'received');
                        }
                      }}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <Check className="h-4 w-4" />
                      Paid at counter — accept
                    </button>
                  )}

                  {/* Dismiss it from the pending list for good */}
                  {isPending && (
                    <button
                      onClick={() => handleResolve(order)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 font-medium w-full sm:w-auto"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Resolved
                    </button>
                  )}

                  {order.orderStatus === 'received' && (
                    <button
                      onClick={() => updateOrderStatus(order._id, 'preparing')}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      <Clock className="h-4 w-4" />
                      Start Preparing
                    </button>
                  )}

                  {order.orderStatus === 'ready' && (
                    <button
                      onClick={() => updateOrderStatus(order._id, 'completed')}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full sm:w-auto"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
