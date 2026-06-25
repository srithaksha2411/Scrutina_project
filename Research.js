const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  industry: String,
  address: String,
  website: String,
  phone: String,
  email: String,
  verificationScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  source: {
    type: String,
    enum: [
      'google',
      'google_organic',
      'google_local',
      'google_maps',
      'google_knowledge_graph',
      'google_places',
      'serp_api',
      'serp_api_local',
      'serp_api_organic',
      'linkedin',
      'facebook',
      'instagram',
      'twitter',
      'website',
      'directory',
      'review_platform',
      'government_database',
      'industry_directory',
      'manual',
      'unknown'
    ],
    default: 'unknown'
  }
});

const researchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  query: {
    type: String,
    required: true,
    trim: true
  },
  businesses: [businessSchema],
  summary: {
    totalFound: {
      type: Number,
      default: 0
    },
    verifiedCount: {
      type: Number,
      default: 0
    },
    duplicatesRemoved: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
researchSchema.index({ userId: 1, createdAt: -1 });
researchSchema.index({ query: 'text' });

module.exports = mongoose.model('Research', researchSchema);
