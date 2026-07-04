import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import CategoryManager from '../components/Dashboard/CategoryManager';
import MenuEditor from '../components/Dashboard/MenuEditor';
import OrdersTable from '../components/Dashboard/OrdersTable';
import QRDisplay from '../components/Dashboard/QRDisplay';
import { 
  Upload, 
  Edit, 
  ShoppingBag, 
  QrCode as QrCodeIcon,
  TrendingUp,
  DollarSign,
  Package,
  Clock,
  Grid
} from 'lucide-react';
import api from '../api/api';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('categories');
  const [stats, setStats] = useState({
    totalOrders: 0,
    todayRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0
  });
  const [loading, setLoading] = useState(true);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/orders/analytics?period=day');
      setStats({
        totalOrders: response.data.analytics.totalOrders,
        todayRevenue: response.data.analytics.totalRevenue,
        pendingOrders: 0,
        completedOrders: response.data.analytics.totalOrders
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'categories', label: 'Categories', icon: Grid },
    { id: 'menu', label: 'Menu Items', icon: Edit },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'qr', label: 'QR Code', icon: QrCodeIcon },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.name}!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Today's Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{stats.todayRevenue.toFixed(2)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalOrders}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pendingOrders}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completedOrders}
                </p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <ShoppingBag className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card">
          <div className="border-b border-gray-200 mb-6">
            <div className="flex gap-4 overflow-x-auto">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'categories' && (
              <CategoryManager />
            )}

            {activeTab === 'menu' && (
              <MenuEditor />
            )}
            
            {activeTab === 'orders' && (
              <OrdersTable onOrderUpdate={fetchStats} />
            )}
            
            {activeTab === 'qr' && (
              <QRDisplay />
            )}
            
            {activeTab === 'analytics' && (
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
                <p className="text-gray-600">
                  Detailed analytics and reports coming soon!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}