const express = require('express');
const router = express.Router();

const products = [
  {
    id: 1,
    name: "Buttermere Blouse",
    price: 99.99,
    image: "/images/img1.png"
  },
  {
    id: 2,
    name: "Hever Shirt",
    price: 24.99,
    image: "/images/img2.png"
  },
  {
    id: 3,
    name: "Levens Top",
    price: 45.00,
    image: "/images/img3.png"
  },
  {
    id: 4,
    name: "Grasmere Shirt",
    price: 12.99,
    image: "/images/img4.png"
  },
  {
    id: 5,
    name: "Harris Trousers",
    price: 35.99,
    image: "/images/img5.png"
  },
  {
    id: 6,
    name: "Bransley Jacket",
    price: 79.99,
    image: "/images/img6.png"
  }
];

router.get('/', (req, res) => {
  res.render('products', { products: products });
});

router.get('/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = products.find(p => p.id === productId);
  
  if (product) {
    res.render('product-detail', { product: product });
  } else {
    res.status(404).send('Product not found');
  }
});

module.exports = router;