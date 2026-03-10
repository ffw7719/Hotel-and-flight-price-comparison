const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_]+$/,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phone: {
    type: String,
    trim: true,
    match: /^[0-9]{11}$/,
    sparse: true
  },
  preferences: {
    currency: {
      type: String,
      enum: ['CNY', 'USD', 'EUR', 'GBP', 'JPY'],
      default: 'CNY'
    },
    language: {
      type: String,
      enum: ['zh-CN', 'en-US', 'ja-JP'],
      default: 'zh-CN'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      priceAlert: {
        type: Boolean,
        default: true
      },
      marketing: {
        type: Boolean,
        default: false
      }
    },
    searchHistory: {
      enabled: {
        type: Boolean,
        default: true
      },
      maxItems: {
        type: Number,
        default: 100
    }
    },
    defaultPlatforms: {
      type: [String],
      default: ['meituan', 'ctrip', 'fliggy']
    }
  },
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: 50
    },
    avatar: {
      type: String,
      default: '/assets/default-avatar.png'
    },
    bio: {
      type: String,
      maxlength: 500
    },
    location: {
      type: String,
      maxlength: 100
    }
  },
  statistics: {
    totalSearches: {
      type: Number,
      default: 0
    },
    totalSavings: {
      type: Number,
      default: 0
    },
    favoritePlatforms: {
      type: Map,
      of: Number,
      default: new Map()
    },
    lastSearchType: {
      type: String,
      enum: ['hotel', 'flight'],
      default: null
    }
  },
  security: {
    lastLogin: {
      type: Date
    },
    lastPasswordChange: {
      type: Date,
      default: Date.now
    },
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockedUntil: {
      type: Date
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: {
      type: String
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.security.twoFactorSecret;
      return ret;
    }
  }
});

// 创建索引
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ 'security.loginAttempts': 1 });
userSchema.index({ 'statistics.totalSearches': -1 });

// 预保存钩子
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 预保存钩子 - 更新统计信息
userSchema.pre('save', function(next) {
  if (this.isModified('password')) {
    this.security.lastPasswordChange = new Date();
  }
  next();
});

// 实例方法 - 检查账户是否被锁定
userSchema.methods.isLocked = function() {
  return this.security.lockedUntil && this.security.lockedUntil > new Date();
};

// 实例方法 - 增加登录尝试次数
userSchema.methods.incrementLoginAttempts = function() {
  this.security.loginAttempts += 1;
  
  // 如果尝试次数超过5次，锁定账户30分钟
  if (this.security.loginAttempts >= 5) {
    this.security.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
  }
  
  return this.save();
};

// 实例方法 - 重置登录尝试次数
userSchema.methods.resetLoginAttempts = function() {
  this.security.loginAttempts = 0;
  this.security.lockedUntil = null;
  return this.save();
};

// 实例方法 - 更新统计信息
userSchema.methods.updateStatistics = function(searchType, platform) {
  this.statistics.totalSearches += 1;
  this.statistics.lastSearchType = searchType;
  
  if (platform) {
    const currentCount = this.statistics.favoritePlatforms.get(platform) || 0;
    this.statistics.favoritePlatforms.set(platform, currentCount + 1);
  }
  
  return this.save();
};

// 实例方法 - 检查用户权限
userSchema.methods.hasPermission = function(permission) {
  const permissions = {
    user: ['read', 'search', 'create_alert'],
    admin: ['read', 'search', 'create_alert', 'manage_users', 'manage_platforms'],
    moderator: ['read', 'search', 'create_alert', 'manage_content']
  };
  
  return permissions[this.role] && permissions[this.role].includes(permission);
};

// 静态方法 - 查找活跃用户
userSchema.statics.findActive = function() {
  return this.find({ isActive: true, deletedAt: null });
};

// 静态方法 - 查找需要验证的用户
userSchema.statics.findUnverified = function() {
  return this.find({ isVerified: false, isActive: true, deletedAt: null });
};

// 静态方法 - 查找被锁定的用户
userSchema.statics.findLocked = function() {
  return this.find({
    'security.lockedUntil': { $gt: new Date() },
    isActive: true,
    deletedAt: null
  });
};

module.exports = mongoose.model('User', userSchema);