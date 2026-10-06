/**
 * Keyword Extraction Service
 * 
 * Extracts important keywords from evidence content.
 * 
 * Process:
 * 1. Preprocess text (normalize, tokenize)
 * 2. Remove stop words
 * 3. Calculate word frequency
 * 4. Rank by frequency
 * 5. Return top keywords
 */

const textPreprocessor = require('./textPreprocessor');

/**
 * Extract top keywords from a single evidence content
 * 
 * @param {string} content - Evidence content
 * @param {Object} options - Options
 * @param {number} options.limit - Number of keywords to return (default: 15)
 * @param {string[]} options.investigationKeywords - Keywords from investigation to boost
 * @param {string} options.investigationTarget - Investigation target name to boost
 * @returns {Object[]} - Array of {keyword, frequency, boosted}
 */
const extractKeywords = (content, options = {}) => {
  const { limit = 15, investigationKeywords = [], investigationTarget = '' } = options;

  if (!content || typeof content !== 'string') {
    return [];
  }

  // Preprocess
  const preprocessed = textPreprocessor.preprocessText(content);
  const frequencies = preprocessed.frequencies;

  if (frequencies.size === 0) {
    return [];
  }

  // Convert to array and sort by frequency
  let keywords = Array.from(frequencies.entries())
    .map(([keyword, frequency]) => {
      let boosted = false;
      let finalFrequency = frequency;

      // Boost if keyword appears in investigation keywords
      if (investigationKeywords.some(kw => kw.toLowerCase() === keyword)) {
        finalFrequency *= 2;
        boosted = true;
      }

      // Boost if keyword contains or is similar to target
      if (investigationTarget && keyword.includes(investigationTarget.toLowerCase())) {
        finalFrequency *= 1.5;
        boosted = true;
      }

      return {
        keyword,
        frequency,
        finalFrequency,
        boosted,
      };
    })
    .sort((a, b) => b.finalFrequency - a.finalFrequency)
    .slice(0, limit)
    .map(({ keyword, frequency, boosted }) => ({
      keyword,
      frequency,
      boosted,
    }));

  return keywords;
};

/**
 * Extract and aggregate keywords from multiple evidence items
 * 
 * @param {Object[]} evidenceArray - Array of evidence objects
 * @param {Object} options - Options
 * @param {number} options.limit - Number of top keywords (default: 15)
 * @param {string[]} options.investigationKeywords - Investigation keywords
 * @param {string} options.investigationTarget - Investigation target
 * @returns {Object[]} - Array of top keywords with aggregated frequency
 */
const aggregateKeywords = (evidenceArray, options = {}) => {
  const { limit = 15, investigationKeywords = [], investigationTarget = '' } = options;

  if (!Array.isArray(evidenceArray) || evidenceArray.length === 0) {
    return [];
  }

  // Collect all keywords with their frequencies across all evidence
  const keywordMap = new Map();

  evidenceArray.forEach(evidence => {
    if (!evidence.content) return;

    const keywords = extractKeywords(evidence.content, {
      limit: 50, // Get more for aggregation
      investigationKeywords,
      investigationTarget,
    });

    keywords.forEach(({ keyword, frequency }) => {
      const current = keywordMap.get(keyword) || 0;
      keywordMap.set(keyword, current + frequency);
    });
  });

  // Convert to array, sort, and limit
  const aggregated = Array.from(keywordMap.entries())
    .map(([keyword, frequency]) => ({
      keyword,
      frequency,
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit);

  return aggregated;
};

/**
 * Check if a keyword matches investigation criteria
 * 
 * @param {string} keyword - Keyword to check
 * @param {string[]} investigationKeywords - Keywords from investigation
 * @param {string} investigationTarget - Investigation target
 * @returns {boolean} - True if matches
 */
const isRelevantKeyword = (keyword, investigationKeywords = [], investigationTarget = '') => {
  if (!keyword) return false;

  const keywordLower = keyword.toLowerCase();

  // Check against investigation keywords
  if (investigationKeywords.some(kw => kw.toLowerCase() === keywordLower)) {
    return true;
  }

  // Check against target
  if (investigationTarget && keywordLower.includes(investigationTarget.toLowerCase())) {
    return true;
  }

  return false;
};

/**
 * Get keyword statistics for evidence array
 * 
 * @param {Object[]} evidenceArray - Array of evidence
 * @returns {Object} - Statistics
 */
const getKeywordStats = (evidenceArray) => {
  if (!Array.isArray(evidenceArray) || evidenceArray.length === 0) {
    return {
      totalKeywords: 0,
      averageKeywordsPerItem: 0,
      uniqueKeywords: 0,
      topKeyword: null,
      topKeywordFrequency: 0,
    };
  }

  const allKeywords = [];
  let totalKeywordsAcrossEvidence = 0;

  evidenceArray.forEach(evidence => {
    if (!evidence.content) return;

    const keywords = extractKeywords(evidence.content, { limit: 100 });
    allKeywords.push(...keywords);
    totalKeywordsAcrossEvidence += keywords.length;
  });

  const uniqueKeywords = new Set(allKeywords.map(k => k.keyword)).size;
  const topKeyword = allKeywords.length > 0 ? allKeywords[0] : null;

  return {
    totalKeywords: allKeywords.length,
    averageKeywordsPerItem: parseFloat((totalKeywordsAcrossEvidence / evidenceArray.length).toFixed(2)),
    uniqueKeywords,
    topKeyword,
    topKeywordFrequency: topKeyword ? topKeyword.frequency : 0,
  };
};

module.exports = {
  extractKeywords,
  aggregateKeywords,
  isRelevantKeyword,
  getKeywordStats,
};
