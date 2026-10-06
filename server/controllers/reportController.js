/**
 * Report Controller
 * Handles forensic report generation, retrieval, and management
 */

const Investigation = require('../models/Investigation');
const Evidence = require('../models/Evidence');
const Report = require('../models/Report');
const reportGenerator = require('../services/reportGenerator');
const fs = require('fs');
const path = require('path');

/**
 * POST /api/reports/:investigationId
 * Generate a new forensic report
 */
exports.generateReport = async (req, res) => {
  try {
    const { investigationId } = req.params;

    // Find investigation
    let investigation = await Investigation.findById(investigationId);
    if (!investigation) {
      investigation = await Investigation.findOne({ investigationId });
    }

    if (!investigation) {
      return res.status(404).json({
        error: 'Investigation not found',
        investigationId
      });
    }

    // Get evidence
    const invId = investigation.investigationId || investigation._id.toString();
    const evidence = await Evidence.find({
      investigationId: invId,
      analysisStatus: { $ne: 'Archived' }
    });

    if (evidence.length === 0) {
      return res.status(400).json({
        error: 'No evidence available for report generation',
        investigationId,
        hint: 'Add evidence items before generating a report'
      });
    }

    // Check if evidence has been analyzed
    const analyzedCount = evidence.filter(e => e.sentimentLabel).length;
    if (analyzedCount === 0) {
      return res.status(400).json({
        error: 'Evidence has not been analyzed',
        investigationId,
        hint: 'Run analysis on the investigation before generating a report',
        totalEvidence: evidence.length,
        analyzedEvidence: 0
      });
    }

    // Build analysis summary from evidence
    const analysis = _buildAnalysisSummary(evidence);

    // Generate PDF
    let pdfBuffer;
    try {
      pdfBuffer = reportGenerator.generateReport(investigation, evidence, analysis);
    } catch (error) {
      console.error('PDF generation error:', error);
      return res.status(500).json({
        error: 'Failed to generate PDF',
        details: error.message
      });
    }

    // Create filename
    const invIdShort = investigationId.substring(0, 8);
    const dateStr = new Date().toISOString().split('T')[0];
    const pdfFileName = `Forensic_Report_${invIdShort}_${dateStr}.pdf`;

    // Save report metadata
    const reportId = 'report_' + Math.random().toString(36).substr(2, 9);
    const report = new Report({
      reportId,
      investigationId: invId,
      generatedAt: new Date(),
      analysisVersion: analysis.analysisVersion,
      applicationVersion: '1.0',
      reportMetadata: {
        title: `Forensic Report: ${investigation.name}`,
        investigationName: investigation.name,
        target: investigation.target,
        investigator: investigation.investigator,
        totalEvidence: evidence.length,
        analyzedEvidence: analyzedCount,
        generatedTimestamp: new Date()
      },
      pdfFileName
    });

    await report.save();

    res.status(201).json({
      success: true,
      message: 'Report generated successfully',
      reportId: report.reportId,
      investigationId: investigation.investigationId,
      pdfFileName,
      generatedAt: report.generatedAt,
      totalEvidence: evidence.length,
      analyzedEvidence: analyzedCount,
      reportMetadata: report.reportMetadata
    });

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      error: 'Failed to generate report',
      details: error.message
    });
  }
};

/**
 * GET /api/reports/:investigationId
 * Get latest report for investigation
 */
exports.getReport = async (req, res) => {
  try {
    const { investigationId } = req.params;

    // Find investigation
    let investigation = await Investigation.findById(investigationId);
    if (!investigation) {
      investigation = await Investigation.findOne({ investigationId });
    }

    if (!investigation) {
      return res.status(404).json({
        error: 'Investigation not found',
        investigationId
      });
    }

    const invId = investigation.investigationId || investigation._id.toString();

    // Get evidence and analysis
    const evidence = await Evidence.find({
      investigationId: invId,
      analysisStatus: { $ne: 'Archived' }
    });

    const analysis = _buildAnalysisSummary(evidence);

    // Get latest report
    const report = await Report.findOne({ investigationId: invId }).sort({ generatedAt: -1 });

    res.json({
      investigationId: investigation.investigationId,
      investigation: {
        name: investigation.name,
        target: investigation.target,
        investigator: investigation.investigator,
        startDate: investigation.startDate,
        endDate: investigation.endDate
      },
      evidence: {
        total: evidence.length,
        analyzed: evidence.filter(e => e.sentimentLabel).length,
        pending: evidence.filter(e => !e.sentimentLabel).length
      },
      analysis: analysis.summary,
      latestReport: report ? {
        reportId: report.reportId,
        generatedAt: report.generatedAt,
        pdfFileName: report.pdfFileName,
        metadata: report.reportMetadata
      } : null
    });

  } catch (error) {
    console.error('Error retrieving report:', error);
    res.status(500).json({
      error: 'Failed to retrieve report',
      details: error.message
    });
  }
};

/**
 * GET /api/reports/:investigationId/:reportId
 * Download specific report as PDF
 */
