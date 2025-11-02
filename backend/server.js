// server.js - Complete Backend in One File
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection - Updated with New Atlas Connection String
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://231fa04195user:vasu@food.5rxumwc.mongodb.net/food?retryWrites=true&w=majority&appName=food', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB Atlas');
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
    res.json({ success: false, message: 'Login failed' });
  }
});

// Food Routes
app.get('/api/food/items', async (req, res) => {
  try {
    const items = await Food.find();
    res.json({ success: true, items });
  } catch (error) {
    res.json({ success: false, message: 'Failed to fetch items' });
  }
});

app.post('/api/food/add', async (req, res) => {
  try {
    const food = new Food(req.body);
    await food.save();
    res.json({ success: true, message: 'Food item added', food });
  } catch (error) {
    res.json({ success: false, message: 'Failed to add food item' });
  }
});

app.delete('/api/food/delete/:id', async (req, res) => {
  try {
    await Food.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Food item deleted' });
  } catch (error) {
    res.json({ success: false, message: 'Failed to delete food item' });
  }
});

// Order Routes
app.post('/api/orders/create', async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.json({ success: true, message: 'Order placed successfully', order });
  } catch (error) {
    res.json({ success: false, message: 'Failed to place order' });
  }
});

app.get('/api/orders/customer/:customerId', async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.params.customerId }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.json({ success: false, message: 'Failed to fetch orders' });
  }
});

app.get('/api/orders/all', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
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
    res.json({ success: true, message: 'Order status updated', order });
  } catch (error) {
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
    res.json({ success: true, message: 'Feedback submitted', order });
  } catch (error) {
    res.json({ success: false, message: 'Failed to submit feedback' });
  }
});

// Food items can be added through the Owner Dashboard

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});