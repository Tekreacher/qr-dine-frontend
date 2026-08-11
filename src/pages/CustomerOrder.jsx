import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Plus, Minus, Trash2, Store, MapPin, Phone,
  User, Leaf, Drumstick, LayoutGrid, Hash, ChefHat
} from 'lucide-react';
import api from '../api/api';
import CustomerProfile from '../components/CustomerProfile';

/* ===========================================================================
   BRAND THEMING
   Reads the dominant colour out of the restaurant's uploaded logo and turns
   it into a small palette. Every accent on this page derives from it, so each
   restaurant's customers see that restaurant's identity.
   =========================================================================== */

const DEFAULT_BRAND = '#F97316'; // warm orange, used until/unless a logo says otherwise

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16)
  };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

function shade(hex, amount) {
  // amount < 0 darkens, > 0 lightens
  const { r, g, b } = hexToRgb(hex);
  const t = amount < 0 ? 0 : 255;
  const p = Math.abs(amount);
  return rgbToHex(r + (t - r) * p, g + (t - g) * p, b + (t - b) * p);
}

function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const f = v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/**
 * Pull the most-used meaningful colour out of an image.
 * Skips near-white, near-black and washed-out greys so a white logo
 * background or black outline never becomes the brand colour.
 */
function extractDominantColor(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onerror = () => resolve(null);
    img.onload = () => {
      try {
        const size = 48;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, size, size);

        const { data } = ctx.getImageData(0, 0, size, size);
        const buckets = {};

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
          if (a < 200) continue;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const lightness = (max + min) / 2;
          const saturation = max === min ? 0 : (max - min) / (lightness > 127 ? (510 - max - min) : (max + min));

          if (lightness > 235) continue;      // near white
          if (lightness < 25) continue;       // near black
          if (saturation < 0.18) continue;    // grey / washed out

          // Quantise so similar shades group together
          const key = `${Math.round(r / 24)}-${Math.round(g / 24)}-${Math.round(b / 24)}`;
          if (!buckets[key]) buckets[key] = { r: 0, g: 0, b: 0, n: 0 };
          buckets[key].r += r;
          buckets[key].g += g;
          buckets[key].b += b;
          buckets[key].n += 1;
        }

        const best = Object.values(buckets).sort((a, b) => b.n - a.n)[0];
        if (!best) return resolve(null);

        let hex = rgbToHex(best.r / best.n, best.g / best.n, best.b / best.n);

        // Keep white button text readable — darken anything too pale.
        let guard = 0;
        while (relativeLuminance(hex) > 0.42 && guard < 6) {
          hex = shade(hex, -0.16);
          guard++;
        }
        resolve(hex);
      } catch (e) {
        resolve(null); // canvas blocked by CORS — fall back quietly
      }
    };

    img.src = url;
  });
}

function buildTheme(brand) {
  return {
    brand,
    brandDark: shade(brand, -0.22),
    brandDeep: shade(brand, -0.42),
    brandSoft: shade(brand, 0.86),   // icon circles, chips
    brandTint: shade(brand, 0.955),  // page background wash
    brandLine: shade(brand, 0.78)    // hairline borders
  };
}

function useBrandTheme(logoUrl) {
  const [brand, setBrand] = useState(DEFAULT_BRAND);

  useEffect(() => {
    let cancelled = false;
    if (!logoUrl) {
      setBrand(DEFAULT_BRAND);
      return;
    }
    extractDominantColor(logoUrl).then(color => {
      if (!cancelled && color) setBrand(color);
    });
    return () => { cancelled = true; };
  }, [logoUrl]);

  return buildTheme(brand);
}


