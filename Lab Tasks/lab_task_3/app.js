const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const mongoose = require('mongoose');

const { requireAuth, redirectIfAuthenticated } = require('./middleware/auth');

const Product = require('./models/product');
const User = require('./models/user'); 
const app = express();
const PORT = process.env.PORT || 3000;


mongoose.connect('mongodb://localhost:27017/Hobbs', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
  seedProducts();
}).catch(err => {
  console.error('MongoDB connection error:', err);
});


app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.use(session({
  secret: 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/mainlayout');

app.use((req, res, next) => {
  if (!req.session.cart) {
    req.session.cart = [];
  }
  next();
});

app.use(async (req, res, next) => {

  res.locals.cartCount = req.session.cart ? 
    req.session.cart.reduce((total, item) => total + item.quantity, 0) : 0;

  if (req.session.userId) {
    try {

      res.locals.user = { 
        id: req.session.userId, 
        name: req.session.username,
        email: req.session.userEmail
      };
    } catch (error) {
      console.error('Error fetching user for locals:', error);
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  
  next();
});

async function getProduct(productId) {
  try {
    const product = await Product.findById(productId);
    return product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

async function getAllProducts() {
  try {
    const products = await Product.find({});
    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

async function seedProducts() {
  try {
    const sampleProducts = [
      {
        seedId: 'buttermere_blouse',
        name: 'Buttermere Blouse',
        price: '99.99',
        quantity: '50',
        description: 'Elegant and versatile blouse made with soft, breathable fabric. Ideal for formal or casual wear.',
        image: '/images/img1.png',
        category: 'CLOTHING'
      },
      {
        seedId: 'hever_shirt',
        name: 'Hever Shirt',
        price: '24.99',
        quantity: '100',
        description: 'Classic short-sleeve shirt with a modern fit. Great for everyday comfort and style.',
        image: '/images/img2.png',
        category: 'CLOTHING'
      },
      {
        seedId: 'levens_top',
        name: 'Levens Top',
        price: '45.00',
        quantity: '30',
        description: 'Chic and stylish top with a flattering cut. Perfect for layering or wearing on its own.',
        image: '/images/img3.png',
        category: 'CLOTHING'
      },
      {
        seedId: 'grasmere_shirt',
        name: 'Grasmere Shirt',
        price: '12.99',
        quantity: '200',
        description: 'Lightweight and breathable shirt with a relaxed fit. Suitable for warm weather and casual outings.',
        image: '/images/img4.png',
        category: 'CLOTHING'
      },
      {
        seedId: 'harris_trouser',
        name: 'Harris Trouser',
        price: '35.99',
        quantity: '75',
        description: 'Tailored trousers with a sleek design. Combines comfort and sophistication for any occasion.',
        image: '/images/img5.png',
        category: 'CLOTHING'
      },
      {
        seedId: 'barnsley_jacket',
        name: 'Barnsley Jacket',
        price: '79.99',
        quantity: '40',
        description: 'Stylish jacket made from durable fabric. Features a warm lining, ideal for chilly weather.',
        image: '/images/img6.png',
        category: 'CLOTHING'
      }
    ];

    console.log('Updating/Seeding products...');
    
    for (const productData of sampleProducts) {
      const { seedId, ...productFields } = productData;
      
      await Product.findOneAndUpdate(
        { seedId: seedId }, 
        { 
          ...productFields,
          seedId: seedId,
          updatedAt: new Date()
        },
        { 
          upsert: true, 
          new: true,    
          setDefaultsOnInsert: true
        }
      );
      
      console.log(`✓ Updated/Created product: ${productFields.name}`);
    }

    console.log('✅ All sample products have been updated/seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding products:', error);
  }
}

app.get('/admin/refresh-products', async (req, res) => {
  try {
    await seedProducts();
    res.json({ success: true, message: 'Products refreshed successfully' });
  } catch (error) {
    console.error('Error refreshing products:', error);
    res.status(500).json({ success: false, message: 'Error refreshing products' });
  }
});

app.get('/', async (req, res) => {
  try {
    const products = await getAllProducts();
    res.render('index', { 
      title: 'Home - Hobbs',
      products: products,
      message: req.session.message,
      error: req.session.error
    });
    delete req.session.message;
    delete req.session.error;
  } catch (error) {
    console.error('Error loading home page:', error);
    res.render('index', { 
      title: 'Home - Hobbs',
      products: [],
      error: 'Error loading products'
    });
  }
});

app.get('/product/:id', async (req, res) => {
  try {
    const product = await getProduct(req.params.id);
    if (!product) {
      return res.status(404).render('404', { title: 'Product Not Found - Hobbs' });
    }
    res.render('product-detail', {
      title: `${product.name} - Hobbs`,
      product: product
    });
  } catch (error) {
    console.error('Error loading product:', error);
    res.status(500).render('500', { title: 'Server Error - Hobbs' });
  }
});

const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const checkoutRoutes = require('./routes/checkout');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const productRoutes = require('./routes/products');

app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/checkout', checkoutRoutes);
app.use('/cart', cartRoutes.router);
app.use('/orders', orderRoutes);
app.use('/products', productRoutes);




app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Page Not Found - Hobbs',
    message: 'The page you are looking for does not exist.'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { 
    title: 'Server Error - Hobbs',
    message: 'Something went wrong on our end. Please try again later.'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;