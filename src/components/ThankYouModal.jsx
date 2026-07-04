import { CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ThankYouModal({ show, uniqueCode, onClose }) {
  const navigate = useNavigate();

  if (!show) return null;

const handleClose = () => {
  if (uniqueCode) {
    localStorage.removeItem(`currentOrder_${uniqueCode}`);
    onClose();
    navigate(`/menu/${uniqueCode}`);
  } else {
    // fallback: dig uniqueCode out of localStorage
    const keys = Object.keys(localStorage).filter(k => k.startsWith('currentOrder_'));
    if (keys.length > 0) {
      const code = keys[0].replace('currentOrder_', '');
      localStorage.removeItem(`currentOrder_${code}`);
      onClose();
      navigate(`/menu/${code}`);
    } else {
      onClose();
      navigate(-1);
    }
  }
};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl relative">

        {/* Small X button top-right */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon */}
        <div className="mb-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-14 h-14 text-green-500" />
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Thank You! 🎉
          </h2>
          <p className="text-lg text-gray-600">
            Your order has been completed successfully
          </p>
        </div>

        {/* Message */}
        <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-5 mb-6 border border-blue-100">
          <p className="text-gray-800 font-semibold text-lg mb-1">
            We hope you enjoyed your meal! 😊
          </p>
          <p className="text-blue-600 text-sm font-medium">
            Please visit us again soon ❤️
          </p>
        </div>

        {/* Close button — returns user cleanly to the menu */}
        <button
          onClick={handleClose}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl text-lg transition-colors shadow-lg"
        >
          Close
        </button>

        <p className="text-xs text-gray-400 mt-3">
          Tap close to return to the menu. Thank you for dining with us!
        </p>
      </div>
    </div>
  );
}
