/**
 * Sentiment Analysis Service
 * 
 * Uses a lexicon-based (rule-based) approach for transparency.
 * 
 * Methodology:
 * - Classifies text into Positive, Neutral, or Negative
 * - Based on weighted word lists
 * - Returns label and score (-1 to 1)
 * 
 * Important:
 * - This is NOT a measure of public opinion
 * - It's a classification of the tone/content in the evidence
 * - Use terminology: "Sentiment classification of analyzed evidence"
 * - Results should be prefaced with appropriate caveats
 * 
 * Limitations:
 * - Cannot understand context or sarcasm
 * - Accuracy depends on word lists
 * - Not suitable for sophisticated text analysis
 * - Best for trends, not individual interpretation
 */

// Positive sentiment words and weights
const POSITIVE_WORDS = new Map([
  // Strong positive
  ['excellent', 2], ['amazing', 2], ['wonderful', 2], ['fantastic', 2],
  ['great', 1.5], ['good', 1], ['better', 1], ['best', 2],
  ['awesome', 2], ['brilliant', 1.5], ['outstanding', 2],
  ['perfect', 2], ['succeed', 1.5], ['success', 1.5], ['successful', 1.5],
  ['happy', 1.5], ['pleased', 1.5], ['satisfied', 1],
  ['secure', 1], ['secure', 1], ['safe', 1], ['trusted', 1],
  ['support', 0.5], ['supported', 0.5], ['help', 0.5], ['helpful', 1],
  ['improve', 1], ['improved', 1], ['improvement', 1],
  ['working', 0.5], ['works', 0.5], ['solution', 0.5],
]);

// Negative sentiment words and weights
const NEGATIVE_WORDS = new Map([
  // Strong negative
  ['terrible', -2], ['horrible', -2], ['awful', -2], ['disgusting', -2],
  ['hate', -2], ['hated', -2], ['bad', -1], ['worse', -1.5], ['worst', -2],
  ['fail', -1.5], ['failed', -1.5], ['failure', -1.5], ['failing', -1.5],
  ['problem', -1], ['problems', -1], ['issue', -0.5], ['issues', -0.5],
  ['error', -1], ['errors', -1], ['bug', -1], ['bugs', -1],
  ['breach', -2], ['breached', -2], ['attack', -2], ['attacked', -2],
  ['malware', -2], ['virus', -2], ['hacked', -2], ['hack', -2],
  ['vulnerability', -1.5], ['vulnerable', -1.5], ['exploit', -2],
  ['fraud', -2], ['scam', -2], ['fake', -1], ['phishing', -2],
  ['complaint', -1], ['complain', -1], ['unhappy', -2], ['disappointed', -1.5],
  ['poor', -1], ['waste', -1], ['wasted', -1], ['useless', -2],
  ['slow', -0.5], ['broken', -1.5], ['crash', -1.5], ['crashed', -1.5],
  ['risk', -1], ['dangerous', -1.5], ['danger', -1.5], ['threat', -1.5],
  ['negative', -1], ['wrong', -1], ['critical', -1], ['severe', -1.5],
  ['security', -0.5], // context-dependent, slightly negative bias
  ['data', -0.5], // often negative context
]);

// Neutral/filler words that might appear positive but are just noise
const NEUTRAL_OVERRIDES = new Set([
  'said', 'say', 'state', 'noted', 'reported', 'claim', 'claims',
  'view', 'views', 'opinion', 'according',
]);

/**
 * Calculate sentiment score for text
 * 
 * @param {string} text - Text to analyze
 * @returns {Object} - { score: number (-1 to 1), label: string, explanation: string }
 */
