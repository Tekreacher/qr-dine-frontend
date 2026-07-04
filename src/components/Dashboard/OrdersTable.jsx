import { useState, useEffect } from 'react';
import { RefreshCw, Download, Check, Clock, Package } from 'lucide-react';
import api from '../../api/api';

export default function OrdersTable({ onOrderUpdate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
    
    // Poll for new orders every 10 seconds
    const interval = setInterval(fetchOrders, 10000);
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
      if (onOrderUpdate) onOrderUpdate();
    } catch (error) {
      alert('Failed to update order status');
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Orders</h2>
        <div className="flex gap-3">
          <button
            onClick={fetchOrders}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={exportOrders}
            className="btn-primary flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'received', 'preparing', 'ready', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg capitalize whitespace-nowrap ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
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
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Table: {order.tableNumber}</p>
                    {order.customerName && <p>Customer: {order.customerName}</p>}
                    {order.customerPhone && <p>Phone: {order.customerPhone}</p>}
                    <p>Time: {new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{order.totalAmount.toFixed(2)}
                  </div>
                  <div className={`text-sm mt-1 ${
                    order.paymentStatus === 'paid' 
                      ? 'text-green-600' 
                      : 'text-yellow-600'
                  }`}>
                    {order.paymentStatus === 'paid' ? 'Paid ✓' : 'Pending'}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
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
              <div className="flex gap-3">
                {!order.isReady && order.paymentStatus === 'paid' && (
                  <button
                    onClick={() => markAsReady(order._id)}
                    className="btn-primary flex items-center gap-2"
                  >
                    <Check className="h-4 w-4" />
                    Mark as Ready
                  </button>
                )}
                
                {order.orderStatus === 'received' && (
                  <button
                    onClick={() => updateOrderStatus(order._id, 'preparing')}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center gap-2"
                  >
                    <Clock className="h-4 w-4" />
                    Start Preparing
                  </button>
                )}
                
                {order.orderStatus === 'ready' && (
                  <button
                    onClick={() => updateOrderStatus(order._id, 'completed')}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Mark Completed
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}