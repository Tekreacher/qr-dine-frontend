import { useState, useEffect } from 'react';
import { User, History, FileText, ChevronDown, Clock, AlertCircle, ExternalLink, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';

export default function CustomerProfile({ customerId, customerName, isExistingCustomer, currentOrderId, activeOrderCount = 0, uniqueCode, onLogout }) {
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('#customer-profile-dropdown')) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  const handleCheckOrderStatus = () => {
    setShowMenu(false);
    if (!customerId) {
      alert('Place an order first to start tracking your status!');
      return;
    }
    // No specific orderId in the path — the Order Status page fetches this
    // customer's full list of active orders itself and shows every one of
    // them (with an accurate empty state if there truly are none). Gating
    // this on a single stored "current order" pointer was the bug: that
    // pointer clears the moment ANY one order is completed, even while
    // other orders the customer placed are still genuinely active.
    navigate(`/order-status?customerId=${customerId}&uniqueCode=${uniqueCode || ''}`);
  };

  const handlePastOrders = () => {
    setShowMenu(false);
    if (customerId) {
      navigate(`/past-orders/${customerId}?uniqueCode=${uniqueCode || ''}`);
    }
  };

  const handleLogout = () => {
    // Warn if they'd be walking away from an order that's still being made
    const message = currentOrderId
      ? 'You have an active order in progress. Logging out will not cancel it — you can see it again by entering your phone number.\n\nLog out now?'
      : 'Log out? Your order history is saved and will come back when you enter your phone number again.';

    if (window.confirm(message)) {
      setShowMenu(false);
      if (onLogout) onLogout();
    }
  };

  return (
    <div className="relative" id="customer-profile-dropdown">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-1.5 p-2 pr-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md"
        title="Your Profile"
      >
        <User className="h-5 w-5" />
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
      </button>

      {showMenu && (
        <div className="fixed left-3 right-3 top-[4.75rem] w-auto sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden max-h-[calc(100vh-6rem)] overflow-y-auto">

          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="bg-white bg-opacity-20 rounded-full p-2.5">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold">
                  {customerName ? customerName : 'Your Profile'}
                </p>
                <p className="text-blue-100 text-xs">
                  {isExistingCustomer ? '⭐ Existing Customer' : 'New Customer'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-3">

            {/* Check Order Status */}
            <button
              onClick={handleCheckOrderStatus}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-blue-50 rounded-lg text-left transition-colors group"
            >
              <div className="bg-blue-100 p-2.5 rounded-lg group-hover:bg-blue-200 transition-colors flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">Check Order Status</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {activeOrderCount > 0
                    ? `${activeOrderCount} active order${activeOrderCount > 1 ? 's' : ''}`
                    : 'No active order'}
                </p>
              </div>
              {activeOrderCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 animate-pulse"></span>
              )}
            </button>

            <div className="border-t border-gray-100 my-2"></div>

            {/* Past Orders button */}
            <button
              onClick={handlePastOrders}
              disabled={!customerId}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 rounded-lg text-left transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="bg-gray-100 p-2.5 rounded-lg group-hover:bg-gray-200 transition-colors flex-shrink-0">
                <History className="h-5 w-5 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800">Past Orders</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {customerId ? 'View your order history' : 'Place first order to start tracking'}
                </p>
              </div>
              {customerId && <ExternalLink className="h-4 w-4 text-gray-400 flex-shrink-0" />}
            </button>

            {!customerId && (
              <div className="px-4 pb-2">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-800">
                    Place your first order to start tracking your history!
                  </p>
                </div>
              </div>
            )}

            {/* Logout — only meaningful once a profile is loaded */}
            {customerId && (
              <>
                <div className="border-t border-gray-100 my-2"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-red-50 rounded-lg text-left transition-colors group"
                >
                  <div className="bg-red-100 p-2.5 rounded-lg group-hover:bg-red-200 transition-colors flex-shrink-0">
                    <LogOut className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-red-700">Log Out</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Your history stays saved on your phone number
                    </p>
                  </div>
                </button>
              </>
            )}
          </div>

          {customerId && (
            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">
                Customer ID: <span className="font-mono font-medium">{customerId}</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
