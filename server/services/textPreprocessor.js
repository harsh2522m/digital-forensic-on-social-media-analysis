/**
 * Text Preprocessing Service
 * 
 * Provides utility functions for processing text for analysis.
 * Original content is never modified - all operations work on copies.
 */

// Common English stop words
const STOP_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are',
  'aren\'t', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between',
  'both', 'but', 'by', 'can\'t', 'cannot', 'could', 'couldn\'t', 'did', 'didn\'t', 'do',
  'does', 'doesn\'t', 'doing', 'don\'t', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'hadn\'t', 'has', 'hasn\'t', 'have', 'haven\'t', 'having', 'he', 'he\'d',
  'he\'ll', 'he\'s', 'her', 'here', 'here\'s', 'hers', 'herself', 'him', 'himself', 'his',
  'how', 'how\'s', 'i', 'i\'d', 'i\'ll', 'i\'m', 'i\'ve', 'if', 'in', 'into', 'is', 'isn\'t',
  'it', 'it\'s', 'its', 'itself', 'just', 'k', 'l', 'let\'s', 'me', 'more', 'most', 'mustn\'t',
  'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other',
  'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'shan\'t', 'she',
  'she\'d', 'she\'ll', 'she\'s', 'should', 'shouldn\'t', 'so', 'some', 'such', 'than',
  'that', 'that\'s', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there',
  'there\'s', 'these', 'they', 'they\'d', 'they\'ll', 'they\'re', 'they\'ve', 'this',
  'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasn\'t',
  'we', 'we\'d', 'we\'ll', 'we\'re', 'we\'ve', 'were', 'weren\'t', 'what', 'what\'s',
  'when', 'when\'s', 'where', 'where\'s', 'which', 'while', 'who', 'who\'s', 'whom',
  'why', 'why\'s', 'with', 'won\'t', 'would', 'wouldn\'t', 'you', 'you\'d', 'you\'ll',
  'you\'re', 'you\'ve', 'your', 'yours', 'yourself', 'yourselves',
  // Additional common words
  'can', 'will', 'shall', 'also', 'need', 'get', 'make', 'use', 'way', 'may', 'now',
  'new', 'good', 'well', 'would', 'could', 'first', 'many', 'one', 'two', 'three',
  'said', 'say', 'says', 'should', 'must', 'may', 'might', 'going', 'went', 'come',
  'came', 'comes', 'give', 'gave', 'given', 'see', 'saw', 'seen', 'take', 'took',
  'taken', 'know', 'knew', 'known', 'think', 'thought', 'want', 'wanted', 'work',
  'worked', 'find', 'found', 'tell', 'told', 'ask', 'asked', 'go', 'goes', 'seem',
  'seemed', 'show', 'showed', 'shown', 'hear', 'heard', 'let', 'leave', 'left',
  'put', 'etc', 'http', 'https', 'www', 'com', 'org'
]);

/**
 * Normalize text: lowercase, whitespace cleanup
 * @param {string} text - Input text
 * @returns {string} - Normalized text
 */
const normalize = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim();
};

/**
 * Remove punctuation and special characters
 * @param {string} text - Input text
 * @returns {string} - Text with punctuation removed
 */
const removePunctuation = (text) => {
  if (!text) return '';
  
  return text
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
    .replace(/\d+/g, '') // Remove numbers
    .replace(/\s+/g, ' ') // Clean up spaces
    .trim();
};

/**
 * Tokenize text into words
 * @param {string} text - Input text
 * @returns {string[]} - Array of tokens/words
 */
const tokenize = (text) => {
  if (!text) return [];
  
  return text
    .split(/\s+/)
    .filter(token => token.length > 0);
};

/**
 * Remove stop words from token list
 * @param {string[]} tokens - Array of tokens
 * @returns {string[]} - Tokens with stop words removed
 */
const removeStopWords = (tokens) => {
  if (!Array.isArray(tokens)) return [];
  
  return tokens.filter(token => {
    const cleanToken = token.toLowerCase().replace(/[^\w]/g, '');
    return cleanToken.length > 2 && !STOP_WORDS.has(cleanToken);
  });
};

/**
 * Calculate word frequencies from tokens
 * @param {string[]} tokens - Array of tokens
 * @returns {Map<string, number>} - Word -> frequency map
 */
const calculateFrequencies = (tokens) => {
  const frequencies = new Map();
  
  if (!Array.isArray(tokens)) return frequencies;
  
  tokens.forEach(token => {
    const word = token.toLowerCase();
    frequencies.set(word, (frequencies.get(word) || 0) + 1);
  });
  
  return frequencies;
};

/**
 * Preprocess text for analysis
 * Does NOT modify original content
 * 
 * @param {string} content - Original content
 * @returns {Object} - Preprocessed data
 */
const preprocessText = (content) => {
  if (!content || typeof content !== 'string') {
    return {
      original: '',
      normalized: '',
      tokens: [],
      tokensNoStopWords: [],
      frequencies: new Map(),
    };
  }

  // Step 1: Normalize
  const normalized = normalize(content);
  
  // Step 2: Remove punctuation
  const cleaned = removePunctuation(normalized);
  
  // Step 3: Tokenize
  const tokens = tokenize(cleaned);
  
  // Step 4: Remove stop words
  const tokensNoStopWords = removeStopWords(tokens);
  
  // Step 5: Calculate frequencies
  const frequencies = calculateFrequencies(tokensNoStopWords);
  
  return {
    original: content, // Preserve original
    normalized,
    tokens,
    tokensNoStopWords,
    frequencies,
  };
};

/**
 * Get top N keywords by frequency
 * @param {Map<string, number>} frequencies - Frequency map
 * @param {number} limit - Number of top keywords to return
 * @returns {Object[]} - Array of {keyword, frequency}
 */
const getTopKeywords = (frequencies, limit = 10) => {
  if (!frequencies || frequencies.size === 0) return [];
  
  return Array.from(frequencies.entries())
    .map(([keyword, frequency]) => ({ keyword, frequency }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit);
};

module.exports = {
  normalize,
  removePunctuation,
  tokenize,
  removeStopWords,
  calculateFrequencies,
  preprocessText,
  getTopKeywords,
  STOP_WORDS,
};
