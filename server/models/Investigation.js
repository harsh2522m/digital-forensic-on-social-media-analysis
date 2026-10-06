const mongoose = require('mongoose');

const investigationSchema = new mongoose.Schema(
  {
    // Unique investigation identifier (e.g., INV-2026-001)
    investigationId: {
      type: String,
      unique: true,
      sparse: true, // Allow null for auto-generation
      index: true,
    },
    
    // Investigation name
    name: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Investigation target (company, person, event, topic, etc.)
    target: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Detailed description of the investigation
    description: {
      type: String,
      trim: true,
    },
    
    // Keywords relevant to the investigation
    keywords: {
      type: [String],
      default: [],
    },
    
    // Investigation start date
    startDate: {
      type: Date,
      required: true,
    },
    
    // Investigation end date
    endDate: {
      type: Date,
    },
    
    // Name of the investigator
    investigator: {
      type: String,
      required: true,
      trim: true,
    },
    
    // Investigation status
    status: {
      type: String,
      enum: ['active', 'completed', 'on_hold', 'closed'],
      default: 'active',
    },
    
    // Notes about the investigation
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Auto-generate investigationId before saving if not provided
investigationSchema.pre('save', async function (next) {
  if (!this.investigationId) {
    try {
      // Generate ID in format: INV-YYYY-XXX (e.g., INV-2026-001)
      const year = new Date().getFullYear();
      const Investigation = mongoose.model('Investigation');
      
      // Count existing investigations for this year
      const count = await Investigation.countDocuments({
        investigationId: new RegExp(`^INV-${year}`),
      }).catch(() => 0);
      
      this.investigationId = `INV-${year}-${String(count + 1).padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating investigationId:', error);
      // Fall back to timestamp-based ID
      this.investigationId = `INV-${Date.now()}`;
    }
  }
  next();
});

module.exports = mongoose.model('Investigation', investigationSchema);
