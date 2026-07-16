import { Link } from 'react-router-dom';
import { QrCode, Store, ShoppingCart, TrendingUp } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <QrCode className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">QR Dine</span>
            </div>
            <div className="flex gap-4">
              <Link to="/login" className="text-gray-700 hover:text-blue-600 px-3 py-2">
                Login
              </Link>
              <Link to="/signup" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Transform Your Restaurant with QR Ordering
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Enable contactless ordering, accept payments instantly, and manage orders efficiently. 
            Set up in minutes, grow your business today.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/login" className="btn-secondary text-lg px-8 py-3">
              Restaurant Login
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <QrCode className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">QR Code Ordering</h3>
            <p className="text-gray-600">
              Generate unique QR codes for each table. Customers scan and order instantly.
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <ShoppingCart className="h-12 w-12 text-green-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Instant Payments</h3>
            <p className="text-gray-600">
              Integrated Razorpay payments. Get paid instantly and securely.
            </p>
          </div>

          <div className="card text-center">
            <div className="flex justify-center mb-4">
              <TrendingUp className="h-12 w-12 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold mb-2">Analytics Dashboard</h3>
            <p className="text-gray-600">
              Track sales, popular items, and revenue with detailed reports.
            </p>
          </div>
        </div>

        {/* How it Works */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h4 className="font-semibold mb-2">Sign Up</h4>
              <p className="text-gray-600 text-sm">Create your restaurant account</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h4 className="font-semibold mb-2">Upload Menu</h4>
              <p className="text-gray-600 text-sm">Upload PDF or add items manually</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h4 className="font-semibold mb-2">Get QR Code</h4>
              <p className="text-gray-600 text-sm">Print and place on tables</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h4 className="font-semibold mb-2">Start Receiving Orders</h4>
              <p className="text-gray-600 text-sm">Manage orders and payments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2025 QR Dine. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}