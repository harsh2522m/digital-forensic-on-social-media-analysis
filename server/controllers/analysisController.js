const Investigation = require('../models/Investigation');
const Evidence = require('../models/Evidence');

// Import analysis services
const textPreprocessor = require('../services/textPreprocessor');
const sentimentAnalyzer = require('../services/sentimentAnalyzer');
const keywordExtractor = require('../services/keywordExtractor');
const topicClassifier = require('../services/topicClassifier');
const relevanceCalculator = require('../services/relevanceCalculator');
const timelineAnalyzer = require('../services/timelineAnalyzer');
const investigationSummary = require('../services/investigationSummary');
const findingsGenerator = require('../services/findingsGenerator');

/**
 * Run analysis on an investigation
 * POST /api/analysis/:investigationId
 */
exports.analyzeInvestigation = async (req, res) => {
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
        investigationId,
      });
    }

    // Get active evidence for this investigation
    const invId = investigation.investigationId || investigation._id.toString();
    const evidenceArray = await Evidence.find({
      investigationId: invId,
      analysisStatus: { $ne: 'Archived' },
    });

    if (evidenceArray.length === 0) {
      return res.status(400).json({
        error: 'No evidence available for analysis',
        investigationId,
      });
    }

    // Analyze each evidence item
    const analysisResults = [];
    let successCount = 0;
    let errorCount = 0;

    for (const evidence of evidenceArray) {
      try {
        // Text preprocessing
        const preprocessed = textPreprocessor.preprocessText(evidence.content);

        // Sentiment analysis
        const sentiment = sentimentAnalyzer.analyzeSentiment(evidence.content);

        // Keyword extraction
        const keywords = keywordExtractor.extractKeywords(evidence.content, {
          limit: 15,
          investigationKeywords: investigation.keywords || [],
          investigationTarget: investigation.target || '',
        });

        // Topic classification
        const topics = topicClassifier.classifyTopic(evidence.content, {
          investigationKeywords: investigation.keywords || [],
        });

        // Relevance calculation
        const relevance = relevanceCalculator.calculateRelevance(evidence, investigation);

        // Update evidence with analysis results
        evidence.sentimentLabel = sentiment.label;
        evidence.sentimentScore = sentiment.score;
        evidence.extractedKeywords = keywords;
        evidence.topics = topics;
        evidence.relevanceScore = relevance.score;
        evidence.relevanceLevel = relevance.level;
        evidence.analysisStatus = 'Analyzed';
        evidence.analyzedAt = new Date();
        evidence.analysisVersion = '1.0';

        await evidence.save();
        successCount++;

        analysisResults.push({
          evidenceId: evidence.evidenceId,
          status: 'success',
          sentiment,
          keywords,
          topics,
          relevance,
        });
      } catch (error) {
        errorCount++;
        console.error(`Error analyzing evidence ${evidence.evidenceId}:`, error);
        analysisResults.push({
          evidenceId: evidence.evidenceId,
          status: 'error',
          error: error.message,
        });
      }
    }

    // Generate investigation-level summary
    const updatedEvidence = await Evidence.find({
      investigationId: invId,
      analysisStatus: { $ne: 'Archived' },
    });

    const summary = investigationSummary.generateSummary(investigation, updatedEvidence, {
      analyzedAt: new Date(),
      version: '1.0',
    });

    // Generate findings
    const timelineData = timelineAnalyzer.generateTimelineData(updatedEvidence);
    const findings = findingsGenerator.generateFindings(investigation, updatedEvidence, summary, timelineData);

    res.status(200).json({
      message: 'Analysis completed',
      investigationId: investigation.investigationId,
      analyzed: successCount,
      failed: errorCount,
      total: evidenceArray.length,
      summary,
      findings: findingsGenerator.formatFindings(findings),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in analyzeInvestigation:', error);
    res.status(500).json({
      error: 'Failed to analyze investigation',
      details: error.message,
    });
  }
};

/**
 * Get analysis results for an investigation
 * GET /api/analysis/:investigationId
 */
exports.getAnalysis = async (req, res) => {
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
        investigationId,
      });
    }

    // Get analyzed evidence
    const invId = investigation.investigationId || investigation._id.toString();
    const evidenceArray = await Evidence.find({
      investigationId: invId,
      analysisStatus: 'Analyzed',
    });

    if (evidenceArray.length === 0) {
      return res.status(200).json({
        investigationId: investigation.investigationId,
        message: 'No analysis results available',
        analyzed: 0,
        hasAnalysis: false,
      });
    }

    // Generate summary and findings
    const summary = investigationSummary.generateSummary(investigation, evidenceArray);
    const timelineData = timelineAnalyzer.generateTimelineData(evidenceArray);
    const findings = findingsGenerator.generateFindings(investigation, evidenceArray, summary, timelineData);

    // Get all evidence with analysis details
    const allEvidence = await Evidence.find({
      investigationId: invId,
    });

    res.status(200).json({
      investigationId: investigation.investigationId,
      summary,
      findings: findingsGenerator.formatFindings(findings),
      timeline: timelineData,
      evidence: allEvidence.map(e => ({
        evidenceId: e.evidenceId,
        sourceName: e.sourceName,
        sourceType: e.sourceType,
        sentimentLabel: e.sentimentLabel,
        sentimentScore: e.sentimentScore,
        topKeywords: e.extractedKeywords ? e.extractedKeywords.slice(0, 5) : [],
        primaryTopic: e.topics ? e.topics.find(t => t.isPrimary) : null,
        relevanceScore: e.relevanceScore,
        relevanceLevel: e.relevanceLevel,
        analyzedAt: e.analyzedAt,
      })),
      hasAnalysis: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in getAnalysis:', error);
    res.status(500).json({
      error: 'Failed to retrieve analysis',
      details: error.message,
    });
  }
};

