/**
 * Investigation Summary Service
 * 
 * Generates high-level statistics for an investigation.
 */

/**
 * Calculate investigation summary statistics
 * 
 * @param {Object} investigation - Investigation object
 * @param {Object[]} evidenceArray - Array of evidence
 * @param {Object} analysisResults - Analysis results
 * @returns {Object} - Summary statistics
 */
const generateSummary = (investigation, evidenceArray, analysisResults = {}) => {
  if (!investigation || !Array.isArray(evidenceArray)) {
    return {
      investigationId: null,
      investigationName: 'Unknown',
      target: 'Unknown',
      totalEvidence: 0,
      activeEvidence: 0,
      archivedEvidence: 0,
      sourceDistribution: {},
      sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
      topKeywords: [],
      topicDistribution: {},
      averageRelevanceScore: 0,
    };
  }

  // Basic counts
  const totalEvidence = evidenceArray.length;
  const activeEvidence = evidenceArray.filter(e => e.analysisStatus !== 'Archived').length;
  const archivedEvidence = totalEvidence - activeEvidence;

  // Source distribution
  const sourceDistribution = {
    'News': 0,
    'Blog': 0,
    'Forum': 0,
    'Public Social Media': 0,
    'Other Public Web Source': 0,
  };

  evidenceArray.forEach(evidence => {
    if (evidence.sourceType && sourceDistribution.hasOwnProperty(evidence.sourceType)) {
      sourceDistribution[evidence.sourceType]++;
    }
  });

  // Sentiment distribution
  const sentimentDistribution = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };

  const sentimentData = {
    positive: [],
    neutral: [],
    negative: [],
  };

  evidenceArray.forEach(evidence => {
    if (evidence.sentimentLabel) {
      const label = evidence.sentimentLabel.toLowerCase();
      sentimentDistribution[label]++;
      sentimentData[label].push(evidence.sentimentScore || 0);
    }
  });

  // Calculate percentages for sentiment
  const sentimentPercentages = {
    positivePercent: totalEvidence > 0 ? parseFloat(((sentimentDistribution.positive / totalEvidence) * 100).toFixed(1)) : 0,
    neutralPercent: totalEvidence > 0 ? parseFloat(((sentimentDistribution.neutral / totalEvidence) * 100).toFixed(1)) : 0,
    negativePercent: totalEvidence > 0 ? parseFloat(((sentimentDistribution.negative / totalEvidence) * 100).toFixed(1)) : 0,
  };

  // Average sentiment score
  const allScores = [
    ...sentimentData.positive,
    ...sentimentData.neutral,
    ...sentimentData.negative,
  ];
  const averageSentimentScore = allScores.length > 0
    ? parseFloat((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(3))
    : 0;

  // Top keywords
  const topKeywords = evidenceArray
    .flatMap(e => e.extractedKeywords || [])
    .reduce((acc, item) => {
      const existing = acc.find(k => k.keyword === item.keyword);
      if (existing) {
        existing.frequency += item.frequency;
      } else {
        acc.push({ ...item });
      }
      return acc;
    }, [])
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);

  // Topic distribution
  const topicDistribution = {};
  evidenceArray.forEach(evidence => {
    if (Array.isArray(evidence.topics) && evidence.topics.length > 0) {
      const primaryTopic = evidence.topics.find(t => t.isPrimary);
      if (primaryTopic) {
        topicDistribution[primaryTopic.name] = (topicDistribution[primaryTopic.name] || 0) + 1;
      }
    }
  });

  // Convert counts to percentages
  const topicPercentages = {};
  Object.entries(topicDistribution).forEach(([topic, count]) => {
    topicPercentages[topic] = parseFloat(((count / activeEvidence) * 100).toFixed(1));
  });

  // Average relevance score
  const relevanceScores = evidenceArray
    .filter(e => e.relevanceScore !== null && e.relevanceScore !== undefined)
    .map(e => e.relevanceScore);
  const averageRelevanceScore = relevanceScores.length > 0
    ? parseFloat((relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length).toFixed(1))
    : 0;

  // Analyzed vs unanalyzed
  const analyzedEvidence = evidenceArray.filter(e => e.analysisStatus === 'Analyzed').length;
  const unanalyzedEvidence = activeEvidence - analyzedEvidence;

  return {
    investigationId: investigation.investigationId,
    investigationName: investigation.name,
    investigationTarget: investigation.target,
    investigator: investigation.investigator,
    createdAt: investigation.createdAt,
    
    // Evidence counts
    totalEvidence,
    activeEvidence,
    archivedEvidence,
    analyzedEvidence,
    unanalyzedEvidence,
    
    // Analysis status
    analysisProgress: activeEvidence > 0 
      ? parseFloat(((analyzedEvidence / activeEvidence) * 100).toFixed(1))
      : 0,
    
    // Distribution
    sourceDistribution,
    sentimentDistribution,
    sentimentPercentages,
    topicDistribution,
    topicPercentages: topicPercentages,
    
    // Statistics
    topKeywords,
    averageSentimentScore,
    averageRelevanceScore,
    
    // Metadata
    lastAnalysisTime: analysisResults.analyzedAt || null,
    analysisVersion: analysisResults.version || '1.0',
  };
};

/**
 * Get summary statistics in dashboard-friendly format
 * 
 * @param {Object} summary - Summary object from generateSummary
 * @returns {Object} - Formatted for dashboard display
 */
const formatForDashboard = (summary) => {
  if (!summary) {
    return {
      cards: [],
      charts: {},
    };
  }

  // Key statistics cards
  const cards = [
    {
      label: 'Total Evidence',
      value: summary.totalEvidence,
      icon: '📄',
    },
    {
      label: 'Analyzed',
      value: `${summary.analyzedEvidence}/${summary.activeEvidence}`,
      percentage: summary.analysisProgress,
      icon: '✓',
    },
    {
      label: 'Positive',
      value: summary.sentimentDistribution.positive,
      percentage: summary.sentimentPercentages.positivePercent,
      icon: '👍',
    },
    {
      label: 'Neutral',
      value: summary.sentimentDistribution.neutral,
      percentage: summary.sentimentPercentages.neutralPercent,
      icon: '➖',
    },
    {
      label: 'Negative',
      value: summary.sentimentDistribution.negative,
      percentage: summary.sentimentPercentages.negativePercent,
      icon: '👎',
    },
    {
      label: 'Avg Relevance',
      value: summary.averageRelevanceScore,
      max: 100,
      icon: '📍',
    },
  ];

  // Charts data
  const charts = {
    sentiment: {
      labels: ['Positive', 'Neutral', 'Negative'],
      data: [
        summary.sentimentDistribution.positive,
        summary.sentimentDistribution.neutral,
        summary.sentimentDistribution.negative,
      ],
    },
    topics: {
      labels: Object.keys(summary.topicDistribution),
      data: Object.values(summary.topicDistribution),
    },
    sources: {
      labels: Object.keys(summary.sourceDistribution),
      data: Object.values(summary.sourceDistribution),
    },
  };

  return {
    cards,
    charts,
    summary,
  };
};

module.exports = {
  generateSummary,
  formatForDashboard,
};
