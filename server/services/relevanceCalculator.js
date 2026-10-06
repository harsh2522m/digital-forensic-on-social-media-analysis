/**
 * Relevance Score Calculation Service
 * 
 * Calculates relevance of evidence to an investigation.
 * 
 * Scoring factors:
 * 1. Target name occurrence (0-40 points)
 * 2. Investigation keywords occurrence (0-40 points)
 * 3. Source metadata relevance (0-15 points)
 * 4. Content length/depth (0-5 points)
 * 
 * Score range: 0-100
 * Levels: Low (0-33), Medium (34-66), High (67-100)
 */

/**
 * Count occurrences of a word in text (case-insensitive)
 * 
 * @param {string} text - Text to search
 * @param {string} word - Word to find
 * @returns {number} - Occurrence count
 */
const countOccurrences = (text, word) => {
  if (!text || !word) return 0;

  const textLower = text.toLowerCase();
  const wordLower = word.toLowerCase();
  const regex = new RegExp(`\\b${wordLower}\\b`, 'g');
  const matches = textLower.match(regex);

  return matches ? matches.length : 0;
};

/**
 * Calculate target relevance score
 * 
 * @param {string} content - Evidence content
 * @param {string} targetName - Investigation target name
 * @returns {number} - Score 0-40
 */
const calculateTargetRelevance = (content, targetName) => {
  if (!content || !targetName) return 0;

  const occurrences = countOccurrences(content, targetName);
  
  // Scoring: 1 occurrence = 10 points, max 40 points
  const score = Math.min(40, occurrences * 10);
  
  return score;
};

/**
 * Calculate keyword relevance score
 * 
 * @param {string} content - Evidence content
 * @param {string[]} keywords - Investigation keywords
 * @returns {number} - Score 0-40
 */
const calculateKeywordRelevance = (content, keywords = []) => {
  if (!content || !Array.isArray(keywords) || keywords.length === 0) return 0;

  let totalScore = 0;
  const maxScorePerKeyword = 40 / Math.max(keywords.length, 1);

  keywords.forEach(keyword => {
    const occurrences = countOccurrences(content, keyword);
    // Each keyword can contribute up to its max score, with diminishing returns
    const keywordScore = Math.min(
      maxScorePerKeyword,
      occurrences * (maxScorePerKeyword / 5)
    );
    totalScore += keywordScore;
  });

  return Math.min(40, totalScore);
};

/**
 * Calculate source metadata relevance
 * 
 * @param {Object} metadata - Source metadata object
 * @param {string} targetName - Investigation target
 * @returns {number} - Score 0-15
 */
const calculateSourceRelevance = (metadata = {}, targetName = '') => {
  let score = 0;

  // Check source name
  if (metadata.sourceName && targetName && 
      metadata.sourceName.toLowerCase().includes(targetName.toLowerCase())) {
    score += 7;
  }

  // Check author
  if (metadata.author && targetName && 
      metadata.author.toLowerCase().includes(targetName.toLowerCase())) {
    score += 5;
  }

  // Check URL for relevance indicators
  if (metadata.sourceUrl && metadata.sourceUrl.toLowerCase().includes('security')) {
    score += 3;
  }

  return Math.min(15, score);
};

/**
 * Calculate content depth score
 * 
 * @param {string} content - Evidence content
 * @returns {number} - Score 0-5
 */
const calculateContentDepth = (content) => {
  if (!content) return 0;

  const wordCount = content.split(/\s+/).length;
  
  // Scoring: 100+ words = 5 points, 50-99 = 3, 20-49 = 1, <20 = 0
  if (wordCount >= 100) return 5;
  if (wordCount >= 50) return 3;
  if (wordCount >= 20) return 1;
  return 0;
};

/**
 * Calculate overall relevance score for evidence
 * 
 * @param {Object} evidence - Evidence object
 * @param {Object} investigation - Investigation object
 * @returns {Object} - { score: number, level: string, breakdown: Object }
 */
