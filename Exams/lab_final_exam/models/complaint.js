const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderId: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'resolved', 'closed'],
    default: 'pending'
  },
  adminResponse: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

complaintSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

complaintSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

complaintSchema.statics.findByUserId = function(userId) {
  return this.find({ userId: userId }).sort({ createdAt: -1 });
};

complaintSchema.virtual('complaintNumber').get(function() {
  return 'CMP-' + this._id.toString().slice(-8).toUpperCase();
});

const Complaint = mongoose.model('Complaint', complaintSchema);
module.exports = Complaint;