const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { requireAuth } = require('../middleware/auth');
const Complaint = require('../models/complaint');
const Order = require('../models/order');

router.get('/', requireAuth, async (req, res) => {
  try {
    const complaints = await Complaint.findByUserId(req.session.userId);
    
    res.render('contact', {
      title: 'Contact Us - Hobbs',
      complaints: complaints,
      message: req.session.message,
      error: req.session.error
    });

    delete req.session.message;
    delete req.session.error;
  } catch (error) {
    console.error('Error loading contact page:', error);
    res.render('contact', {
      title: 'Contact Us - Hobbs',
      complaints: [],
      error: 'Error loading your complaints'
    });
  }
});

router.post('/submit', requireAuth, async (req, res) => {
  try {
    const { orderId, message } = req.body;

    if (!orderId || !message) {
      req.session.error = 'Please provide both Order ID and message';
      return res.redirect('/contact');
    }
    
    if (message.trim().length < 10) {
      req.session.error = 'Message must be at least 10 characters long';
      return res.redirect('/contact');
    }

    let cleanOrderId = orderId.trim().replace(/^#?ORD-?/i, '');

    let orderExists = null;
 
    if (mongoose.Types.ObjectId.isValid(cleanOrderId)) {
      orderExists = await Order.findOne({
        _id: cleanOrderId,
        userId: req.session.userId
      });
    }
    
    if (!orderExists && cleanOrderId.length >= 8) {

      const userOrders = await Order.find({ userId: req.session.userId });
      orderExists = userOrders.find(order => {
        const orderNum = order._id.toString().slice(-8).toUpperCase();
        return orderNum === cleanOrderId.toUpperCase();
      });
    }
   
    if (!orderExists) {
      orderExists = await Order.findOne({
        userId: req.session.userId
      }).where('_id').equals(orderId.trim());
    }
    
    if (!orderExists) {

      const User = require('../models/user');
      const user = await User.findById(req.session.userId);
      
      if (user && user.email) {

        if (mongoose.Types.ObjectId.isValid(cleanOrderId)) {
          orderExists = await Order.findOne({
            _id: cleanOrderId,
            customerEmail: user.email
          });
        }
        

        if (!orderExists && cleanOrderId.length >= 8) {
          const guestOrders = await Order.find({ customerEmail: user.email });
          orderExists = guestOrders.find(order => {
            const orderNum = order._id.toString().slice(-8).toUpperCase();
            return orderNum === cleanOrderId.toUpperCase();
          });
        }
      }
    }
    
    if (!orderExists) {
      req.session.error = 'Order not found. Please check your Order ID and try again.';
      return res.redirect('/contact');
    }
  
    const complaint = new Complaint({
      userId: req.session.userId,
      orderId: orderId.trim(), 
      message: message.trim()
    });
    
    await complaint.save();
    
    req.session.message = 'Your complaint has been submitted successfully. We will review it shortly.';
    res.redirect('/contact');
    
  } catch (error) {
    console.error('Error submitting complaint:', error);
    req.session.error = 'Error submitting complaint. Please try again.';
    res.redirect('/contact');
  }
});

router.get('/complaint/:id', requireAuth, async (req, res) => {
  try {
    const complaint = await Complaint.findOne({
      _id: req.params.id,
      userId: req.session.userId
    });
    
    if (!complaint) {
      req.session.error = 'Complaint not found';
      return res.redirect('/contact');
    }
    
    res.render('complaint-detail', {
      title: `Complaint ${complaint.complaintNumber} - Hobbs`,
      complaint: complaint
    });
    
  } catch (error) {
    console.error('Error loading complaint details:', error);
    req.session.error = 'Error loading complaint details';
    res.redirect('/contact');
  }
});

module.exports = router;