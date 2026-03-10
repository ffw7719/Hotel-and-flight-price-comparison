const mongoose = require('mongoose');

const priceHistorySchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['hotel', 'flight']
  },
  searchParams: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  results: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  platformStats: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  summary: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// 创建索引
priceHistorySchema.index({ type: 1, timestamp: -1 });
priceHistorySchema.index({ 'searchParams.city': 1, timestamp: -1 });
priceHistorySchema.index({ 'searchParams.origin': 1, 'searchParams.destination': 1, timestamp: -1 });

module.exports = mongoose.model('PriceHistory', priceHistorySchema);