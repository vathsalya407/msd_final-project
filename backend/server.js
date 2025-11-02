// server.js - Complete Backend in One File
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware - CORS with environment variable support
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// MongoDB Connection - Updated with environment variable and better error handling
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://231fa04195user:vasu@food.5rxumwc.mongodb.net/food?retryWrites=true&w=majority&appName=food', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => console.error('❌ MongoDB connection error:', err));

const db = mongoose.connection;
db.on('error', console.error.bind(console, '❌ Connection error:'));
db.once('open', () => {
  console.log('✅ MongoDB Connected - Database Ready');
});

// Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  phone: String,
  address: String,
  role: { type: String, enum: ['customer', 'owner'], default: 'customer' },
  restaurantName: String,
  createdAt: { type: Date, default: Date.now }
});

const foodSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  rating: Number,
  image: String,
  description: String,
  createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  customerId: mongoose.Schema.Types.ObjectId,
  customerName: String,
  customerPhone: String,
  customerAddress: String,
  items: [{
    foodId: mongoose.Schema.Types.ObjectId,
    name: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: Number,
  status: { 
    type: String, 
    enum: ['pending', 'accepted', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: String,
  feedback: {
    rating: Number,
    comment: String,
    createdAt: Date
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Food = mongoose.model('Food', foodSchema);
const Order = mongoose.model('Order', orderSchema);

// Routes

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'FoodExpress API is running!', 
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, role, restaurantName } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: 'Email already exists' });
    }

    const user = new User({ 
      name, 
      email, 
      password, 
      phone, 
      address, 
      role,
      restaurantName: role === 'owner' ? restaurantName : undefined
    });
    await user.save();

    console.log('✅ User registered:', email);

    res.json({ 
      success: true, 
      message: 'Registration successful',
      user: { 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        phone: user.phone,
        address: user.address,
        restaurantName: user.restaurantName
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.json({ success: false, message: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    const user = await User.findOne({ email, password, role });
    if (!user) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }

    console.log('✅ User logged in:', email);

    res.json({ 
      success: true, 
      message: 'Login successful',
      user: { 
        _id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        phone: user.phone,
        address: user.address,
        restaurantName: user.restaurantName
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.json({ success: false, message: 'Login failed' });
  }
});

// Food Routes
app.get('/api/food/items', async (req, res) => {
  try {
    const items = await Food.find();
    console.log(`📋 Fetched ${items.length} food items`);
    res.json({ success: true, items });
  } catch (error) {
    console.error('❌ Fetch items error:', error);
    res.json({ success: false, message: 'Failed to fetch items' });
  }
});

app.post('/api/food/add', async (req, res) => {
  try {
    console.log('📝 Received food item:', req.body);
    
    const food = new Food(req.body);
    const savedFood = await food.save();
    
    console.log('✅ Food item saved to DB:', savedFood._id);
    
    res.json({ success: true, message: 'Food item added', food: savedFood });
  } catch (error) {
    console.error('❌ Error saving food item:', error);
    res.status(500).json({ success: false, message: 'Failed to add food item', error: error.message });
  }
});

app.delete('/api/food/delete/:id', async (req, res) => {
  try {
    await Food.findByIdAndDelete(req.params.id);
    console.log('🗑️ Food item deleted:', req.params.id);
    res.json({ success: true, message: 'Food item deleted' });
  } catch (error) {
    console.error('❌ Delete error:', error);
    res.json({ success: false, message: 'Failed to delete food item' });
  }
});

// Order Routes
app.post('/api/orders/create', async (req, res) => {
  try {
    const order = new Order(req.body);
    const savedOrder = await order.save();
    console.log('✅ Order created:', savedOrder._id);
    res.json({ success: true, message: 'Order placed successfully', order: savedOrder });
  } catch (error) {
    console.error('❌ Create order error:', error);
    res.json({ success: false, message: 'Failed to place order' });
  }
});

app.get('/api/orders/customer/:customerId', async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.params.customerId }).sort({ createdAt: -1 });
    console.log(`📦 Fetched ${orders.length} orders for customer:`, req.params.customerId);
    res.json({ success: true, orders });
  } catch (error) {
    console.error('❌ Fetch customer orders error:', error);
    res.json({ success: false, message: 'Failed to fetch orders' });
  }
});

app.get('/api/orders/all', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    console.log(`📦 Fetched ${orders.length} total orders`);
    res.json({ success: true, orders });
  } catch (error) {
    console.error('❌ Fetch all orders error:', error);
    res.json({ success: false, message: 'Failed to fetch orders' });
  }
});

app.put('/api/orders/update-status', async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const order = await Order.findByIdAndUpdate(
      orderId, 
      { status },
      { new: true }
    );
    console.log('✅ Order status updated:', orderId, '→', status);
    res.json({ success: true, message: 'Order status updated', order });
  } catch (error) {
    console.error('❌ Update status error:', error);
    res.json({ success: false, message: 'Failed to update order status' });
  }
});

app.put('/api/orders/feedback', async (req, res) => {
  try {
    const { orderId, rating, comment } = req.body;
    const order = await Order.findByIdAndUpdate(
      orderId,
      { 
        feedback: { 
          rating, 
          comment, 
          createdAt: new Date() 
        } 
      },
      { new: true }
    );
    console.log('✅ Feedback submitted for order:', orderId);
    res.json({ success: true, message: 'Feedback submitted', order });
  } catch (error) {
    console.error('❌ Feedback error:', error);
    res.json({ success: false, message: 'Failed to submit feedback' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});