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
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;