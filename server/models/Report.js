const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      unique: true,
      required: true,
      default: () => 'report_' + Math.random().toString(36).substr(2, 9)
    },
    investigationId: {
      type: String,
      required: true,
      index: true
    },
    generatedAt: {
      type: Date,
      default: Date.now
    },
    analysisVersion: {
      type: String,
      default: '1.0'
    },
    applicationVersion: {
      type: String,
      default: '1.0'
    },
    reportMetadata: {
      title: String,
      investigationName: String,
      target: String,
      investigator: String,
      totalEvidence: Number,
      analyzedEvidence: Number,
      generatedTimestamp: Date
    },
    pdfFileName: String,
    status: {
      type: String,
      enum: ['generated', 'archived'],
      default: 'generated'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', ReportSchema);
