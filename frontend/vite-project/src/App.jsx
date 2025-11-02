import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, MapPin, Check, Clock, Bike, Star, LogOut, Package, ChefHat } from 'lucide-react';
import './App.css';

// FIXED: Correct API URL configuration
const API_URL = import.meta.env.VITE_API_URL || 'https://msd-backend-mgv8.onrender.com/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(true);

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (savedUser) {
      setUser(savedUser);
      setShowAuth(false);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setShowAuth(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    setShowAuth(true);
  };

  if (showAuth) {
    return <AuthPage onLogin={handleLogin} />;
  }

  if (user?.role === 'owner') {
    return <OwnerDashboard user={user} onLogout={handleLogout} />;
  }

  return <CustomerApp user={user} onLogout={handleLogout} />;
}

// Auth Page Component
function AuthPage({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    restaurantName: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const url = `${API_URL}${endpoint}`;
    
    console.log('Making request to:', url);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ ...formData, role })
      });
      
      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Response:', data);
      
      if (data.success) {
        onLogin(data.user);
      } else {
        alert(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error: ${error.message}. Please check if backend is running at ${API_URL}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          <h1 className="auth-title">🍔 FoodExpress</h1>
          <p className="auth-subtitle">Delicious food delivered to your door</p>
        </div>
        
        <div className="tab-container">
          <button
            className={`tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
          <button
            className={`tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            Register
          </button>
        </div>

        <div className="role-selector">
          <label className="role-label">
            <input
              type="radio"
              value="customer"
              checked={role === 'customer'}
              onChange={(e) => setRole(e.target.value)}
            />
            <span>Customer</span>
          </label>
          <label className="role-label">
            <input
              type="radio"
              value="owner"
              checked={role === 'owner'}
              onChange={(e) => setRole(e.target.value)}
            />
            <span>Restaurant Owner</span>
          </label>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="input"
              required
            />
          )}
          
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="input"
            required
          />
          
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="input"
            required
          />

          {!isLogin && (
            <>
              <input
                type="tel"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="input"
                required
              />
              <input
                type="text"
                placeholder="Address"
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="input"
                required
              />
              {role === 'owner' && (
                <input
                  type="text"
                  placeholder="Restaurant Name"
                  value={formData.restaurantName}
                  onChange={(e) => setFormData({...formData, restaurantName: e.target.value})}
                  className="input"
                  required
                />
              )}
            </>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>
        
        <p style={{fontSize: '12px', color: '#666', marginTop: '10px', textAlign: 'center'}}>
          API: {API_URL}
        </p>
      </div>
    </div>
  );
}

// Customer App Component
function CustomerApp({ user, onLogout }) {
  const [view, setView] = useState('menu');
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchFoodItems();
  }, []);

  useEffect(() => {
    if (view === 'orders') {
      fetchOrders();
    }
  }, [view]);

  const fetchFoodItems = async () => {
    try {
      const response = await fetch(`${API_URL}/food/items`);
      const data = await response.json();
      if (data.success) {
        setFoodItems(data.items);
      }
    } catch (error) {
      console.error('Error fetching food items:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/orders/customer/${user._id}`);
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const addToCart = (item) => {
    const existing = cart.find(c => c._id === item._id);
    if (existing) {
      setCart(cart.map(c => c._id === item._id ? {...c, quantity: c.quantity + 1} : c));
    } else {
      setCart([...cart, {...item, quantity: 1}]);
    }
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(c => c._id !== itemId));
  };

  const updateQuantity = (itemId, delta) => {
    setCart(cart.map(c => {
      if (c._id === itemId) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? {...c, quantity: newQty} : c;
      }
      return c;
    }).filter(c => c.quantity > 0));
  };

  const placeOrder = async (paymentMethod) => {
    const orderData = {
      customerId: user._id,
      customerName: user.name,
      customerPhone: user.phone,
      customerAddress: user.address,
      items: cart.map(c => ({
        foodId: c._id,
        name: c.name,
        price: c.price,
        quantity: c.quantity
      })),
      totalAmount: cart.reduce((sum, c) => sum + (c.price * c.quantity), 0),
      paymentMethod
    };

    try {
      const response = await fetch(`${API_URL}/orders/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Order placed successfully!');
        setCart([]);
        setView('orders');
      }
    } catch (error) {
      alert('Error placing order');
    }
  };

  const submitFeedback = async (orderId, rating, comment) => {
    try {
      const response = await fetch(`${API_URL}/orders/feedback`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, rating, comment })
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Feedback submitted successfully!');
        fetchOrders();
      }
    } catch (error) {
      alert('Error submitting feedback');
    }
  };

  const categories = ['All', ...new Set(foodItems.map(item => item.category))];
  const filteredItems = selectedCategory === 'All' 
    ? foodItems 
    : foodItems.filter(item => item.category === selectedCategory);

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">🍔 FoodExpress</h1>
          <div className="header-right">
            <span className="user-name">Hello, {user.name}</span>
            <button 
              className={`nav-btn ${view === 'menu' ? 'active' : ''}`}
              onClick={() => setView('menu')}
            >
              Menu
            </button>
            <button 
              className={`nav-btn ${view === 'cart' ? 'active' : ''}`}
              onClick={() => setView('cart')}
            >
              <ShoppingCart size={18} />
              Cart ({cart.length})
            </button>
            <button 
              className={`nav-btn ${view === 'orders' ? 'active' : ''}`}
              onClick={() => setView('orders')}
            >
              My Orders
            </button>
            <button className="logout-btn" onClick={onLogout}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {view === 'menu' && (
          <MenuView 
            categories={categories}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            foodItems={filteredItems}
            addToCart={addToCart}
          />
        )}
        
        {view === 'cart' && (
          <CartView 
            cart={cart}
            updateQuantity={updateQuantity}
            removeFromCart={removeFromCart}
            placeOrder={placeOrder}
          />
        )}
        
        {view === 'orders' && (
          <OrdersView orders={orders} submitFeedback={submitFeedback} />
        )}
      </main>
    </div>
  );
}

// Menu View Component
function MenuView({ categories, selectedCategory, setSelectedCategory, foodItems, addToCart }) {
  return (
    <div className="menu-container">
      <div className="category-bar">
        {categories.map(cat => (
          <button
            key={cat}
            className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="food-grid">
        {foodItems.map(item => (
          <div key={item._id} className="food-card">
            <img src={item.image} alt={item.name} className="food-image" />
            <div className="food-info">
              <h3 className="food-name">{item.name}</h3>
              <p className="food-category">{item.category}</p>
              <p className="food-description">{item.description}</p>
              <div className="rating-container">
                <Star size={16} fill="#FFD700" color="#FFD700" />
                <span className="rating">{item.rating}</span>
              </div>
              <p className="food-price">₹{item.price}</p>
              <button 
                className="add-to-cart-btn"
                onClick={() => addToCart(item)}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Cart View Component
function CartView({ cart, updateQuantity, removeFromCart, placeOrder }) {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (cart.length === 0) {
    return (
      <div className="empty-state">
        <ShoppingCart size={64} color="#ccc" />
        <h2>Your cart is empty</h2>
        <p>Add some delicious items to get started!</p>
      </div>
    );
  }

  if (showPayment) {
    return (
      <div className="payment-container">
        <h2 className="section-title">Choose Payment Method</h2>
        <div className="payment-methods">
          <label className="payment-option">
            <input
              type="radio"
              value="cash"
              checked={paymentMethod === 'cash'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span>💵 Cash on Delivery</span>
          </label>
          <label className="payment-option">
            <input
              type="radio"
              value="card"
              checked={paymentMethod === 'card'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span>💳 Card Payment</span>
          </label>
          <label className="payment-option">
            <input
              type="radio"
              value="upi"
              checked={paymentMethod === 'upi'}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            <span>📱 UPI</span>
          </label>
        </div>
        <div className="payment-actions">
          <button 
            className="back-btn"
            onClick={() => setShowPayment(false)}
          >
            Back to Cart
          </button>
          <button 
            className="confirm-order-btn"
            onClick={() => placeOrder(paymentMethod)}
          >
            Confirm Order - ₹{total}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <h2 className="section-title">Your Cart</h2>
      <div className="cart-items">
        {cart.map(item => (
          <div key={item._id} className="cart-item">
            <img src={item.image} alt={item.name} className="cart-item-image" />
            <div className="cart-item-info">
              <h3 className="cart-item-name">{item.name}</h3>
              <p className="cart-item-price">₹{item.price}</p>
            </div>
            <div className="quantity-control">
              <button 
                className="quantity-btn"
                onClick={() => updateQuantity(item._id, -1)}
              >
                -
              </button>
              <span className="quantity">{item.quantity}</span>
              <button 
                className="quantity-btn"
                onClick={() => updateQuantity(item._id, 1)}
              >
                +
              </button>
            </div>
            <p className="cart-item-total">₹{item.price * item.quantity}</p>
            <button 
              className="remove-btn"
              onClick={() => removeFromCart(item._id)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <div className="cart-summary">
        <h3>Total: ₹{total}</h3>
        <button 
          className="checkout-btn"
          onClick={() => setShowPayment(true)}
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
}

// Orders View Component
function OrdersView({ orders, submitFeedback }) {
  const [showFeedback, setShowFeedback] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <Clock size={64} color="#ccc" />
        <h2>No orders yet</h2>
        <p>Order some delicious food to see your orders here!</p>
      </div>
    );
  }

  const handleFeedbackSubmit = (orderId) => {
    submitFeedback(orderId, rating, comment);
    setShowFeedback(null);
    setRating(5);
    setComment('');
  };

  return (
    <div className="orders-container">
      <h2 className="section-title">My Orders</h2>
      {orders.map(order => (
        <div key={order._id} className="order-card">
          <div className="order-header">
            <div>
              <h3>Order #{order._id.slice(-6)}</h3>
              <p className="order-date">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <div className="order-status">
              <span className={`status-badge status-${order.status}`}>
                {order.status}
              </span>
            </div>
          </div>
          
          <div className="order-items">
            {order.items.map((item, idx) => (
              <div key={idx} className="order-item">
                <span>{item.name} x {item.quantity}</span>
                <span>₹{item.price * item.quantity}</span>
              </div>
            ))}
          </div>
          
          <div className="order-total">
            <strong>Total: ₹{order.totalAmount}</strong>
            <span>Payment: {order.paymentMethod}</span>
          </div>

          {order.status !== 'pending' && order.status !== 'cancelled' && (
            <div className="tracking-container">
              <h4 className="tracking-title">Order Tracking</h4>
              <div className="tracking-steps">
                <div className={`tracking-step ${['accepted', 'preparing', 'out-for-delivery', 'delivered'].includes(order.status) ? 'active' : ''}`}>
                  <div className="step-icon">
                    <Check size={20} />
                  </div>
                  <span>Accepted</span>
                </div>
                <div className={`tracking-step ${['preparing', 'out-for-delivery', 'delivered'].includes(order.status) ? 'active' : ''}`}>
                  <div className="step-icon">
                    <ChefHat size={20} />
                  </div>
                  <span>Preparing</span>
                </div>
                <div className={`tracking-step ${['out-for-delivery', 'delivered'].includes(order.status) ? 'active' : ''}`}>
                  <div className="step-icon">
                    <Bike size={20} />
                  </div>
                  <span>On the Way</span>
                </div>
                <div className={`tracking-step ${order.status === 'delivered' ? 'active' : ''}`}>
                  <div className="step-icon">
                    <MapPin size={20} />
                  </div>
                  <span>Delivered</span>
                </div>
              </div>
            </div>
          )}

          {order.status === 'delivered' && !order.feedback && (
            <div className="feedback-section">
              {showFeedback === order._id ? (
                <div className="feedback-form">
                  <h4>Rate your order</h4>
                  <div className="rating-input">
                    {[1, 2, 3, 4, 5].map(r => (
                      <Star
                        key={r}
                        size={24}
                        fill={r <= rating ? '#FFD700' : 'none'}
                        color="#FFD700"
                        onClick={() => setRating(r)}
                        style={{ cursor: 'pointer' }}
                      />
                    ))}
                  </div>
                  <textarea
                    className="feedback-textarea"
                    placeholder="Share your experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <div className="feedback-actions">
                    <button className="cancel-btn" onClick={() => setShowFeedback(null)}>Cancel</button>
                    <button className="submit-feedback-btn" onClick={() => handleFeedbackSubmit(order._id)}>Submit</button>
                  </div>
                </div>
              ) : (
                <button className="feedback-btn" onClick={() => setShowFeedback(order._id)}>
                  Give Feedback
                </button>
              )}
            </div>
          )}

          {order.feedback && (
            <div className="feedback-display">
              <h4>Your Feedback</h4>
              <div className="feedback-rating">
                {[1, 2, 3, 4, 5].map(r => (
                  <Star
                    key={r}
                    size={18}
                    fill={r <= order.feedback.rating ? '#FFD700' : 'none'}
                    color="#FFD700"
                  />
                ))}
              </div>
              <p className="feedback-comment">{order.feedback.comment}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Owner Dashboard Component
function OwnerDashboard({ user, onLogout }) {
  const [view, setView] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [showAddFood, setShowAddFood] = useState(false);
  const [newFood, setNewFood] = useState({
    name: '',
    category: '',
    price: '',
    rating: '4.5',
    image: '',
    description: ''
  });

  useEffect(() => {
    fetchOrders();
    fetchFoodItems();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/orders/all`);
      const data = await response.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchFoodItems = async () => {
    try {
      const response = await fetch(`${API_URL}/food/items`);
      const data = await response.json();
      if (data.success) {
        setFoodItems(data.items);
      }
    } catch (error) {
      console.error('Error fetching food items:', error);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const response = await fetch(`${API_URL}/orders/update-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchOrders();
      }
    } catch (error) {
      alert('Error updating order status');
    }
  };

  const addFoodItem = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/food/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFood)
      });
      
      const data = await response.json();
      if (data.success) {
        alert('Food item added successfully!');
        setShowAddFood(false);
        setNewFood({ name: '', category: '', price: '', rating: '4.5', image: '', description: '' });
        fetchFoodItems();
      }
    } catch (error) {
      alert('Error adding food item');
    }
  };

  const deleteFood = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const response = await fetch(`${API_URL}/food/delete/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      if (data.success) {
        fetchFoodItems();
      }
    } catch (error) {
      alert('Error deleting food item');
    }
  };

  return (
    <div className="app">
      <header className="header owner-header">
        <div className="header-content">
          <h1 className="logo">🍔 {user.restaurantName || 'FoodExpress'}</h1>
          <div className="header-right">
            <span className="user-name">Owner: {user.name}</span>
            <button 
              className={`nav-btn ${view === 'orders' ? 'active' : ''}`}
              onClick={() => setView('orders')}
            >
              <Package size={18} />
              Orders
            </button>
            <button 
              className={`nav-btn ${view === 'menu' ? 'active' : ''}`}
              onClick={() => setView('menu')}
            >
              Menu Management
            </button>
            <button className="logout-btn" onClick={onLogout}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        {view === 'orders' && (
          <div className="owner-orders">
            <h2 className="section-title">Incoming Orders</h2>
            {orders.length === 0 ? (
              <div className="empty-state">
                <Clock size={64} color="#ccc" />
                <h2>No orders yet</h2>
              </div>
            ) : (
              orders.map(order => (
                <div key={order._id} className="owner-order-card">
                  <div className="order-header">
                    <div>
                      <h3>Order #{order._id.slice(-6)}</h3>
                      <p><strong>Customer:</strong> {order.customerName}</p>
                      <p><strong>Phone:</strong> {order.customerPhone}</p>
                      <p><strong>Address:</strong> {order.customerAddress}</p>
                      <p className="order-date">{new Date(order.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="order-status">
                      <span className={`status-badge status-${order.status}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>

                  <div className="order-items">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="order-item">
                        <span>{item.name} x {item.quantity}</span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-total">
                    <strong>Total: ₹{order.totalAmount}</strong>
                    <span>Payment: {order.paymentMethod}</span>
                  </div>

                  <div className="order-actions">
                    {order.status === 'pending' && (
                      <>
                        <button 
                          className="accept-btn"
                          onClick={() => updateOrderStatus(order._id, 'accepted')}
                        >
                          Accept Order
                        </button>
                        <button 
                          className="reject-btn"
                          onClick={() => updateOrderStatus(order._id, 'cancelled')}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {order.status === 'accepted' && (
                      <button 
                        className="accept-btn"
                        onClick={() => updateOrderStatus(order._id, 'preparing')}
                      >
                        Start Preparing
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button 
                        className="accept-btn"
                        onClick={() => updateOrderStatus(order._id, 'out-for-delivery')}
                      >
                        Out for Delivery
                      </button>
                    )}
                    {order.status === 'out-for-delivery' && (
                      <button 
                        className="accept-btn"
                        onClick={() => updateOrderStatus(order._id, 'delivered')}
                      >
                        Mark as Delivered
                      </button>
                    )}
                  </div>

                  {order.feedback && (
                    <div className="feedback-display">
                      <h4>Customer Feedback</h4>
                      <div className="feedback-rating">
                        {[1, 2, 3, 4, 5].map(r => (
                          <Star
                            key={r}
                            size={18}
                            fill={r <= order.feedback.rating ? '#FFD700' : 'none'}
                            color="#FFD700"
                          />
                        ))}
                      </div>
                      <p className="feedback-comment">{order.feedback.comment}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {view === 'menu' && (
          <div className="menu-management">
            <div className="menu-header">
              <h2 className="section-title">Menu Management</h2>
              <button 
                className="add-food-btn"
                onClick={() => setShowAddFood(!showAddFood)}
              >
                {showAddFood ? 'Cancel' : 'Add New Item'}
              </button>
            </div>

            {showAddFood && (
              <form onSubmit={addFoodItem} className="add-food-form">
                <input
                  type="text"
                  placeholder="Food Name"
                  value={newFood.name}
                  onChange={(e) => setNewFood({...newFood, name: e.target.value})}
                  className="input"
                  required
                />
                <input
                  type="text"
                  placeholder="Category (e.g., Pizza, Burger)"
                  value={newFood.category}
                  onChange={(e) => setNewFood({...newFood, category: e.target.value})}
                  className="input"
                  required
                />
                <input
                  type="number"
                  placeholder="Price"
                  value={newFood.price}
                  onChange={(e) => setNewFood({...newFood, price: e.target.value})}
                  className="input"
                  required
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Rating (0-5)"
                  value={newFood.rating}
                  onChange={(e) => setNewFood({...newFood, rating: e.target.value})}
                  className="input"
                  required
                />
                <input
                  type="url"
                  placeholder="Image URL"
                  value={newFood.image}
                  onChange={(e) => setNewFood({...newFood, image: e.target.value})}
                  className="input"
                  required
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newFood.description}
                  onChange={(e) => setNewFood({...newFood, description: e.target.value})}
                  className="input"
                  required
                />
                <button type="submit" className="submit-btn">Add Food Item</button>
              </form>
            )}

            <div className="food-grid">
              {foodItems.map(item => (
                <div key={item._id} className="food-card">
                  <img src={item.image} alt={item.name} className="food-image" />
                  <div className="food-info">
                    <h3 className="food-name">{item.name}</h3>
                    <p className="food-category">{item.category}</p>
                    <p className="food-description">{item.description}</p>
                    <div className="rating-container">
                      <Star size={16} fill="#FFD700" color="#FFD700" />
                      <span className="rating">{item.rating}</span>
                    </div>
                    <p className="food-price">₹{item.price}</p>
                    <button 
                      className="delete-btn"
                      onClick={() => deleteFood(item._id)}
                    >
                      Delete Item
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}