import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CustomerOrder from './pages/CustomerOrder';
import OrderStatus from './pages/OrderStatus';
import PastOrders from './pages/PastOrders';
import Orders from './pages/Orders';
import AdminLogin from './pages/AdminLogin';
import AdminPanel from './pages/AdminPanel';
import AdminSetup from './pages/AdminSetup';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/menu/:uniqueCode" element={<CustomerOrder />} />
          <Route path="/order-status/:orderId" element={<OrderStatus />} />
          <Route path="/order/:orderId" element={<Orders />} />
          <Route path="/past-orders/:customerId" element={<PastOrders />} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/setup" element={<AdminSetup />} />
          <Route path="/admin/dashboard" element={<AdminPanel />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
