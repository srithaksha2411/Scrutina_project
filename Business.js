const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  researchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Research',
    required: true,
    index: true
  },
  businessName: {
    type: String,
    required: true,
    trim: true
  },
  website: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  phone: String,
  email: String,
  address: String,
  location: String,
  description: String,
  workingHours: String,
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  services: [String],
  specialties: [String],
  licenseInformation: String,
  certifications: [String],
  awards: [String],
  socialProfiles: {
    linkedin: { type: String, default: null },
    facebook: { type: String, default: null },
    instagram: { type: String, default: null },
    twitter: { type: String, default: null },
    youtube: { type: String, default: null }
  },
  imageUrls: [String],
  sourceUrls: [String],
  verificationScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  verificationStatus: {
    type: String,
    enum: ['VERIFIED', 'HIGH_CONFIDENCE', 'MEDIUM_CONFIDENCE', 'LOW_CONFIDENCE'],
    default: 'LOW_CONFIDENCE'
  },
  duplicateCount: {
    type: Number,
    default: 0
  },
  dataSources: [{
    source: {
      type: String,
      default: ''
    },
    url: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: ''
    },
    scrapedAt: {
      type: Date,
      default: Date.now
    }
  }],
  industry: String,
  securityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  conflicts: {
    phone: {
      detected: { type: Boolean, default: false },
      values: [{
        value: String,
        source: String,
        count: Number
      }],
      uniqueCount: Number
    },
    email: {
      detected: { type: Boolean, default: false },
      values: [{
        value: String,
        source: String,
        count: Number
      }],
      uniqueCount: Number
    },
    address: {
      detected: { type: Boolean, default: false },
      values: [{
        value: String,
        source: String,
        count: Number
      }],
      uniqueCount: Number
    },
    website: {
      detected: { type: Boolean, default: false },
      values: [{
        value: String,
        source: String,
        count: Number
      }],
      uniqueCount: Number
    },
    workingHours: {
      detected: { type: Boolean, default: false },
      values: [{
        value: String,
        source: String,
        count: Number
      }],
      uniqueCount: Number
    }
  },
  conflictMetadata: {
    totalConflicts: { type: Number, default: 0 },
    hasConflicts: { type: Boolean, default: false },
    conflictPenalty: { type: Number, default: 0 }
  },
  verified: {
    type: Boolean,
    default: false
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

// Index for fast lookups
businessSchema.index({ businessName: 'text' });
businessSchema.index({ location: 1 });

// Update timestamp on save
businessSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Business', businessSchema);
