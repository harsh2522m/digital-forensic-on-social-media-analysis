const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema(
  {
    // Unique evidence identifier (e.g., EVD-2026-001)
    evidenceId: {
      type: String,
      unique: true,
      sparse: true, // Allow null for auto-generation
      index: true,
    },

    // Reference to investigation (required)
    investigationId: {
      type: String,
      required: true,
      index: true,
    },

    // Source name (e.g., "CNN News", "Reddit Thread")
    sourceName: {
      type: String,
      required: true,
      trim: true,
    },

    // Source type: News, Blog, Forum, Public Social Media, Other Public Web Source
    sourceType: {
      type: String,
      enum: ['News', 'Blog', 'Forum', 'Public Social Media', 'Other Public Web Source'],
      required: true,
    },

    // URL of the source (publicly accessible)
    sourceUrl: {
      type: String,
      trim: true,
    },

    // Author or source attribution
    author: {
      type: String,
      trim: true,
    },

    // When the source content was published (e.g., article date)
    publicationDate: {
      type: Date,
    },

    // When the evidence was collected (server-generated, immutable)
    collectionTimestamp: {
      type: Date,
      default: Date.now,
      immutable: true,
    },

    // The actual evidence content (immutable)
    content: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          // Reject empty or whitespace-only content
          return v && v.trim().length > 0;
        },
        message: 'Evidence content cannot be empty or whitespace only',
      },
      immutable: true,
    },

    // SHA-256 hash of the evidence content (immutable, auto-generated)
    sha256Hash: {
      type: String,
      required: true,
      immutable: true,
    },

    // Notes about the evidence (editable)
    notes: {
      type: String,
      trim: true,
    },

    // Analysis status: Pending, Analyzed
    analysisStatus: {
      type: String,
      enum: ['Pending', 'Analyzed'],
      default: 'Pending',
    },

    // ===== ANALYSIS RESULTS =====
    // Do NOT modify original content or hash
    
    // Sentiment analysis results
    sentimentLabel: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative'],
      default: null,
    },
    
    sentimentScore: {
      type: Number,
      min: -1,
      max: 1,
      default: null,
    },

    // Extracted keywords with frequencies
    extractedKeywords: [
      {
        keyword: String,
        frequency: Number,
      },
    ],

    // Topic classification
    topics: [
      {
        name: {
          type: String,
          enum: ['Cybersecurity', 'Privacy', 'Customer Service', 'Product', 'Pricing', 'Fraud', 'Reputation', 'General'],
        },
        confidence: Number, // 0-1
        isPrimary: Boolean, // true for main topic
      },
    ],

    // Relevance score based on investigation keywords & target
    relevanceScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    relevanceLevel: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: null,
    },

    // When the analysis was performed
    analyzedAt: {
      type: Date,
      default: null,
    },

    // Analysis methodology version
    analysisVersion: {
      type: String,
      default: '1.0',
    },

    // Hash verification status (computed field, not stored)
    // Verification is done on-demand via the verify endpoint
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Compound index for faster evidence lookup by investigation
evidenceSchema.index({ investigationId: 1, createdAt: -1 });

// Auto-generate evidenceId before saving if not provided
evidenceSchema.pre('save', async function (next) {
  if (!this.evidenceId) {
    try {
      // Generate ID in format: EVD-YYYY-XXX (e.g., EVD-2026-001)
      const year = new Date().getFullYear();
      const Evidence = mongoose.model('Evidence');
      
      // Count existing evidence for this year
      const count = await Evidence.countDocuments({
        evidenceId: new RegExp(`^EVD-${year}`),
      }).catch(() => 0);
      
      this.evidenceId = `EVD-${year}-${String(count + 1).padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating evidenceId:', error);
      // Fall back to timestamp-based ID
      this.evidenceId = `EVD-${Date.now()}`;
    }
  }

  // Ensure collectionTimestamp is set (should be set by default, but enforce)
  if (!this.collectionTimestamp) {
    this.collectionTimestamp = new Date();
  }

  next();
});

module.exports = mongoose.model('Evidence', evidenceSchema);
