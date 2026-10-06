/**
 * Findings Generator Service
 * 
 * Generates analytical findings based solely on observed data.
 * 
 * Important principles:
 * - Never invent results
 * - Only state observable facts
 * - Do not claim causation from correlation
 * - Use evidence IDs to support findings
 * - Distinguish observation from assumption
 */

/**
 * Generate findings from investigation analysis
 * 
 * @param {Object} investigation - Investigation object
 * @param {Object[]} evidenceArray - Array of evidence
 * @param {Object} summary - Investigation summary
 * @param {Object} timelineData - Timeline data
 * @returns {Object[]} - Array of finding objects
 */
const generateFindings = (investigation, evidenceArray, summary, timelineData) => {
  const findings = [];

  if (!investigation || !evidenceArray) {
    return findings;
  }

  // Finding 1: Basic evidence count
  if (summary && summary.totalEvidence > 0) {
    findings.push({
      type: 'evidence_count',
      priority: 'high',
      title: 'Evidence Record Count',
      description: `${summary.totalEvidence} evidence record${summary.totalEvidence > 1 ? 's' : ''} ${summary.analyzedEvidence > 0 ? 'analyzed' : 'collected'} for this investigation.`,
      value: summary.totalEvidence,
      evidenceIds: evidenceArray.slice(0, 3).map(e => e.evidenceId),
    });
  }

  // Finding 2: Analysis progress
  if (summary && summary.activeEvidence > 0 && summary.unanalyzedEvidence > 0) {
    findings.push({
      type: 'analysis_status',
      priority: 'medium',
      title: 'Analysis Status',
      description: `${summary.analyzedEvidence} of ${summary.activeEvidence} evidence records have been analyzed (${summary.analysisProgress}%).`,
      value: summary.analysisProgress,
    });
  }

  // Finding 3: Sentiment distribution
  if (summary && summary.totalEvidence > 0) {
    const maxSentiment = Math.max(
      summary.sentimentDistribution.positive,
      summary.sentimentDistribution.neutral,
      summary.sentimentDistribution.negative
    );

    let dominantSentiment = 'Neutral';
    if (maxSentiment === summary.sentimentDistribution.positive) {
      dominantSentiment = 'Positive';
    } else if (maxSentiment === summary.sentimentDistribution.negative) {
      dominantSentiment = 'Negative';
    }

    findings.push({
      type: 'sentiment_distribution',
      priority: 'high',
      title: 'Sentiment Classification',
      description: `Of the analyzed evidence: ${summary.sentimentPercentages.positivePercent}% classified as Positive, ${summary.sentimentPercentages.neutralPercent}% as Neutral, and ${summary.sentimentPercentages.negativePercent}% as Negative.`,
      breakdown: {
        positive: `${summary.sentimentDistribution.positive} (${summary.sentimentPercentages.positivePercent}%)`,
        neutral: `${summary.sentimentDistribution.neutral} (${summary.sentimentPercentages.neutralPercent}%)`,
        negative: `${summary.sentimentDistribution.negative} (${summary.sentimentPercentages.negativePercent}%)`,
      },
      caveats: 'Sentiment classification is based on tone analysis of evidence content and does not measure public opinion.',
    });
  }

  // Finding 4: Top keywords
  if (summary && summary.topKeywords && summary.topKeywords.length > 0) {
    const topKeyword = summary.topKeywords[0];
    findings.push({
      type: 'keyword_prominence',
      priority: 'high',
      title: 'Most Frequent Keywords',
      description: `The keyword "${topKeyword.keyword}" appeared ${topKeyword.frequency} times across evidence content, making it the most frequently occurring term.`,
      topKeywords: summary.topKeywords.slice(0, 5),
    });
  }

  // Finding 5: Topic distribution
  if (summary && Object.keys(summary.topicDistribution).length > 0) {
    const topTopic = Object.entries(summary.topicDistribution)
      .sort(([, a], [, b]) => b - a)[0];

    if (topTopic) {
      const topicPercentage = summary.topicPercentages[topTopic[0]];
      findings.push({
        type: 'topic_distribution',
        priority: 'high',
        title: 'Primary Topic',
        description: `"${topTopic[0]}" was the most frequently detected topic, appearing in ${topTopic[1]} evidence records (${topicPercentage}% of analyzed evidence).`,
        topicBreakdown: summary.topicPercentages,
        caveats: 'Topics are classified using rule-based keyword matching and may not capture complex multi-topic content.',
      });
    }
  }

  // Finding 6: Source type distribution
  if (summary && Object.keys(summary.sourceDistribution).length > 0) {
    const topSource = Object.entries(summary.sourceDistribution)
      .sort(([, a], [, b]) => b - a)[0];

    if (topSource && topSource[1] > 0) {
      findings.push({
        type: 'source_distribution',
        priority: 'medium',
        title: 'Evidence Source Distribution',
        description: `Evidence was collected from multiple sources. "${topSource[0]}" was the primary source type with ${topSource[1]} records.`,
        sourceBreakdown: summary.sourceDistribution,
      });
    }
  }

  // Finding 7: Timeline observations
  if (timelineData && timelineData.peakPeriods && timelineData.peakPeriods.length > 0) {
    const peakPeriod = timelineData.peakPeriods[0];
    findings.push({
      type: 'timeline_peak',
      priority: 'medium',
      title: 'Peak Evidence Period',
      description: `The highest volume of evidence was recorded on ${peakPeriod.date}, with ${peakPeriod.count} records collected on that date.`,
      value: peakPeriod.count,
      date: peakPeriod.date,
    });
  }

  // Finding 8: Sentiment trend
  if (timelineData && timelineData.trend && timelineData.trend.trend !== 'insufficient_data') {
    const trendDescription = {
      'increasing_negative': 'Negative sentiment classification showed an increasing trend over the analysis period.',
      'decreasing_negative': 'Negative sentiment classification showed a decreasing trend over the analysis period.',
      'stable': 'Sentiment classification remained relatively stable throughout the analysis period.',
    };

    findings.push({
      type: 'sentiment_trend',
      priority: 'medium',
      title: 'Sentiment Trend',
      description: trendDescription[timelineData.trend.trend] || 'Insufficient data for trend analysis.',
      detail: timelineData.trend.description,
      change: timelineData.trend.changePercent,
      caveats: 'Trends describe observed patterns in evidence sentiment classification. Correlation does not imply causation.',
    });
  }

  // Finding 9: Relevance observations
  if (summary && summary.averageRelevanceScore > 0) {
    let relevanceDescription = '';
    if (summary.averageRelevanceScore >= 67) {
      relevanceDescription = 'The collected evidence shows high average relevance to the investigation target and keywords.';
    } else if (summary.averageRelevanceScore >= 34) {
      relevanceDescription = 'The collected evidence shows moderate average relevance to the investigation target and keywords.';
    } else {
      relevanceDescription = 'The collected evidence shows low average relevance to the investigation target and keywords.';
    }

    findings.push({
      type: 'relevance_assessment',
      priority: 'medium',
      title: 'Evidence Relevance',
      description: relevanceDescription,
      value: summary.averageRelevanceScore,
      max: 100,
    });
  }

  // Finding 10: Archived evidence
  if (summary && summary.archivedEvidence > 0) {
    findings.push({
      type: 'archived_evidence',
      priority: 'low',
      title: 'Archived Evidence',
      description: `${summary.archivedEvidence} evidence record${summary.archivedEvidence > 1 ? 's' : ''} ${summary.archivedEvidence > 1 ? 'are' : 'is'} marked as archived and excluded from active analysis.`,
      value: summary.archivedEvidence,
    });
  }

  return findings;
};

