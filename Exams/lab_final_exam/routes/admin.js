const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Order = require('../models/order');
const { requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ status: 'pending' });
    const deliveredOrders = await Order.countDocuments({ status: 'delivered' });

    res.render('admin/dashboard', {
      title: 'Admin Dashboard - Hobbs',
      layout: 'layouts/admin',
      stats: {
        totalProducts,
        totalOrders,
        pendingOrders,
        deliveredOrders
      },
      message: req.session.message,
      error: req.session.error
    });

    delete req.session.message;
    delete req.session.error;
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    res.render('admin/dashboard', {
      title: 'Admin Dashboard - Hobbs',
      layout: 'layouts/admin',
      error: 'Error loading dashboard data',
      stats: { totalProducts: 0, totalOrders: 0, pendingOrders: 0, deliveredOrders: 0 }
    });
  }
});

router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const orders = await Order.find({})
      .sort({ orderDate: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit);

    res.render('admin/orders', {
      title: 'Manage Orders - Admin',
      layout: 'layouts/admin',
      orders: orders,
      currentPage: page,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      message: req.session.message,
      error: req.session.error
    });

    delete req.session.message;
    delete req.session.error;
  } catch (error) {
    console.error('Error loading orders:', error);
    res.render('admin/orders', {
      title: 'Manage Orders - Admin',
      layout: 'layouts/admin',
      orders: [],
      error: 'Error loading orders',
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false
    });
  }
});

router.post('/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      req.session.error = 'Order not found';
      return res.redirect('/admin/orders');
    }

    order.status = status;
    if (status === 'delivered') {
      order.deliveryDate = new Date();
    }
    await order.save();

    req.session.message = `Order ${order.orderNumber} status updated to ${status}`;
    res.redirect('/admin/orders');
  } catch (error) {
    console.error('Error updating order status:', error);
    req.session.error = 'Error updating order status';
    res.redirect('/admin/orders');
  }
});

router.get('/orders/:id', requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).render('admin/order-detail', {
        title: 'Order Not Found - Admin',
        layout: 'layouts/admin',
        order: null,
        error: 'Order not found'
      });
    }

    res.render('admin/order-detail', {
      title: `Order ${order.orderNumber} - Admin`,
      layout: 'layouts/admin',
      order: order
    });
  } catch (error) {
    console.error('Error loading order details:', error);
    res.status(500).render('admin/order-detail', {
      title: 'Error - Admin',
      layout: 'layouts/admin',
      order: null,
      error: 'Error loading order details'
    });
  }
});

router.get('/products', requireAdmin, async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });

    res.render('admin/products', {
      title: 'Manage Products - Admin',
      layout: 'layouts/admin',
      products: products,
      message: req.session.message,
      error: req.session.error
    });

    delete req.session.message;
    delete req.session.error;
  } catch (error) {
    console.error('Error loading products:', error);
    res.render('admin/products', {
      title: 'Manage Products - Admin',
      layout: 'layouts/admin',
      products: [],
      error: 'Error loading products'
    });
  }
});

router.get('/products/add', requireAdmin, (req, res) => {
  res.render('admin/add-product', {
    title: 'Add Product - Admin',
    layout: 'layouts/admin',
    error: req.session.error,
    formData: req.session.formData || {}
  });

  delete req.session.error;
  delete req.session.formData;
});

router.post('/products/add', requireAdmin, async (req, res) => {
  try {
    const { name, price, quantity, description, image, category } = req.body;

    if (!name || !price || !quantity) {
      req.session.error = 'Name, price, and quantity are required';
      req.session.formData = req.body;
      return res.redirect('/admin/products/add');
    }

    const newProduct = new Product({
      name: name.trim(),
      price: price.toString(),
      quantity: quantity.toString(),
      description: description ? description.trim() : '',
      image: image ? image.trim() : '',
      category: category ? category.trim() : 'general'
    });

    await newProduct.save();
    console.log('New product created:', newProduct.name);

    req.session.message = `Product "${newProduct.name}" added successfully!`;
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Error adding product:', error);
    req.session.error = 'Error adding product. Please try again.';
    req.session.formData = req.body;
    res.redirect('/admin/products/add');
  }
});

router.get('/products/:id/edit', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      req.session.error = 'Product not found';
      return res.redirect('/admin/products');
    }

    res.render('admin/edit-product', {
      title: `Edit ${product.name} - Admin`,
      layout: 'layouts/admin',
      product: product,
      error: req.session.error
    });

    delete req.session.error;
  } catch (error) {
    console.error('Error loading product for edit:', error);
    req.session.error = 'Error loading product';
    res.redirect('/admin/products');
  }
});

