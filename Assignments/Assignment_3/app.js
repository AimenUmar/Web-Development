const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

let users = []; 

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

app.locals.users = users;

app.use((req, res, next) => {
  res.locals.user = req.session.userId
    ? users.find(u => u.id === req.session.userId)
    : null;
  next();
});

const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const checkoutRoutes = require('./routes/checkout');
const productRoutes = require('./routes/products'); // Add this line

app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', checkoutRoutes);
app.use('/products', productRoutes); // Add this line

app.use((req, res) => {
  res.status(404).render('404', { title: 'Page Not Found - Hobbs' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('500', { title: 'Server Error - Hobbs' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;