/**
 * Get generated findings for an investigation
 * GET /api/analysis/:investigationId/findings
 */
exports.getFindings = async (req, res) => {
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
        investigationId,
      });
    }

    // Get analyzed evidence
    const invId = investigation.investigationId || investigation._id.toString();
    const evidenceArray = await Evidence.find({
      investigationId: invId,
    });

    if (evidenceArray.length === 0) {
      return res.status(200).json({
        investigationId: investigation.investigationId,
        findings: [],
        message: 'No evidence available',
      });
    }

    // Generate summary and findings
    const summary = investigationSummary.generateSummary(investigation, evidenceArray);
    const timelineData = timelineAnalyzer.generateTimelineData(evidenceArray);
    const findings = findingsGenerator.generateFindings(investigation, evidenceArray, summary, timelineData);
    const sortedFindings = findingsGenerator.sortByPriority(findings);
    const formattedFindings = findingsGenerator.formatFindings(sortedFindings);

    res.status(200).json({
      investigationId: investigation.investigationId,
      target: investigation.target,
      findingsCount: formattedFindings.length,
      findings: formattedFindings,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in getFindings:', error);
    res.status(500).json({
      error: 'Failed to retrieve findings',
      details: error.message,
    });
  }
};

/**
 * Get timeline data for an investigation
 * GET /api/analysis/:investigationId/timeline
 */
exports.getTimeline = async (req, res) => {
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
        investigationId,
      });
    }

    // Get evidence
    const invId = investigation.investigationId || investigation._id.toString();
    const evidenceArray = await Evidence.find({
      investigationId: invId,
    }).sort({ publicationDate: 1 });

    if (evidenceArray.length === 0) {
      return res.status(200).json({
        investigationId: investigation.investigationId,
        message: 'No evidence available',
        timeline: {},
      });
    }

    // Generate timeline data
    const timelineData = timelineAnalyzer.generateTimelineData(evidenceArray);
    const dateRangeStats = timelineAnalyzer.getDateRangeStats(evidenceArray);

    res.status(200).json({
      investigationId: investigation.investigationId,
      dates: timelineData.dates,
      sentimentTimeline: timelineData.sentimentTimeline,
      sourceTimeline: timelineData.sourceTimeline,
      peakPeriods: timelineData.peakPeriods,
      trend: timelineData.trend,
      dateRange: dateRangeStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in getTimeline:', error);
    res.status(500).json({
      error: 'Failed to retrieve timeline',
      details: error.message,
    });
  }
};

/**
 * Analyze a single evidence item
 * POST /api/evidence/:id/analyze
 */
exports.analyzeSingleEvidence = async (req, res) => {
  try {
    const { id } = req.params;

    // Find evidence
    let evidence = await Evidence.findById(id);
    if (!evidence) {
      evidence = await Evidence.findOne({ evidenceId: id });
    }

    if (!evidence) {
      return res.status(404).json({
        error: 'Evidence not found',
        id,
      });
    }

    // Find investigation for context
    let investigation = await Investigation.findOne({ investigationId: evidence.investigationId });

    // Sentiment analysis
    const sentiment = sentimentAnalyzer.analyzeSentiment(evidence.content);

    // Keyword extraction
    const keywords = keywordExtractor.extractKeywords(evidence.content, {
      limit: 15,
      investigationKeywords: investigation ? investigation.keywords : [],
      investigationTarget: investigation ? investigation.target : '',
    });

    // Topic classification
    const topics = topicClassifier.classifyTopic(evidence.content, {
      investigationKeywords: investigation ? investigation.keywords : [],
    });

    // Relevance calculation
    const relevance = investigation
      ? relevanceCalculator.calculateRelevance(evidence, investigation)
      : { score: 0, level: 'Low' };

    // Update evidence
    evidence.sentimentLabel = sentiment.label;
    evidence.sentimentScore = sentiment.score;
    evidence.extractedKeywords = keywords;
    evidence.topics = topics;
    evidence.relevanceScore = relevance.score;
    evidence.relevanceLevel = relevance.level;
    evidence.analysisStatus = 'Analyzed';
    evidence.analyzedAt = new Date();
    evidence.analysisVersion = '1.0';

    await evidence.save();

    res.status(200).json({
      message: 'Evidence analyzed successfully',
      evidenceId: evidence.evidenceId,
      analysis: {
        sentiment,
        keywords,
        topics,
        relevance,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in analyzeSingleEvidence:', error);
    res.status(500).json({
      error: 'Failed to analyze evidence',
      details: error.message,
    });
  }
};