exports.downloadReport = async (req, res) => {
  try {
    const { investigationId, reportId } = req.params;

    // Find report
    const report = await Report.findOne({ reportId, investigationId });

    if (!report) {
      return res.status(404).json({
        error: 'Report not found',
        reportId
      });
    }

    // Find investigation and evidence
    let investigation = await Investigation.findById(investigationId);
    if (!investigation) {
      investigation = await Investigation.findOne({ investigationId });
    }

    if (!investigation) {
      return res.status(404).json({
        error: 'Investigation not found',
        investigationId
      });
    }

    const invId = investigation.investigationId || investigation._id.toString();
    const evidence = await Evidence.find({
      investigationId: invId,
      analysisStatus: { $ne: 'Archived' }
    });

    if (evidence.length === 0) {
      return res.status(400).json({
        error: 'No evidence available for report'
      });
    }

    // Build analysis and generate PDF
    const analysis = _buildAnalysisSummary(evidence);
    const pdfBuffer = reportGenerator.generateReport(investigation, evidence, analysis);

    // Send PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.pdfFileName}"`);
    res.send(Buffer.from(pdfBuffer));

  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({
      error: 'Failed to download report',
      details: error.message
    });
  }
};

// ==================== HELPER METHODS ====================

/**
 * Build analysis summary from evidence items
 */
function _buildAnalysisSummary(evidence) {
  const sentiment = {
    positive: evidence.filter(e => e.sentimentLabel === 'Positive').length,
    neutral: evidence.filter(e => e.sentimentLabel === 'Neutral').length,
    negative: evidence.filter(e => e.sentimentLabel === 'Negative').length
  };

  // Extract top keywords
  const keywordMap = {};
  evidence.forEach(e => {
    if (e.extractedKeywords && Array.isArray(e.extractedKeywords)) {
      e.extractedKeywords.slice(0, 5).forEach(kw => {
        const key = kw.keyword || kw;
        keywordMap[key] = (keywordMap[key] || 0) + (kw.frequency || 1);
      });
    }
  });

  const topKeywords = Object.entries(keywordMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([kw]) => kw);

  // Extract top topics
  const topicMap = {};
  evidence.forEach(e => {
    if (e.topics && Array.isArray(e.topics)) {
      e.topics.forEach(t => {
        topicMap[t.name] = (topicMap[t.name] || 0) + 1;
      });
    }
  });

  const topTopics = Object.entries(topicMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);

  // Get timeline data
  const timelineMap = {};
  evidence.forEach(e => {
    const dateStr = e.publicationDate ? new Date(e.publicationDate).toISOString().split('T')[0] : new Date(e.createdAt).toISOString().split('T')[0];
    if (!timelineMap[dateStr]) {
      timelineMap[dateStr] = { positive: 0, neutral: 0, negative: 0, count: 0 };
    }
    timelineMap[dateStr].count++;
    if (e.sentimentLabel === 'Positive') timelineMap[dateStr].positive++;
    else if (e.sentimentLabel === 'Neutral') timelineMap[dateStr].neutral++;
    else if (e.sentimentLabel === 'Negative') timelineMap[dateStr].negative++;
  });

  const timelineData = Object.entries(timelineMap).map(([date, data]) => ({
    date,
    count: data.count,
    sentiment: {
      positive: { count: data.positive, percentage: ((data.positive / data.count) * 100).toFixed(1) },
      neutral: { count: data.neutral, percentage: ((data.neutral / data.count) * 100).toFixed(1) },
      negative: { count: data.negative, percentage: ((data.negative / data.count) * 100).toFixed(1) }
    }
  })).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Get findings from evidence
  const findings = [];
  if (sentiment.negative > sentiment.positive) {
    findings.push({
      title: 'Negative Sentiment Dominance',
      severity: 'MEDIUM',
      description: `Analysis shows ${sentiment.negative} negative items compared to ${sentiment.positive} positive items.`,
      evidence: sentiment.negative,
      percentage: ((sentiment.negative / evidence.length) * 100).toFixed(1)
    });
  }

  if (topKeywords.length > 0) {
    findings.push({
      title: 'Key Terms Identified',
      severity: 'LOW',
      description: `Analysis identified recurring keywords: ${topKeywords.slice(0, 3).join(', ')}`,
      evidence: evidence.length,
      percentage: 100
    });
  }

  if (topTopics.length > 0) {
    findings.push({
      title: 'Primary Topics',
      severity: 'LOW',
      description: `Content primarily classified as: ${topTopics.slice(0, 2).join(', ')}`,
      evidence: evidence.length,
      percentage: 100
    });
  }

  return {
    summary: {
      sentiment,
      topKeywords,
      topTopics,
      totalEvidence: evidence.length,
      analyzedEvidence: evidence.filter(e => e.sentimentLabel).length
    },
    timeline: {
      data: timelineData,
      trends: [],
      peakPeriods: []
    },
    findings,
    analysisVersion: '1.0'
  };
}

// Export helper as public method
exports._buildAnalysisSummary = _buildAnalysisSummary;
