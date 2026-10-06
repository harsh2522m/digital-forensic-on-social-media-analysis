/**
 * Timeline Analysis Service
 * 
 * Analyzes evidence over time.
 * 
 * Generates:
 * - Evidence count by date
 * - Sentiment distribution by date/period
 * - Source type distribution by date
 * - Trends over time
 */

/**
 * Group evidence by date
 * 
 * @param {Object[]} evidenceArray - Array of evidence
 * @returns {Object} - Evidence grouped by date
 */
const groupByDate = (evidenceArray) => {
  if (!Array.isArray(evidenceArray) || evidenceArray.length === 0) {
    return {};
  }

  const grouped = {};

  evidenceArray.forEach(evidence => {
    const date = evidence.publicationDate 
      ? new Date(evidence.publicationDate).toISOString().split('T')[0]
      : 'Unknown';

    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(evidence);
  });

  return grouped;
};

/**
 * Calculate sentiment by date
 * 
 * @param {Object} groupedByDate - Evidence grouped by date
 * @returns {Object[]} - Array of {date, totalCount, positive, neutral, negative}
 */
const calculateSentimentByDate = (groupedByDate) => {
  if (!groupedByDate || Object.keys(groupedByDate).length === 0) {
    return [];
  }

  const timeline = [];

  Object.entries(groupedByDate).forEach(([date, evidenceList]) => {
    const sentiment = {
      positive: 0,
      neutral: 0,
      negative: 0,
    };

    evidenceList.forEach(evidence => {
      if (evidence.sentimentLabel) {
        sentiment[evidence.sentimentLabel.toLowerCase()]++;
      }
    });

    const total = evidenceList.length;

    timeline.push({
      date,
      totalCount: total,
      positive: sentiment.positive,
      neutral: sentiment.neutral,
      negative: sentiment.negative,
      positivePercent: parseFloat(((sentiment.positive / total) * 100).toFixed(1)),
      neutralPercent: parseFloat(((sentiment.neutral / total) * 100).toFixed(1)),
      negativePercent: parseFloat(((sentiment.negative / total) * 100).toFixed(1)),
    });
  });

  // Sort by date
  timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

  return timeline;
};

/**
 * Calculate source type distribution by date
 * 
 * @param {Object} groupedByDate - Evidence grouped by date
 * @returns {Object[]} - Array of timeline entries with source distribution
 */
const calculateSourcesByDate = (groupedByDate) => {
  if (!groupedByDate || Object.keys(groupedByDate).length === 0) {
    return [];
  }

  const timeline = [];

  Object.entries(groupedByDate).forEach(([date, evidenceList]) => {
    const sources = {
      'News': 0,
      'Blog': 0,
      'Forum': 0,
      'Public Social Media': 0,
      'Other Public Web Source': 0,
    };

    evidenceList.forEach(evidence => {
      if (evidence.sourceType && sources.hasOwnProperty(evidence.sourceType)) {
        sources[evidence.sourceType]++;
      }
    });

    timeline.push({
      date,
      totalCount: evidenceList.length,
      sourceDistribution: sources,
    });
  });

  // Sort by date
  timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

  return timeline;
};

/**
 * Detect trends in sentiment over time
 * 
 * @param {Object[]} sentimentTimeline - Sentiment timeline
 * @returns {Object} - Trend analysis
 */
const analyzeSentimentTrend = (sentimentTimeline) => {
  if (!Array.isArray(sentimentTimeline) || sentimentTimeline.length < 2) {
    return {
      trend: 'insufficient_data',
      description: 'Not enough data for trend analysis',
      changePercent: 0,
    };
  }

  const first = sentimentTimeline[0];
  const last = sentimentTimeline[sentimentTimeline.length - 1];

  const firstNegative = first.negativePercent;
  const lastNegative = last.negativePercent;
  const change = lastNegative - firstNegative;

  let trend = 'stable';
  if (change > 10) {
    trend = 'increasing_negative';
  } else if (change < -10) {
    trend = 'decreasing_negative';
  }

  return {
    trend,
    description: `Negative sentiment: ${firstNegative}% → ${lastNegative}%`,
    changePercent: parseFloat(change.toFixed(1)),
    firstDate: first.date,
    lastDate: last.date,
  };
};

/**
 * Find peak periods (dates with most evidence)
 * 
 * @param {Object} groupedByDate - Evidence grouped by date
 * @param {number} limit - Number of peaks to return
 * @returns {Object[]} - Peak dates
 */
const findPeakPeriods = (groupedByDate, limit = 5) => {
  if (!groupedByDate || Object.keys(groupedByDate).length === 0) {
    return [];
  }

  return Object.entries(groupedByDate)
    .map(([date, evidenceList]) => ({
      date,
      count: evidenceList.length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

/**
 * Generate timeline data suitable for chart visualization
 * 
 * @param {Object[]} evidenceArray - Array of evidence
 * @returns {Object} - Timeline data for visualization
 */
const generateTimelineData = (evidenceArray) => {
  if (!Array.isArray(evidenceArray) || evidenceArray.length === 0) {
    return {
      dates: [],
      sentimentTimeline: [],
      sourceTimeline: [],
      peakPeriods: [],
      trend: null,
    };
  }

  const groupedByDate = groupByDate(evidenceArray);
  const sentimentTimeline = calculateSentimentByDate(groupedByDate);
  const sourceTimeline = calculateSourcesByDate(groupedByDate);
  const peakPeriods = findPeakPeriods(groupedByDate);
  const trend = analyzeSentimentTrend(sentimentTimeline);

  // Extract dates for chart labels
  const dates = sentimentTimeline.map(t => t.date);

  return {
    dates,
    sentimentTimeline,
    sourceTimeline,
    peakPeriods,
    trend,
  };
};

/**
 * Calculate date range statistics
 * 
 * @param {Object[]} evidenceArray - Array of evidence
 * @returns {Object} - Date range info
 */
const getDateRangeStats = (evidenceArray) => {
  if (!Array.isArray(evidenceArray) || evidenceArray.length === 0) {
    return {
      earliest: null,
      latest: null,
      spanDays: 0,
      itemsWithDates: 0,
      itemsWithoutDates: 0,
    };
  }

  const datesWithValues = evidenceArray
    .filter(e => e.publicationDate)
    .map(e => new Date(e.publicationDate).getTime());

  if (datesWithValues.length === 0) {
    return {
      earliest: null,
      latest: null,
      spanDays: 0,
      itemsWithDates: 0,
      itemsWithoutDates: evidenceArray.length,
    };
  }

  const earliest = new Date(Math.min(...datesWithValues)).toISOString().split('T')[0];
  const latest = new Date(Math.max(...datesWithValues)).toISOString().split('T')[0];
  const spanDays = Math.floor((Math.max(...datesWithValues) - Math.min(...datesWithValues)) / (1000 * 60 * 60 * 24));

  return {
    earliest,
    latest,
    spanDays,
    itemsWithDates: datesWithValues.length,
    itemsWithoutDates: evidenceArray.length - datesWithValues.length,
  };
};

module.exports = {
  groupByDate,
  calculateSentimentByDate,
  calculateSourcesByDate,
  analyzeSentimentTrend,
  findPeakPeriods,
  generateTimelineData,
  getDateRangeStats,
};