/**
 * Format findings for display
 * 
 * @param {Object[]} findings - Raw findings array
 * @returns {Object[]} - Formatted findings with metadata
 */
const formatFindings = (findings) => {
  if (!Array.isArray(findings)) {
    return [];
  }

  return findings.map(finding => ({
    ...finding,
    icon: getFindingIcon(finding.type),
    category: getFindingCategory(finding.type),
  }));
};

/**
 * Get icon for finding type
 * 
 * @param {string} type - Finding type
 * @returns {string} - Icon emoji
 */
const getFindingIcon = (type) => {
  const icons = {
    evidence_count: '📊',
    analysis_status: '⏳',
    sentiment_distribution: '😊',
    keyword_prominence: '🔤',
    topic_distribution: '📌',
    source_distribution: '📰',
    timeline_peak: '📈',
    sentiment_trend: '📉',
    relevance_assessment: '🎯',
    archived_evidence: '📦',
  };

  return icons[type] || '📋';
};

/**
 * Get category for finding type
 * 
 * @param {string} type - Finding type
 * @returns {string} - Category name
 */
const getFindingCategory = (type) => {
  const categories = {
    evidence_count: 'Overview',
    analysis_status: 'Overview',
    sentiment_distribution: 'Sentiment',
    keyword_prominence: 'Keywords',
    topic_distribution: 'Topics',
    source_distribution: 'Sources',
    timeline_peak: 'Timeline',
    sentiment_trend: 'Trends',
    relevance_assessment: 'Relevance',
    archived_evidence: 'Metadata',
  };

  return categories[type] || 'General';
};

/**
 * Sort findings by priority
 * 
 * @param {Object[]} findings - Findings array
 * @returns {Object[]} - Sorted findings
 */
const sortByPriority = (findings) => {
  if (!Array.isArray(findings)) {
    return [];
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };

  return [...findings].sort((a, b) => {
    const priorityA = priorityOrder[a.priority] || 999;
    const priorityB = priorityOrder[b.priority] || 999;
    return priorityA - priorityB;
  });
};

module.exports = {
  generateFindings,
  formatFindings,
  getFindingIcon,
  getFindingCategory,
  sortByPriority,
};
