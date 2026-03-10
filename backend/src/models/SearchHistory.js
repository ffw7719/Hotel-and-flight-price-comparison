const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  searchId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['hotel', 'flight']
  },
  searchParams: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  userAgent: {
    type: String,
    default: 'Unknown'
  },
  ip: {
    type: String,
    default: 'Unknown'
  },
  responseTime: {
    type: Number,
    default: 0
  },
  cached: {
    type: Boolean,
    default: false
  },
  resultsCount: {
    type: Number,
    default: 0
  },
  error: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// 创建索引
searchHistorySchema.index({ type: 1, timestamp: -1 });
searchHistorySchema.index({ 'searchParams.city': 1, timestamp: -1 });
searchHistorySchema.index({ 'searchParams.origin': 1, 'searchParams.destination': 1, timestamp: -1 });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);