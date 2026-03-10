const mongoose = require('mongoose');

const priceAlertSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['hotel', 'flight']
  },
  id: {
    type: String,
    required: true,
    index: true
  },
  targetPrice: {
    type: Number,
    required: true,
    min: 0
  },
  condition: {
    type: String,
    required: true,
    enum: ['below', 'above'],
    default: 'below'
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  triggered: {
    type: Boolean,
    default: false
  },
  lastTriggered: {
    type: Date
  },
  triggerCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 创建索引
priceAlertSchema.index({ userId: 1, type: 1, id: 1 });
priceAlertSchema.index({ active: 1, createdAt: -1 });

// 预保存钩子
priceAlertSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('PriceAlert', priceAlertSchema);