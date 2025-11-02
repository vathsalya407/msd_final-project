// server.js - Complete Backend in One File
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fooddelivery', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
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

// Initial Food Data
const initialFoodItems = [
  {
    name: 'Chicken Burger',
    category: 'Burger',
    price: 199,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
    description: 'Juicy chicken patty with fresh vegetables'
  },
  {
    name: 'Veg Burger',
    category: 'Burger',
    price: 149,
    rating: 4.3,
    image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=500',
    description: 'Delicious vegetable patty burger'
  },
  {
    name: 'Cheese Burger',
    category: 'Burger',
    price: 179,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500',
    description: 'Double cheese loaded burger'
  },
  {
    name: 'Veg Biryani',
    category: 'Biryani',
    price: 249,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500',
    description: 'Aromatic basmati rice with vegetables'
  },
  {
    name: 'Chicken Biryani',
    category: 'Biryani',
    price: 299,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500',
    description: 'Traditional chicken biryani with spices'
  },
  {
    name: 'Mutton Biryani',
    category: 'Biryani',
    price: 349,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1633945274309-c440f7e1f99e?w=500',
    description: 'Premium mutton biryani'
  },
  {
    name: 'Paneer Tikka',
    category: 'Starter',
    price: 179,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=500',
    description: 'Grilled paneer cubes with spices'
  },
  {
    name: 'Chicken Tikka',
    category: 'Starter',
    price: 229,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500',
    description: 'Tandoori chicken tikka'
  },
  {
    name: 'French Fries',
    category: 'Starter',
    price: 99,
    rating: 4.2,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500',
    description: 'Crispy golden french fries'
  },
  {
    name: 'Chocolate Shake',
    category: 'Beverage',
    price: 129,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500',
    description: 'Thick chocolate milkshake'
  },
  {
    name: 'Mango Shake',
    category: 'Beverage',
    price: 119,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=500',
    description: 'Fresh mango smoothie'
  },
  {
    name: 'Cold Coffee',
    category: 'Beverage',
    price: 139,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=500',
    description: 'Chilled coffee with ice cream'
  },
  {
    name: 'Margherita Pizza',
    category: 'Pizza',
    price: 299,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500',
    description: 'Classic cheese and tomato pizza'
  },
  {
    name: 'Pepperoni Pizza',
    category: 'Pizza',
    price: 349,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500',
    description: 'Loaded with pepperoni slices'
  },
  {
    name: 'Veg Supreme Pizza',
    category: 'Pizza',
    price: 329,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=500',
    description: 'Loaded with fresh vegetables'
  },
  {
    name: 'Pasta Alfredo',
    category: 'Pasta',
    price: 249,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500',
    description: 'Creamy white sauce pasta'
  },
  {
    name: 'Pasta Arrabiata',
    category: 'Pasta',
    price: 229,
    rating: 4.3,
    image: 'https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=500',
    description: 'Spicy red sauce pasta'
  },
  {
    name: 'Mac and Cheese',
    category: 'Pasta',
    price: 199,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=500',
    description: 'Cheesy macaroni pasta'
  },
  {
    name: 'Samosa',
    category: 'Snacks',
    price: 49,
    rating: 4.2,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500',
    description: 'Crispy fried samosas'
  },
  {
    name: 'Spring Rolls',
    category: 'Snacks',
    price: 129,
    rating: 4.3,
    image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=500',
    description: 'Crunchy vegetable spring rolls'
  },
  {
    name: 'Nachos',
    category: 'Snacks',
    price: 179,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500',
    description: 'Nachos with cheese and salsa'
  },
  {
    name: 'Caesar Salad',
    category: 'Salad',
    price: 199,
    rating: 4.3,
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=500',
    description: 'Fresh caesar salad with dressing'
  },
  {
    name: 'Greek Salad',
    category: 'Salad',
    price: 189,
    rating: 4.2,
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=500',
    description: 'Mediterranean style salad'
  },
  {
    name: 'Garden Salad',
    category: 'Salad',
    price: 159,
    rating: 4.1,
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500',
    description: 'Mixed green salad'
  },
  {
    name: 'Gulab Jamun',
    category: 'Dessert',
    price: 89,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500',
    description: 'Traditional Indian sweet'
  },
  {
    name: 'Ice Cream Sundae',
    category: 'Dessert',
    price: 129,
    rating: 4.5,
    image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500',
    description: 'Delicious ice cream with toppings'
  },
  {
    name: 'Chocolate Brownie',
    category: 'Dessert',
    price: 149,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1564355808853-1d0e0c9143ea?w=500',
    description: 'Rich chocolate brownie with ice cream'
  },
  {
    name: 'Cheesecake',
    category: 'Dessert',
    price: 179,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1533134242820-b2df5ad4b8cf?w=500',
    description: 'Creamy New York style cheesecake'
  },
  {
    name: 'Noodles',
    category: 'Chinese',
    price: 169,
    rating: 4.4,
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=500',
    description: 'Hakka noodles with vegetables'
  },
  {
    name: 'Fried Rice',
    category: 'Chinese',
    price: 179,
    rating: 4.3,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500',
    description: 'Chinese style fried rice'
  }
];

// Initialize Database with Food Items
async function initializeFood() {
  const count = await Food.countDocuments();
  if (count === 0) {
    await Food.insertMany(initialFoodItems);
    console.log('Initial food items added to database');
  }
}

initializeFood();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});