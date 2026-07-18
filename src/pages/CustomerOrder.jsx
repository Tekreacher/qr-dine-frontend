import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, Trash2, Store, MapPin, Phone } from 'lucide-react';
import api from '../api/api';
import CustomerProfile from '../components/CustomerProfile';

export default function CustomerOrder() {
  const { uniqueCode } = useParams();
  const navigate = useNavigate();

  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
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

  useEffect(() => {
    fetchRestaurant();
  }, [uniqueCode]);

  const fetchRestaurant = async () => {
    try {
      const response = await api.get(`/restaurant/${uniqueCode}`);
      setRestaurant(response.data.restaurant);
      setMenuItems(response.data.restaurant.menuItems);

      const cats = ['All', ...new Set(response.data.restaurant.menuItems.map(item => item.category).filter(Boolean))];
      setCategories(cats);
      setSelectedCategory('All');

      // Always show phone modal — MongoDB is the only session store.
      // This prevents one person's session leaking to another person on the same device,
      // and works across any table/QR since identity is the phone number, not the device.
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

  const handlePhoneLookup = async () => {
    const phone = phoneLookupInput.trim();
    if (!phone) {
      setPhoneLookupError('Please enter your phone number');
      return;
    }

    setPhoneLookupLoading(true);
    setPhoneLookupError('');

    try {
      const restaurantId = restaurant?._id || restaurant?.id;
      const response = await api.get(`/customer/lookup?phone=${encodeURIComponent(phone)}&restaurantId=${restaurantId}`);

      if (response.data.found) {
        const cust = response.data.customer;
        setCustomerId(cust.customerId);
        setCustomerName(cust.name || '');
        setCustomerPhone(cust.phone || '');
        setCustomerIsExisting(cust.isExistingCustomer || false);
        if (cust.currentOrderId) {
          setCurrentOrderId(cust.currentOrderId);
        }
      } else {
        // New customer — pre-fill phone
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
      return cust.customerId;
    } catch (error) {
      console.error('Error creating customer:', error);
      return null;
    }
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
    setCart(cart.map(item => {
      if (item._id === itemId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
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

      if (response.data.order) {
        const newOrderId = response.data.order._id;
        setCurrentOrderId(newOrderId);
      }

      if (custId && response.data.order) {
        await api.put(`/customer/${custId}/current-order`, {
          orderId: response.data.order._id
        });
      }

      if (response.data.razorpayOrderId) {
        initiatePayment(response.data, custId);
      } else {
        alert('Order created but payment not configured');
      }
    } catch (error) {
      console.error('Order error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create order';
      alert(`Order failed: ${errorMessage}`);
    }
  };

  const initiatePayment = (orderData, custId) => {
    if (typeof window.Razorpay === 'undefined') {
      alert('Payment system not loaded. Please refresh the page and try again.');
      return;
    }

    const options = {
      key: orderData.razorpayKeyId,
      amount: orderData.amount * 100,
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
          navigate(`/order-status/${orderData.order._id}?customerId=${custId}&uniqueCode=${uniqueCode}`);
        } catch (error) {
          alert('Payment verification failed. Please contact restaurant.');
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
      razorpay.open();
    } catch (error) {
      alert('Failed to open payment window. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Restaurant not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Phone Lookup Modal */}
      {showPhoneLookup && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Phone className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Welcome!</h2>
              <p className="text-gray-500 mt-1 text-sm">Enter your phone number to continue</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={phoneLookupInput}
                onChange={(e) => setPhoneLookupInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handlePhoneLookup()}
                className="input-field w-full"
                placeholder="+91 9876543210"
                autoFocus
              />
              {phoneLookupError && (
                <p className="text-red-500 text-sm mt-1">{phoneLookupError}</p>
              )}
            </div>

            <button
              onClick={handlePhoneLookup}
              disabled={phoneLookupLoading}
              className="w-full btn-primary py-3 text-base disabled:opacity-50"
            >
              {phoneLookupLoading ? 'Looking up...' : 'Continue'}
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              Returning customer? Your profile will be loaded automatically.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Store className="h-6 w-6 text-blue-600" />
                {restaurant.name}
              </h1>
              {restaurant.address && (
                <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {restaurant.address.city}, {restaurant.address.state}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <CustomerProfile
                customerId={customerId}
                customerName={customerName}
                isExistingCustomer={customerIsExisting}
                currentOrderId={currentOrderId}
                uniqueCode={uniqueCode}
              />
              <button
                onClick={() => setShowCart(!showCart)}
                className="relative btn-primary flex items-center gap-2"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Cart</span>
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {/* Customer Info */}
            <div className="card">
              <h2 className="font-semibold mb-4">Your Details</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Table Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    className="input-field"
                    placeholder="5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="input-field"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="input-field"
                    placeholder="+91 9876543210"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Dietary Filter */}
            <div className="card">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <span className="font-medium text-gray-700">Dietary Preference:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVegFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                      vegFilter === 'all' ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >All Items</button>
                  <button
                    onClick={() => setVegFilter('veg')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-1.5 ${
                      vegFilter === 'veg' ? 'bg-green-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 border border-green-700 inline-block flex-shrink-0"></span>
                    Veg Only
                  </button>
                  <button
                    onClick={() => setVegFilter('nonveg')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-1.5 ${
                      vegFilter === 'nonveg' ? 'bg-red-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 border border-red-700 inline-block flex-shrink-0"></span>
                    Non-Veg Only
                  </button>
                </div>
              </div>
            </div>

            {/* Categories */}
            {categories.length > 0 && (
              <div className="overflow-x-auto">
                <div className="flex gap-2 pb-2">
                  {categories.map((cat, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-6 py-3 rounded-lg font-medium whitespace-nowrap transition-colors ${
                        selectedCategory === cat
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >{cat}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Menu Items */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Menu</h2>

              {filteredMenuItems.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-gray-600">No items available in this category</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {filteredMenuItems.map(item => (
                    <div key={item._id} className="card hover:shadow-lg transition-shadow">
                      <div className="flex gap-4 mb-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold">{item.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              item.veg ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {item.veg ? '🟢 Veg' : '🔴 Non-Veg'}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          )}
                          <p className="text-lg font-bold text-blue-600">₹{item.price}</p>
                        </div>
                      </div>

                      {cart.find(cartItem => cartItem._id === item._id) ? (
                        <div className="flex items-center justify-between bg-blue-50 rounded-lg p-2">
                          <button onClick={() => updateQuantity(item._id, -1)} className="bg-white p-2 rounded-lg hover:bg-gray-100">
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="font-semibold">{cart.find(c => c._id === item._id).quantity}</span>
                          <button onClick={() => updateQuantity(item._id, 1)} className="bg-white p-2 rounded-lg hover:bg-gray-100">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="w-full btn-primary flex items-center justify-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add to Cart
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cart - Desktop */}
          <div className="hidden lg:block">
            <div className="card sticky top-24">
              <CartSummary
                cart={cart}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
                getTotal={getTotal}
                handleCheckout={handleCheckout}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Cart Modal - Mobile */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden">
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Your Cart</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-500">✕</button>
            </div>
            <CartSummary
              cart={cart}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
              getTotal={getTotal}
              handleCheckout={handleCheckout}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CartSummary({ cart, updateQuantity, removeFromCart, getTotal, handleCheckout }) {
  if (cart.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">Your cart is empty</p>
        <p className="text-sm text-gray-500 mt-2">Add items from the menu</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Your Order</h2>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {cart.map(item => (
          <div key={item._id} className="bg-gray-50 rounded-lg p-3">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <h4 className="font-semibold">{item.name}</h4>
                <p className="text-sm text-gray-600">₹{item.price} each</p>
              </div>
              <button onClick={() => removeFromCart(item._id)} className="text-red-500 hover:text-red-700">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => updateQuantity(item._id, -1)} className="bg-white p-1 rounded hover:bg-gray-100">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-semibold">{item.quantity}</span>
                <button onClick={() => updateQuantity(item._id, 1)} className="bg-white p-1 rounded hover:bg-gray-100">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-2xl font-bold text-blue-600">₹{getTotal().toFixed(2)}</span>
        </div>

        <button onClick={handleCheckout} className="w-full btn-primary py-3 text-lg">
          Proceed to Payment
        </button>
      </div>
    </div>
  );
}
