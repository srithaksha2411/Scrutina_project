const mongoose = require('mongoose');

const searchCacheSchema = new mongoose.Schema({
  // Search query parameters
  query: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    default: ''
  },
  location: {
    type: String,
    trim: true,
    default: ''
  },
  
  // Normalized query for matching (case-insensitive, trimmed)
  normalizedQuery: {
    type: String,
    required: true,
    index: true
  },
  
  // Cached research data
  searchResults: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  aiSummary: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  statistics: {
    totalBusinesses: { type: Number, default: 0 },
    verifiedCount: { type: Number, default: 0 },
    duplicatesRemoved: { type: Number, default: 0 },
    totalFound: { type: Number, default: 0 }
  },
  
  trustScores: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  verificationResults: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Cache metadata
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  researchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Research',
    index: true
  },
  
  accessCount: {
    type: Number,
    default: 0
  },
  
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
});

// Compound index for efficient cache lookups
searchCacheSchema.index({ normalizedQuery: 1, userId: 1 });

// TTL index - MongoDB will automatically delete documents when expiresAt is reached
searchCacheSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to normalize query for consistent matching
searchCacheSchema.statics.normalizeQuery = function(query, category = '', location = '') {
  const normalized = `${query.toLowerCase().trim()}|${category.toLowerCase().trim()}|${location.toLowerCase().trim()}`;
  return normalized;
};

// Static method to find valid cache
searchCacheSchema.statics.findValidCache = async function(query, category, location, userId) {
  const normalizedQuery = this.normalizeQuery(query, category, location);
  const now = new Date();
  
  const cache = await this.findOne({
    normalizedQuery,
    userId,
    expiresAt: { $gt: now }
  }).sort({ createdAt: -1 });
  
  return cache;
};

// Instance method to update access tracking
searchCacheSchema.methods.recordAccess = async function() {
  this.accessCount += 1;
  this.lastAccessed = new Date();
  await this.save();
};

// Instance method to get cache age in milliseconds
searchCacheSchema.methods.getCacheAge = function() {
  return Date.now() - this.createdAt.getTime();
};

// Instance method to check if cache is still valid
searchCacheSchema.methods.isValid = function() {
  return this.expiresAt > new Date();
};

const SearchCache = mongoose.model('SearchCache', searchCacheSchema);

module.exports = SearchCache;