const calculateRelevance = (evidence, investigation) => {
  if (!evidence || !investigation) {
    return {
      score: 0,
      level: 'Low',
      breakdown: {},
    };
  }

  const targetRelevance = calculateTargetRelevance(
    evidence.content,
    investigation.target
  );

  const keywordRelevance = calculateKeywordRelevance(
    evidence.content,
    investigation.keywords || []
  );

  const sourceRelevance = calculateSourceRelevance(
    {
      sourceName: evidence.sourceName,
      author: evidence.author,
      sourceUrl: evidence.sourceUrl,
    },
    investigation.target
  );

  const contentDepth = calculateContentDepth(evidence.content);

  const totalScore = targetRelevance + keywordRelevance + sourceRelevance + contentDepth;

  // Determine level
  let level = 'Low';
  if (totalScore >= 67) {
    level = 'High';
  } else if (totalScore >= 34) {
    level = 'Medium';
  }

  return {
    score: Math.round(totalScore),
    level,
    breakdown: {
      targetRelevance,
      keywordRelevance,
      sourceRelevance,
      contentDepth,
      total: totalScore,
    },
  };
};

/**
 * Calculate relevance for multiple evidence items
 * 
 * @param {Object[]} evidenceArray - Array of evidence
 * @param {Object} investigation - Investigation object
 * @returns {Object} - Statistics
 */
const calculateAggregateRelevance = (evidenceArray, investigation) => {
  if (!Array.isArray(evidenceArray) || evidenceArray.length === 0) {
    return {
      total: 0,
      averageScore: 0,
      high: 0,
      medium: 0,
      low: 0,
      highPercent: 0,
      mediumPercent: 0,
      lowPercent: 0,
    };
  }

  const results = evidenceArray.map(evidence => 
    calculateRelevance(evidence, investigation)
  );

  const counts = {
    high: 0,
    medium: 0,
    low: 0,
  };

  let totalScore = 0;

  results.forEach(result => {
    counts[result.level.toLowerCase()]++;
    totalScore += result.score;
  });

  const total = results.length;
  const averageScore = parseFloat((totalScore / total).toFixed(2));

  return {
    total,
    averageScore,
    high: counts.high,
    medium: counts.medium,
    low: counts.low,
    highPercent: parseFloat(((counts.high / total) * 100).toFixed(1)),
    mediumPercent: parseFloat(((counts.medium / total) * 100).toFixed(1)),
    lowPercent: parseFloat(((counts.low / total) * 100).toFixed(1)),
  };
};

/**
 * Get relevance metadata
 * 
 * @returns {Object} - Information about relevance calculation
 */
const getMetadata = () => {
  return {
    method: 'Weighted scoring based on investigation criteria',
    version: '1.0',
    description: 'Calculates how relevant evidence is to the investigation',
    scoreRange: [0, 100],
    levels: {
      high: '67-100',
      medium: '34-66',
      low: '0-33',
    },
    scoringComponents: {
      targetRelevance: {
        maxPoints: 40,
        description: 'Based on target name occurrence in content',
        calculation: 'Min(40, occurrences × 10)',
      },
      keywordRelevance: {
        maxPoints: 40,
        description: 'Based on investigation keyword occurrence',
        calculation: 'Sum of keyword matches with diminishing returns',
      },
      sourceRelevance: {
        maxPoints: 15,
        description: 'Based on source metadata match with target',
        calculation: 'Source name (7) + Author (5) + URL indicators (3)',
      },
      contentDepth: {
        maxPoints: 5,
        description: 'Based on content length',
        calculation: '100+ words (5), 50-99 (3), 20-49 (1), <20 (0)',
      },
    },
    limitations: [
      'Only looks at keyword presence, not context',
      'Does not account for content quality',
      'URL indicators are simplistic',
      'Heavy content weight may overvalue length',
    ],
  };
};

module.exports = {
  calculateRelevance,
  calculateAggregateRelevance,
  calculateTargetRelevance,
  calculateKeywordRelevance,
  calculateSourceRelevance,
  calculateContentDepth,
  countOccurrences,
  getMetadata,
};