export default function CustomerOrder() {
  const { uniqueCode } = useParams();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [tableNumber, setTableNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [vegFilter, setVegFilter] = useState('all');
  const [customerId, setCustomerId] = useState(null);
  const [customerIsExisting, setCustomerIsExisting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [currentOrderId, setCurrentOrderId] = useState(null);

  // Phone lookup modal state
  const [showPhoneLookup, setShowPhoneLookup] = useState(false);
  const [phoneLookupInput, setPhoneLookupInput] = useState('');
  const [phoneLookupLoading, setPhoneLookupLoading] = useState(false);
  const [phoneLookupError, setPhoneLookupError] = useState('');

  // ── Brand theming ─────────────────────────────────────────────────────────
  // The whole page takes its colour from the restaurant's own logo, so a
  // customer sees the restaurant's identity, not ours. Falls back to a warm
  // orange when there's no logo or the colour can't be read.
  const theme = useBrandTheme(restaurant?.logo);


  useEffect(() => {
    fetchRestaurant();
  }, [uniqueCode]);

  // Refresh customer profile (esp. currentOrderId) whenever the tab regains focus.
  // This ensures that after the restaurant marks an order complete, the customer's
  // "Check Order Status" turns inactive as soon as they return to this tab.
  const refreshProfile = async () => {
    if (!customerId) return;
    try {
      const resp = await api.get(`/customer/${customerId}/profile`);
      if (resp.data.success) {
        const cust = resp.data.customer;
        setCurrentOrderId(cust.currentOrderId || null);
        setCustomerIsExisting(cust.isExistingCustomer || false);
      }
    } catch (e) { /* ignore */ }
  };

  useEffect(() => {
    const onFocus = () => refreshProfile();
    window.addEventListener('focus', onFocus);
    // Also poll every 10 seconds while page is open
    const interval = setInterval(refreshProfile, 10000);
    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, [customerId]);

  const fetchRestaurant = async () => {
    try {
      const response = await api.get(`/restaurant/${uniqueCode}`);
      setRestaurant(response.data.restaurant);
      setMenuItems(response.data.restaurant.menuItems);

      const cats = ['All', ...new Set(response.data.restaurant.menuItems.map(item => item.category).filter(Boolean))];
      setCategories(cats);
      setSelectedCategory('All');

      // Check sessionStorage — this persists across page navigation within the SAME tab,
      // but auto-clears when the tab is closed. So switching menu ↔ order status ↔ past orders
      // won't re-ask for phone, but a fresh visit (new tab / reopened) will.
      const rest = response.data.restaurant;
      const restId = rest._id || rest.id;
      const sessionKey = `dine_session_${restId}`;
      const savedSession = sessionStorage.getItem(sessionKey);

      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          // Re-fetch fresh profile from MongoDB to get latest currentOrderId status
          const custResp = await api.get(`/customer/${session.customerId}/profile`);
          if (custResp.data.success) {
            const cust = custResp.data.customer;
            setCustomerId(cust.customerId);
            setCustomerName(cust.name || '');
            setCustomerPhone(cust.phone || '');
            setCustomerIsExisting(cust.isExistingCustomer || false);
            setCurrentOrderId(cust.currentOrderId || null);
            return; // Session active — no phone modal
          }
        } catch (e) {
          sessionStorage.removeItem(sessionKey);
        }
      }

      // No active session — ask for phone
      setShowPhoneLookup(true);
    } catch (error) {
      // 403 = restaurant disabled/expired, 404 = not found
      const msg = error.response?.data?.message || 'Restaurant not found';
      alert(msg);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const isValidIndianPhone = (num) => /^[6-9]\d{9}$/.test(num.replace(/\D/g, ''));

  const handlePhoneLookup = async () => {
    const phone = phoneLookupInput.trim().replace(/\D/g, '');
    if (!phone) {
      setPhoneLookupError('Please enter your phone number');
      return;
    }
    if (!isValidIndianPhone(phone)) {
      setPhoneLookupError('Please enter a valid 10-digit Indian phone number (starting with 6-9)');
      return;
    }

    setPhoneLookupLoading(true);
    setPhoneLookupError('');

    try {
      const restaurantId = restaurant?._id || restaurant?.id;
      const response = await api.get(`/customer/lookup?phone=${encodeURIComponent(phone)}&restaurantId=${restaurantId}`);

      const restId = restaurant?._id || restaurant?.id;
      const sessionKey = `dine_session_${restId}`;

      if (response.data.found) {
        const cust = response.data.customer;
        setCustomerId(cust.customerId);
        setCustomerName(cust.name || '');
        setCustomerPhone(cust.phone || '');
        setCustomerIsExisting(cust.isExistingCustomer || false);
        if (cust.currentOrderId) {
          setCurrentOrderId(cust.currentOrderId);
        }
        // Save session so navigating pages in this tab won't re-ask for phone
        sessionStorage.setItem(sessionKey, JSON.stringify({ customerId: cust.customerId }));
      } else {
        // New customer — pre-fill phone, session saved after their first order is created
        setCustomerPhone(phone);
        setCustomerIsExisting(false);
      }
      setShowPhoneLookup(false);
    } catch (error) {
      setPhoneLookupError('Error looking up phone number. Please try again.');
    } finally {
      setPhoneLookupLoading(false);
    }
  };

  const createOrGetCustomer = async () => {
    try {
      const response = await api.post('/customer/create-or-get', {
        name: customerName,
        phone: customerPhone,
        restaurantId: restaurant._id
      });

      const cust = response.data.customer;
      setCustomerId(cust.customerId);
      setCustomerIsExisting(cust.isExistingCustomer || false);
      // Save session so new customer isn't re-asked phone while navigating this tab
      const restId = restaurant._id || restaurant.id;
      sessionStorage.setItem(`dine_session_${restId}`, JSON.stringify({ customerId: cust.customerId }));
      return cust.customerId;
    } catch (error) {
      console.error('Error creating customer:', error);
      return null;
    }
  };

  const handleLogout = () => {
    // Clear this tab's session so the phone popup asks again on next use.
    // Nothing is deleted server-side — the customer's profile and full order
    // history stay against their phone number and come straight back when
    // they enter it again.
    const restId = restaurant?._id || restaurant?.id;
    if (restId) {
      sessionStorage.removeItem(`dine_session_${restId}`);
    }

    // Reset all customer state on the page
    setCustomerId(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerIsExisting(false);
    setCurrentOrderId(null);
    setCart([]);
    setTableNumber('');

    // Send them back to the phone entry popup
    setPhoneLookupInput('');
    setPhoneLookupError('');
    setShowPhoneLookup(true);
  };

  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem._id === item._id);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem._id === item._id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item._id !== itemId));
  };

  const updateQuantity = (itemId, change) => {
    // Always apply the new quantity — if it drops to 0 (pressing minus at 1),
    // the filter below removes the item from the cart entirely, so the user
    // doesn't have to hunt for the delete icon.
    setCart(cart.map(item => {
      if (item._id === itemId) {
        return { ...item, quantity: item.quantity + change };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const filteredMenuItems = menuItems.filter(item => {
    const categoryMatch = selectedCategory === 'All' || item.category === selectedCategory;
    const vegMatch =
      vegFilter === 'all' ? true :
      vegFilter === 'veg' ? item.veg === true :
      vegFilter === 'nonveg' ? item.veg === false :
      true;
    return categoryMatch && vegMatch && item.available;
  });

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty');
      return;
    }
    if (!tableNumber.trim()) {
      alert('Please enter your table number');
      return;
    }
    if (!customerName.trim()) {
      alert('Please enter your name');
      return;
    }
    if (!customerPhone.trim()) {
      alert('Please enter your phone number');
      return;
    }
    if (!isValidIndianPhone(customerPhone)) {
      alert('Please enter a valid 10-digit Indian phone number (starting with 6-9)');
      return;
    }

    if (placingOrder) return;   // prevents double-tap creating two orders
    setPlacingOrder(true);

    try {
      const custId = await createOrGetCustomer();
      const restaurantId = restaurant._id || restaurant.id;

      if (!restaurantId) {
        alert('Restaurant ID not found. Please refresh the page.');
        return;
      }

      const orderData = {
        restaurantId,
        items: cart.map(item => ({ menuItemId: item._id, quantity: item.quantity })),
        tableNumber,
        customerName,
        customerPhone
      };

      const response = await api.post('/orders/create', orderData);

      // NOTE: the order record now exists, but it is NOT yet the customer's
      // "current order". An unpaid order is not a placed order — it must not
      // appear under Check Order Status or ever reach Past Orders. The
      // current-order pointer is set only after payment actually succeeds
      // (see initiatePayment below), or immediately for restaurants that
      // take cash at the counter, where there is no online payment step.

      if (response.data.razorpayOrderId) {
        initiatePayment(response.data, custId);
        return;
      }

      // Cash-at-counter restaurant: no online payment exists for this order,
      // so placing it IS the completed customer action.
      if (response.data.order) {
        setCurrentOrderId(response.data.order._id);
        if (custId) {
          await api.put(`/customer/${custId}/current-order`, {
            orderId: response.data.order._id
          });
        }
      }

      // No Razorpay order came back — tell the customer WHY, and still let
      // them track the order instead of leaving them on a dead-end alert.
      alert(
        response.data.message ||
        'This restaurant has not enabled online payment yet. Please pay at the counter.'
      );

      if (response.data.order) {
        navigate(
          `/order-status/${response.data.order._id}?customerId=${custId}&uniqueCode=${uniqueCode}`
        );
      }
    } catch (error) {
      console.error('Order error:', error);
      const errorMessage =
        error.response?.data?.razorpayError ||
        error.response?.data?.message ||
        error.message ||
        'Failed to create order';
      alert(`Order failed: ${errorMessage}`);
    } finally {
      setPlacingOrder(false);
    }
  };

  const initiatePayment = (orderData, custId) => {
    if (typeof window.Razorpay === 'undefined') {
      alert('Payment system not loaded. Please refresh the page and try again.');
      return;
    }

    const options = {
      key: orderData.razorpayKeyId,
      // Use the paise value the server already computed. Never re-multiply on
      // the client — 4.35 * 100 === 434.99999999999994 in JavaScript.
      amount: orderData.amountInPaise ?? Math.round(orderData.amount * 100),
      currency: 'INR',
      name: restaurant.name,
      description: 'Food Order Payment',
      order_id: orderData.razorpayOrderId,
      handler: async function (response) {
        try {
          await api.post('/orders/verify-payment', {
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            orderId: orderData.order._id
          });

          // Payment confirmed — only NOW does this become the customer's
          // current order. (The server also sets this itself during
          // verification, so the pointer is correct even if this call fails.)
          setCurrentOrderId(orderData.order._id);
          if (custId) {
            try {
              await api.put(`/customer/${custId}/current-order`, {
                orderId: orderData.order._id
              });
            } catch (e) { /* server-side already handled it */ }
          }

          navigate(
            `/order-status/${orderData.order._id}?customerId=${custId}&uniqueCode=${uniqueCode}`
          );
        } catch (error) {
          alert('Payment verification failed. Please show this screen to the restaurant staff.');
          navigate(
            `/order-status/${orderData.order._id}?customerId=${custId}&uniqueCode=${uniqueCode}`
          );
        }
      },
      prefill: { name: customerName, contact: customerPhone },
      theme: { color: '#3B82F6' },
      modal: {
        ondismiss: function () {
          alert('Payment cancelled. Your order is saved but unpaid.');
        }
      }
    };

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (resp) {
        alert(`Payment failed: ${resp.error?.description || 'Please try again.'}`);
      });
      razorpay.open();
    } catch (error) {
      alert('Failed to open payment window. Please try again.');
    }
  };


  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const themeVars = {
    '--brand': theme.brand,
    '--brand-dark': theme.brandDark,
    '--brand-deep': theme.brandDeep,
    '--brand-soft': theme.brandSoft,
    '--brand-tint': theme.brandTint,
    '--brand-line': theme.brandLine
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-600">Restaurant not found</p>
      </div>
    );
  }

  return (
    <div className="qrd-root min-h-screen" style={themeVars}>
      <style>{`
        .qrd-root {
          background:
            radial-gradient(1200px 500px at 15% -10%, var(--brand-tint) 0%, transparent 60%),
            radial-gradient(900px 450px at 100% 0%, var(--brand-tint) 0%, transparent 55%),
            #FDFDFC;
          color: #1B1B1A;
        }
        .qrd-card {
          background: #FFFFFF;
          border: 1px solid #F0EEEA;
          border-radius: 20px;
          box-shadow: 0 1px 2px rgba(16,15,14,.04), 0 8px 24px -12px rgba(16,15,14,.10);
        }
        .qrd-title {
          font-weight: 700;
          letter-spacing: -0.02em;
        }
        .qrd-chip {
          background: var(--brand-soft);
          color: var(--brand-deep);
        }
        /* Primary action — the one place the page raises its voice */
        .qrd-cta {
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%);
          color: #fff;
          box-shadow: 0 10px 24px -10px var(--brand);
          transition: transform .16s ease, box-shadow .16s ease, filter .16s ease;
        }
        .qrd-cta:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 16px 30px -12px var(--brand);
        }
        .qrd-cta:active:not(:disabled) { transform: translateY(0) scale(.99); }
        .qrd-cta:disabled { filter: grayscale(.35) opacity(.65); box-shadow: none; }
        .qrd-cta::after {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(115deg, transparent 35%, rgba(255,255,255,.35) 50%, transparent 65%);
          transform: translateX(-120%);
          transition: transform .7s ease;
        }
        .qrd-cta:hover:not(:disabled)::after { transform: translateX(120%); }

        .qrd-pill {
          border-radius: 999px;
          transition: transform .14s ease, background-color .18s ease, color .18s ease, box-shadow .18s ease;
        }
        .qrd-pill:active { transform: scale(.96); }
        .qrd-pill-on {
          background: linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%);
          color: #fff;
          box-shadow: 0 8px 18px -10px var(--brand);
        }
        .qrd-pill-off { background: #F6F5F3; color: #57534E; }
        .qrd-pill-off:hover { background: #EFEDEA; }

        .qrd-item {
          transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
        }
        .qrd-item:hover {
          transform: translateY(-3px);
          border-color: var(--brand-line);
          box-shadow: 0 1px 2px rgba(16,15,14,.04), 0 18px 34px -18px rgba(16,15,14,.22);
        }
        .qrd-input {
          width: 100%;
          background: #FBFAF9;
          border: 1px solid #EDEBE7;
          border-radius: 14px;
          padding: .7rem .9rem .7rem 2.5rem;
          font-size: .95rem;
          transition: border-color .16s ease, box-shadow .16s ease, background-color .16s ease;
          outline: none;
        }
        .qrd-input:focus {
          background: #fff;
          border-color: var(--brand);
          box-shadow: 0 0 0 4px var(--brand-soft);
        }
        .qrd-step {
          width: 34px; height: 34px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 11px;
          background: #fff;
          border: 1px solid #ECEAE6;
          transition: transform .12s ease, border-color .16s ease, color .16s ease;
        }
        .qrd-step:hover { border-color: var(--brand); color: var(--brand); }
        .qrd-step:active { transform: scale(.9); }

        .qrd-badge-pop { animation: qrdPop .25s ease; }
        @keyframes qrdPop { 0% { transform: scale(.6); } 60% { transform: scale(1.15); } 100% { transform: scale(1); } }

        .qrd-rise { animation: qrdRise .32s ease both; }
        @keyframes qrdRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

        @media (prefers-reduced-motion: reduce) {
          .qrd-cta, .qrd-pill, .qrd-item, .qrd-step, .qrd-rise, .qrd-badge-pop { animation: none !important; transition: none !important; }
          .qrd-cta:hover { transform: none; }
          .qrd-cta::after { display: none; }
        }
      `}</style>

      {/* ── Phone lookup ── */}
      {showPhoneLookup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="qrd-card w-full max-w-sm p-7 qrd-rise">
            <div className="text-center mb-6">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--brand-soft)' }}
              >
                <Phone className="h-6 w-6" style={{ color: 'var(--brand-deep)' }} />
              </div>
              <h2 className="text-2xl qrd-title">Welcome</h2>
              <p className="text-gray-500 mt-1 text-sm">
                Enter your number so we can pull up your orders
              </p>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone number
            </label>
            <div className="relative">
              <Phone className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                inputMode="numeric"
                value={phoneLookupInput}
                onChange={(e) => setPhoneLookupInput(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyDown={(e) => e.key === 'Enter' && handlePhoneLookup()}
                className="qrd-input"
                placeholder="9876543210"
                maxLength={10}
                autoFocus
              />
            </div>
            {phoneLookupError && (
              <p className="text-red-600 text-sm mt-2">{phoneLookupError}</p>
            )}

            <button
              onClick={handlePhoneLookup}
              disabled={phoneLookupLoading}
              className="qrd-cta w-full mt-5 py-3.5 rounded-2xl font-semibold text-base"
            >
              {phoneLookupLoading ? 'Checking…' : 'Continue'}
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              Ordered here before? Your details load automatically.
            </p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-[#F0EEEA] relative">
        {/* Doodles get their own clipping box — putting overflow-hidden on the
            header itself would cut off the profile dropdown. */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <HeaderDoodles />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {restaurant.logo ? (
              <img
                src={restaurant.logo}
                alt={restaurant.name}
                className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl object-cover flex-shrink-0"
                style={{ boxShadow: '0 0 0 2px #fff, 0 0 0 3.5px var(--brand-line)' }}
              />
            ) : (
              <div
                className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--brand-soft)' }}
              >
                <Store className="h-5 w-5" style={{ color: 'var(--brand-deep)' }} />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-2xl qrd-title truncate leading-tight">
                {restaurant.name}
              </h1>
              {restaurant.address && (restaurant.address.city || restaurant.address.state) && (
                <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 truncate">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--brand)' }} />
                  <span className="truncate">
                    {[restaurant.address.city, restaurant.address.state].filter(Boolean).join(', ')}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <CustomerProfile
              customerId={customerId}
              customerName={customerName}
              isExistingCustomer={customerIsExisting}
              currentOrderId={currentOrderId}
              uniqueCode={uniqueCode}
              onLogout={handleLogout}
            />
            <button
              onClick={() => setShowCart(!showCart)}
              className="qrd-cta qrd-pill flex items-center gap-2 px-4 sm:px-5 py-2.5 font-semibold text-sm"
            >
              <ShoppingCart className="h-[18px] w-[18px]" />
              <span className="hidden sm:inline">Cart</span>
              <span
                key={cartCount}
                className={`min-w-[22px] h-[22px] px-1.5 rounded-full bg-white/25 text-xs font-bold flex items-center justify-center ${cartCount > 0 ? 'qrd-badge-pop' : ''}`}
              >
                {cartCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {/* ── Your details ── */}
            <section className="qrd-card p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center qrd-chip">
                  <User className="h-[18px] w-[18px]" />
                </div>
                <h2 className="text-lg qrd-title">Your details</h2>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Table number <span style={{ color: 'var(--brand)' }}>*</span>
                  </label>
                  <div className="relative">
                    <Hash className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="qrd-input"
                      placeholder="5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your name <span style={{ color: 'var(--brand)' }}>*</span>
                  </label>
                  <div className="relative">
                    <User className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="qrd-input"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone number <span style={{ color: 'var(--brand)' }}>*</span>
                  </label>
                  <div className="relative">
                    <Phone className="h-4 w-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="qrd-input"
                      placeholder="9876543210"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* ── Dietary preference (deliberately keeps veg/non-veg colours) ── */}
            <section className="qrd-card p-5 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center qrd-chip">
                  <Leaf className="h-[18px] w-[18px]" />
                </div>
                <h2 className="text-lg qrd-title">Dietary preference</h2>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  onClick={() => setVegFilter('all')}
                  className={`qrd-pill flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium ${
                    vegFilter === 'all' ? 'qrd-pill-on' : 'qrd-pill-off'
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">All items</span>
                </button>

                <button
                  onClick={() => setVegFilter('veg')}
                  className={`qrd-pill flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium border ${
                    vegFilter === 'veg'
                      ? 'bg-green-600 text-white border-green-600 shadow-[0_8px_18px_-10px_#16a34a]'
                      : 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100'
                  }`}
                >
                  <Leaf className="h-4 w-4" />
                  <span>Veg</span>
                </button>

                <button
                  onClick={() => setVegFilter('nonveg')}
                  className={`qrd-pill flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium border ${
                    vegFilter === 'nonveg'
                      ? 'bg-red-600 text-white border-red-600 shadow-[0_8px_18px_-10px_#dc2626]'
                      : 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100'
                  }`}
                >
                  <Drumstick className="h-4 w-4" />
                  <span>Non-veg</span>
                </button>
              </div>
            </section>

            {/* ── Categories ── */}
            {categories.length > 0 && (
              <div className="overflow-x-auto -mx-1 px-1">
                <div className="flex gap-2 pb-1">
                  {categories.map((cat, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedCategory(cat)}
                      className={`qrd-pill px-5 py-2.5 text-sm font-semibold whitespace-nowrap ${
                        selectedCategory === cat ? 'qrd-pill-on' : 'qrd-pill-off'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── Menu ── */}
            <section className="relative">
              <ChefHatDoodle className="absolute right-2 -top-2 w-16 h-16 opacity-15 pointer-events-none hidden sm:block" />
              <div className="relative flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center qrd-chip">
                  <ChefHat className="h-[18px] w-[18px]" />
                </div>
                <h2 className="text-xl qrd-title">Menu</h2>
              </div>

              {filteredMenuItems.length === 0 ? (
                <div className="qrd-card py-10 px-6 text-center">
                  <EmptyMenuArt />
                  <p className="font-semibold text-gray-800 mt-4">No items available in this category</p>
                  <p className="text-sm text-gray-500 mt-1">Try selecting a different category</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {filteredMenuItems.map((item, idx) => {
                    const inCart = cart.find(c => c._id === item._id);
                    return (
                      <div
                        key={item._id}
                        className="qrd-card qrd-item qrd-rise p-4 flex flex-col"
                        style={{ animationDelay: `${Math.min(idx * 40, 320)}ms` }}
                      >
                        <div className="flex gap-4">
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-1">
                              <h3 className="font-semibold text-[15px] leading-snug">{item.name}</h3>
                              <span
                                className={`mt-1 h-3.5 w-3.5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                                  item.veg ? 'border-green-600' : 'border-red-600'
                                }`}
                                title={item.veg ? 'Veg' : 'Non-veg'}
                              >
                                <span className={`h-1.5 w-1.5 rounded-full ${item.veg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-500 line-clamp-2 mb-2">{item.description}</p>
                            )}
                            <p className="text-lg font-bold" style={{ color: 'var(--brand-deep)' }}>
                              ₹{item.price}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          {inCart ? (
                            <div
                              className="flex items-center justify-between rounded-2xl p-1.5"
                              style={{ background: 'var(--brand-soft)' }}
                            >
                              <button onClick={() => updateQuantity(item._id, -1)} className="qrd-step" aria-label="Remove one">
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="font-bold text-sm" style={{ color: 'var(--brand-deep)' }}>
                                {inCart.quantity} in cart
                              </span>
                              <button onClick={() => updateQuantity(item._id, 1)} className="qrd-step" aria-label="Add one">
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addToCart(item)}
                              className="qrd-cta w-full py-2.5 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2"
                            >
                              <Plus className="h-4 w-4" />
                              Add to cart
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* ── Cart (desktop) ── */}
          <div className="hidden lg:block">
            <div className="qrd-card p-5 sticky top-24">
              <CartSummary
                cart={cart}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                getTotal={getTotal}
                handleCheckout={handleCheckout}
                placingOrder={placingOrder}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Cart (mobile sheet) ── */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto qrd-rise">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl qrd-title">Your order</h2>
              <button
                onClick={() => setShowCart(false)}
                className="h-9 w-9 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"
                aria-label="Close cart"
              >
                ✕
              </button>
            </div>
            <CartSummary
              cart={cart}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
              getTotal={getTotal}
              handleCheckout={handleCheckout}
              placingOrder={placingOrder}
            />
          </div>
        </div>
      )}
    </div>
  );
}


/* ===========================================================================
   ILLUSTRATIONS
   Hand-drawn SVG scenes that inherit the restaurant's brand colour through
   CSS variables, so they retint themselves for every restaurant.
   =========================================================================== */

/** Faint food doodles scattered behind the header. Purely atmospheric. */
function HeaderDoodles() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 w-full h-full"
      viewBox="0 0 1200 120"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ opacity: 0.13, color: 'var(--brand)' }}
    >
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        {/* left leaves */}
        <path d="M28 30c14-10 30-6 34 6-12 9-27 7-34-6Z" />
        <path d="M30 34c10 1 18 5 24 12" strokeWidth="1.5" />
        <path d="M18 74c12-9 26-5 29 5-10 8-23 6-29-5Z" />
        {/* left sprig */}
        <path d="M96 92c8-14 8-26 4-36" strokeWidth="1.5" />
        <path d="M100 70c-7-2-11-7-12-13M100 78c7-1 12-5 14-11" strokeWidth="1.5" />
        {/* right citrus */}
        <circle cx="1150" cy="46" r="20" />
        <path d="M1150 26v40M1130 46h40M1136 32l28 28M1164 32l-28 28" strokeWidth="1.2" />
        {/* right chilli */}
        <path d="M1092 88c14-4 24-14 26-27-14 1-25 10-26 27Z" />
        <path d="M1118 61c3-6 8-9 14-9" strokeWidth="1.5" />
        {/* right leaves */}
        <path d="M1060 24c12-8 25-5 28 5-10 8-22 6-28-5Z" />
      </g>
    </svg>
  );
}

/** Outlined chef's hat that sits beside the Menu heading. */
function ChefHatDoodle({ className = '' }) {
  return (
    <svg
      viewBox="0 0 120 100"
      className={className}
      aria-hidden="true"
      style={{ color: 'var(--brand)' }}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M32 62c-12-2-20-12-20-24 0-13 11-23 24-22 4-10 14-16 24-16s20 6 24 16c13-1 24 9 24 22 0 12-8 22-20 24" />
      <path d="M32 62v22c0 3 2 5 5 5h46c3 0 5-2 5-5V62" />
      <path d="M32 74h56" strokeWidth="1.6" />
      <path d="M48 62V44M60 62V40M72 62V44" strokeWidth="1.6" />
    </svg>
  );
}

/** Domed serving cloche on a hand — the centrepiece of the empty states. */
function ClocheOnHand({ className = '' }) {
  return (
    <svg viewBox="0 0 260 190" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="qrdDome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--brand-soft)" />
          <stop offset="55%" stopColor="var(--brand)" />
          <stop offset="100%" stopColor="var(--brand-dark)" />
        </linearGradient>
      </defs>

      {/* knob */}
      <circle cx="130" cy="42" r="7" fill="var(--brand-dark)" />
      <path d="M130 49v8" stroke="var(--brand-dark)" strokeWidth="5" strokeLinecap="round" />

      {/* dome */}
      <path d="M44 122c0-47 39-66 86-66s86 19 86 66Z" fill="url(#qrdDome)" />
      {/* highlight */}
      <path d="M74 112c2-28 22-42 44-46" stroke="#fff" strokeOpacity=".45" strokeWidth="7" strokeLinecap="round" fill="none" />

      {/* tray */}
      <rect x="30" y="122" width="200" height="13" rx="6.5" fill="var(--brand-deep)" />

      {/* hand + sleeve */}
      <path d="M150 140c14-3 30-1 44 5 7 3 12 8 15 15l-9 5c-4-6-9-10-16-12-13-4-26-4-39-1Z" fill="#E2574C" />
      <path d="M196 150c9 2 17 7 22 15l24 25h-31l-19-22Z" fill="#C6453B" />
      <path d="M118 133c-9 1-17 5-22 12" stroke="var(--brand-deep)" strokeWidth="0" />
    </svg>
  );
}

/** Empty-cart scene: cart, sparkles, a nudging arrow, and the cloche on a dune. */
function EmptyCartArt() {
  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ background: 'var(--brand-tint)' }}>
      {/* faint food doodles in the dune */}
      <svg
        viewBox="0 0 320 120"
        className="absolute bottom-0 left-0 w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 54c46-26 92-26 138 0s92 26 182 0v66H0Z" fill="var(--brand-soft)" />
      </svg>

      <svg
        viewBox="0 0 320 120"
        className="absolute bottom-0 left-0 w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ opacity: 0.35, color: 'var(--brand)' }}
      >
        <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
          <path d="M26 92c8-6 17-4 19 3-7 5-15 4-19-3Z" />
          <circle cx="62" cy="103" r="6" />
          <path d="M96 100c9-3 15-9 16-17-9 1-16 7-16 17Z" />
          <circle cx="268" cy="94" r="7" />
          <path d="M292 106c8-5 16-3 18 3" />
          <path d="M232 108c7-6 15-5 18 1" />
        </g>
      </svg>

      <div className="relative px-6 pt-8">
        {/* cart + sparkles */}
        <div className="relative mx-auto w-fit">
          <svg width="86" height="86" viewBox="0 0 90 90" aria-hidden="true" style={{ color: 'var(--brand)' }}>
            <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 16h9l10 36h34l8-24H30" />
              <circle cx="39" cy="68" r="6" />
              <circle cx="65" cy="68" r="6" />
            </g>
            {/* sparkles */}
            <g fill="var(--brand)">
              <path d="M76 14l2.6 6.4L85 23l-6.4 2.6L76 32l-2.6-6.4L67 23l6.4-2.6Z" opacity=".85" />
              <path d="M14 40l1.8 4.4L20 46l-4.2 1.6L14 52l-1.8-4.4L8 46l4.2-1.6Z" opacity=".6" />
              <path d="M84 44l1.4 3.4L89 49l-3.6 1.4L84 54l-1.4-3.6L79 49l3.6-1.6Z" opacity=".5" />
            </g>
          </svg>
        </div>

        <p className="text-center font-bold text-lg mt-4" style={{ color: '#2A2724' }}>
          Your cart is empty
        </p>
        <p className="text-center text-sm text-gray-500 mt-1">
          Add items from the menu
        </p>

        {/* dotted arrow pointing down to the dish */}
        <svg
          viewBox="0 0 120 70"
          className="mx-auto mt-3 w-20 sm:w-24"
          aria-hidden="true"
          style={{ color: 'var(--brand)', opacity: 0.6 }}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
        >
          <path d="M14 8c26 2 44 14 54 34" strokeDasharray="1 9" />
          <path d="M60 30c8 6 12 14 12 24" strokeDasharray="1 9" />
          <path d="M64 54l8 8 10-6" />
        </svg>

        <ClocheOnHand className="w-full max-w-[14rem] mx-auto -mb-2" />
      </div>
    </div>
  );
}

/** Empty-menu scene: a lone cloche with leaves. */
function EmptyMenuArt() {
  return (
    <svg viewBox="0 0 200 130" className="w-full max-w-[11rem] mx-auto" aria-hidden="true" style={{ color: 'var(--brand)' }}>
      <g fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity=".7">
        {/* knob */}
        <circle cx="100" cy="34" r="5" />
        <path d="M100 39v7" />
        {/* dome */}
        <path d="M40 92c0-33 27-46 60-46s60 13 60 46" />
        {/* tray */}
        <path d="M28 92h144" strokeWidth="5" />
        {/* steam */}
        <path d="M84 26c-4-5-4-10 0-15M116 26c-4-5-4-10 0-15" strokeWidth="2.4" opacity=".55" />
        {/* leaves */}
        <path d="M34 108c10-7 20-5 23 4-8 6-18 5-23-4Z" strokeWidth="2.2" />
        <path d="M166 108c-10-7-20-5-23 4 8 6 18 5 23-4Z" strokeWidth="2.2" />
      </g>
    </svg>
  );
}

function CartSummary({ cart, updateQuantity, removeFromCart, getTotal, handleCheckout, placingOrder }) {
  if (cart.length === 0) {
    return <EmptyCartArt />;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl qrd-title hidden lg:block">Your order</h2>

      <div className="space-y-3 max-h-[22rem] overflow-y-auto pr-1">
        {cart.map(item => (
          <div key={item._id} className="rounded-2xl p-3.5" style={{ background: '#FAF9F8' }}>
            <div className="flex justify-between items-start gap-3 mb-3">
              <div className="min-w-0">
                <h4 className="font-semibold text-[15px] truncate">{item.name}</h4>
                <p className="text-xs text-gray-500 mt-0.5">₹{item.price} each</p>
              </div>
              <button
                onClick={() => removeFromCart(item._id)}
                className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                aria-label={`Remove ${item.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <button onClick={() => updateQuantity(item._id, -1)} className="qrd-step" aria-label="Remove one">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="font-bold text-sm w-5 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item._id, 1)} className="qrd-step" aria-label="Add one">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <span className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-dashed border-[#E8E6E2]">
        <div className="flex justify-between items-baseline mb-4">
          <span className="text-sm font-medium text-gray-500">Total</span>
          <span className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--brand-deep)' }}>
            ₹{getTotal().toFixed(2)}
          </span>
        </div>

        <button
          onClick={handleCheckout}
          disabled={placingOrder}
          className="qrd-cta w-full py-4 rounded-2xl font-bold text-base"
        >
          {placingOrder ? 'Processing…' : 'Proceed to payment'}
        </button>

        <p className="text-[11px] text-gray-400 text-center mt-3">
          Your order reaches the kitchen once payment is confirmed.
        </p>
      </div>
    </div>
  );
}