const analyzeSentiment = (text) => {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return {
      score: 0,
      label: 'Neutral',
      explanation: 'Empty or invalid text',
      wordCount: 0,
      positiveCount: 0,
      negativeCount: 0,
    };
  }

  // Preprocess
  const normalized = text.toLowerCase();
  const words = normalized.split(/\s+/).filter(w => w.length > 0);

  let score = 0;
  let positiveCount = 0;
  let negativeCount = 0;
  const matchedPositive = [];
  const matchedNegative = [];

  // Analyze each word
  words.forEach(word => {
    // Remove punctuation for comparison
    const cleanWord = word.replace(/[^\w]/g, '');

    if (POSITIVE_WORDS.has(cleanWord)) {
      const weight = POSITIVE_WORDS.get(cleanWord);
      score += weight;
      positiveCount++;
      matchedPositive.push(`${cleanWord}(+${weight})`);
    }

    if (NEGATIVE_WORDS.has(cleanWord)) {
      const weight = NEGATIVE_WORDS.get(cleanWord);
      score += weight;
      negativeCount++;
      matchedNegative.push(`${cleanWord}(${weight})`);
    }
  });

  // Normalize score to -1 to 1 range
  // Use a scaling factor to compress extreme scores
  const maxPotentialScore = Math.abs(score);
  let normalizedScore = 0;
  
  if (maxPotentialScore > 0) {
    // Scale to -1 to 1, using tanh-like curve
    normalizedScore = Math.tanh(score / 10);
  }

  // Clamp to -1 to 1
  normalizedScore = Math.max(-1, Math.min(1, normalizedScore));

  // Determine label
  let label = 'Neutral';
  if (normalizedScore > 0.1) {
    label = 'Positive';
  } else if (normalizedScore < -0.1) {
    label = 'Negative';
  }

  const explanation = [
    `Analyzed ${words.length} words`,
    `Positive indicators: ${positiveCount}`,
    `Negative indicators: ${negativeCount}`,
  ].join(' | ');

  return {
    score: parseFloat(normalizedScore.toFixed(3)),
    label,
    explanation,
    wordCount: words.length,
    positiveCount,
    negativeCount,
    matchedPositive: matchedPositive.slice(0, 5), // Top 5 for debug
    matchedNegative: matchedNegative.slice(0, 5), // Top 5 for debug
  };
};

/**
 * Analyze sentiment for multiple content items
 * 
 * @param {string[]} textArray - Array of text content
 * @returns {Object} - Summary statistics
 */
const analyzeMultipleSentiments = (textArray) => {
  if (!Array.isArray(textArray) || textArray.length === 0) {
    return {
      total: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
      positivePercent: 0,
      neutralPercent: 0,
      negativePercent: 0,
      averageScore: 0,
    };
  }

  const results = textArray.map(text => analyzeSentiment(text));
  
  const counts = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };

  let totalScore = 0;

  results.forEach(result => {
    counts[result.label.toLowerCase()]++;
    totalScore += result.score;
  });

  const total = results.length;
  const averageScore = parseFloat((totalScore / total).toFixed(3));

  return {
    total,
    positive: counts.positive,
    neutral: counts.neutral,
    negative: counts.negative,
    positivePercent: parseFloat(((counts.positive / total) * 100).toFixed(1)),
    neutralPercent: parseFloat(((counts.neutral / total) * 100).toFixed(1)),
    negativePercent: parseFloat(((counts.negative / total) * 100).toFixed(1)),
    averageScore,
    results, // Include individual results for reference
  };
};

/**
 * Get sentiment metadata
 * @returns {Object} - Information about the sentiment analysis method
 */
const getMetadata = () => {
  return {
    method: 'Lexicon-based (rule-based) sentiment analysis',
    version: '1.0',
    description: 'Simple deterministic approach using weighted word lists',
    positiveWordsCount: POSITIVE_WORDS.size,
    negativeWordsCount: NEGATIVE_WORDS.size,
    scoreRange: '[-1.0, 1.0]',
    labels: ['Positive', 'Neutral', 'Negative'],
    thresholds: {
      positive: '> 0.1',
      neutral: '-0.1 to 0.1',
      negative: '< -0.1',
    },
    limitations: [
      'Cannot understand sarcasm or irony',
      'Context-dependent meanings not captured',
      'Limited by word list coverage',
      'Does NOT measure public opinion',
      'Best for trend analysis, not individual interpretation',
    ],
    caveats: [
      'This classification represents the tone/content of analyzed evidence only',
      'Should not be interpreted as objective public sentiment or opinion',
      'Results should always be contextualized with supporting evidence',
    ],
  };
};

module.exports = {
  analyzeSentiment,
  analyzeMultipleSentiments,
  getMetadata,
  POSITIVE_WORDS,
  NEGATIVE_WORDS,
};