router.post('/products/:id/edit', requireAdmin, async (req, res) => {
  try {
    const { name, price, quantity, description, image, category } = req.body;

    if (!name || !price || !quantity) {
      req.session.error = 'Name, price, and quantity are required';
      return res.redirect(`/admin/products/${req.params.id}/edit`);
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      req.session.error = 'Product not found';
      return res.redirect('/admin/products');
    }

    product.name = name.trim();
    product.price = price.toString();
    product.quantity = quantity.toString();
    product.description = description ? description.trim() : '';
    product.image = image ? image.trim() : '';
    product.category = category ? category.trim() : 'general';

    await product.save();
    console.log('Product updated:', product.name);

    req.session.message = `Product "${product.name}" updated successfully!`;
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Error updating product:', error);
    req.session.error = 'Error updating product. Please try again.';
    res.redirect(`/admin/products/${req.params.id}/edit`);
  }
});

router.post('/products/:id/delete', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      req.session.error = 'Product not found';
      return res.redirect('/admin/products');
    }

    await Product.findByIdAndDelete(req.params.id);
    console.log('Product deleted:', product.name);

    req.session.message = `Product "${product.name}" deleted successfully!`;
    res.redirect('/admin/products');
  } catch (error) {
    console.error('Error deleting product:', error);
    req.session.error = 'Error deleting product. Please try again.';
    res.redirect('/admin/products');
  }
});

router.get('/complaints', requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    const status = req.query.status || 'all';

    let query = {};
    if (status !== 'all') {
      query.status = status;
    }

    const complaints = await Complaint.find(query)
      .populate('userId', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalComplaints = await Complaint.countDocuments(query);
    const totalPages = Math.ceil(totalComplaints / limit);

    const statusCounts = await Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusStats = {
      all: totalComplaints,
      pending: 0,
      'in-progress': 0,
      resolved: 0,
      closed: 0
    };

    statusCounts.forEach(stat => {
      statusStats[stat._id] = stat.count;
    });

    res.render('admin/complaints', {
      title: 'Manage Complaints - Admin',
      layout: 'layouts/admin',
      complaints: complaints,
      currentPage: page,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      currentStatus: status,
      statusStats: statusStats,
      message: req.session.message,
      error: req.session.error
    });

    delete req.session.message;
    delete req.session.error;
  } catch (error) {
    console.error('Error loading complaints:', error);
    res.render('admin/complaints', {
      title: 'Manage Complaints - Admin',
      layout: 'layouts/admin',
      complaints: [],
      error: 'Error loading complaints',
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
      currentStatus: 'all',
      statusStats: { all: 0, pending: 0, 'in-progress': 0, resolved: 0, closed: 0 }
    });
  }
});

router.get('/complaints/:id', requireAdmin, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('userId', 'firstName lastName email');
    
    if (!complaint) {
      return res.status(404).render('admin/complaint-detail', {
        title: 'Complaint Not Found - Admin',
        layout: 'layouts/admin',
        complaint: null,
        error: 'Complaint not found'
      });
    }

    res.render('admin/complaint-detail', {
      title: `Complaint ${complaint.complaintNumber} - Admin`,
      layout: 'layouts/admin',
      complaint: complaint,
      message: req.session.message,
      error: req.session.error
    });

    delete req.session.message;
    delete req.session.error;
  } catch (error) {
    console.error('Error loading complaint details:', error);
    res.status(500).render('admin/complaint-detail', {
      title: 'Error - Admin',
      layout: 'layouts/admin',
      complaint: null,
      error: 'Error loading complaint details'
    });
  }
});

router.post('/complaints/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      req.session.error = 'Complaint not found';
      return res.redirect('/admin/complaints');
    }

    complaint.status = status;
    await complaint.save();

    req.session.message = `Complaint ${complaint.complaintNumber} status updated to ${status}`;
    res.redirect('/admin/complaints');
  } catch (error) {
    console.error('Error updating complaint status:', error);
    req.session.error = 'Error updating complaint status';
    res.redirect('/admin/complaints');
  }
});
router.post('/complaints/:id/response', requireAdmin, async (req, res) => {
  try {
    const { adminResponse } = req.body;
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      req.session.error = 'Complaint not found';
      return res.redirect('/admin/complaints');
    }

    if (!adminResponse || adminResponse.trim().length === 0) {
      req.session.error = 'Admin response cannot be empty';
      return res.redirect(`/admin/complaints/${req.params.id}`);
    }

    complaint.adminResponse = adminResponse.trim();
    complaint.status = 'in-progress'; 
    await complaint.save();

    req.session.message = `Response added to complaint ${complaint.complaintNumber}`;
    res.redirect(`/admin/complaints/${req.params.id}`);
  } catch (error) {
    console.error('Error adding admin response:', error);
    req.session.error = 'Error adding admin response';
    res.redirect(`/admin/complaints/${req.params.id}`);
  }
});
module.exports = router;