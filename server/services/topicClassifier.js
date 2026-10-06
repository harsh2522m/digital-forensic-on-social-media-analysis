/**
 * Topic Classification Service
 * 
 * Rule-based topic classification system.
 * 
 * Topics:
 * - Cybersecurity
 * - Privacy
 * - Customer Service
 * - Product
 * - Pricing
 * - Fraud
 * - Reputation
 * - General
 * 
 * Each content item can have one primary topic and optional secondary topics.
 * Uses keyword matching with transparent rules.
 */

// Topic keyword mappings
// Each keyword has a weight indicating relevance
const TOPIC_KEYWORDS = {
  Cybersecurity: {
    primary: [
      'breach', 'attack', 'malware', 'vulnerability', 'hacker', 'hack',
      'security', 'exploit', 'threat', 'ransomware', 'virus', 'phishing',
      'encryption', 'password', 'authentication', 'firewall', 'intrusion',
      'compromised', 'infected', 'breach', 'suspicious', 'exposure',
    ],
    secondary: ['data', 'system', 'network', 'information', 'access', 'protect'],
  },

  Privacy: {
    primary: [
      'privacy', 'personal data', 'gdpr', 'data protection', 'consent',
      'tracking', 'surveillance', 'anonymous', 'information', 'collected',
      'share', 'permission', 'cookie', 'disclosure', 'confidential',
    ],
    secondary: ['data', 'user', 'information', 'access'],
  },

  'Customer Service': {
    primary: [
      'support', 'service', 'complaint', 'customer', 'help', 'response',
      'resolution', 'issue', 'ticket', 'agent', 'representative', 'care',
      'satisfaction', 'quality', 'assistance', 'inquire',
    ],
    secondary: ['problem', 'solution', 'experience'],
  },

  Product: {
    primary: [
      'product', 'feature', 'functionality', 'performance', 'quality',
      'release', 'update', 'version', 'build', 'development', 'design',
      'interface', 'user experience', 'usability', 'specification',
    ],
    secondary: ['new', 'improve', 'work', 'system'],
  },

  Pricing: {
    primary: [
      'price', 'cost', 'expensive', 'cheap', 'fee', 'charge', 'payment',
      'subscription', 'plan', 'discount', 'rate', 'billing', 'refund',
      'value', 'afford', 'investment',
    ],
    secondary: ['product', 'service', 'deal'],
  },

  Fraud: {
    primary: [
      'fraud', 'scam', 'fake', 'forgery', 'deceptive', 'false', 'misleading',
      'phishing', 'scheme', 'trick', 'illegally', 'illegal', 'unauthorized',
      'impersonation', 'exploit', 'abuse', 'misuse',
    ],
    secondary: ['account', 'identity', 'transaction'],
  },

  Reputation: {
    primary: [
      'reputation', 'brand', 'image', 'credibility', 'trust', 'trustworthy',
      'ethical', 'responsible', 'scandal', 'controversy', 'negative',
      'positive', 'opinion', 'review', 'rating', 'rating',
    ],
    secondary: ['company', 'organization', 'service'],
  },

  General: {
    primary: [], // Default category
    secondary: [],
  },
};

/**
 * Classify topic for a single content item
 * 
 * @param {string} content - Content to classify
 * @param {Object} options - Options
 * @param {string[]} options.investigationKeywords - Keywords from investigation
 * @returns {Object[]} - Array of {name, confidence, isPrimary}
 */
const classifyTopic = (content, options = {}) => {
  const { investigationKeywords = [] } = options;

  if (!content || typeof content !== 'string') {
    return [];
  }

  const contentLower = content.toLowerCase();
  const results = [];
  let highestConfidence = 0;
  let primaryTopic = null;

  // Score each topic
  Object.entries(TOPIC_KEYWORDS).forEach(([topic, keywords]) => {
    if (topic === 'General') return; // Don't score General here

    let score = 0;
    const matchedKeywords = [];

    // Check primary keywords (weight 2)
    keywords.primary.forEach(keyword => {
      if (contentLower.includes(keyword.toLowerCase())) {
        score += 2;
        matchedKeywords.push(keyword);
      }
    });

    // Check secondary keywords (weight 1)
    keywords.secondary.forEach(keyword => {
      if (contentLower.includes(keyword.toLowerCase())) {
        score += 1;
        matchedKeywords.push(keyword);
      }
    });

    // Boost score if matches investigation keywords
    if (investigationKeywords.length > 0) {
      investigationKeywords.forEach(invKeyword => {
        if (contentLower.includes(invKeyword.toLowerCase())) {
          score += 1;
        }
      });
    }

    // Calculate confidence (0-1)
    const maxPossibleScore = keywords.primary.length * 2 + keywords.secondary.length * 1;
    const confidence = maxPossibleScore > 0 ? Math.min(1, score / maxPossibleScore) : 0;

    if (confidence > 0 && score > 0) {
      results.push({
        name: topic,
        confidence: parseFloat(confidence.toFixed(3)),
        score,
        matchedKeywords: matchedKeywords.slice(0, 3), // Top 3 for debugging
      });

      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        primaryTopic = topic;
      }
    }
  });

  // Sort by confidence
  results.sort((a, b) => b.confidence - a.confidence);

  // Mark primary topic
  if (results.length > 0) {
    results[0].isPrimary = true;
  } else if (results.length === 0) {
    // Default to General if no match
    results.push({
      name: 'General',
      confidence: 0,
      isPrimary: true,
      matchedKeywords: [],
    });
  }

  // Mark secondary topics (top 2 if exists)
  for (let i = 1; i < results.length && i < 3; i++) {
    results[i].isPrimary = false;
  }

  return results;
};

/**
 * Classify topics for multiple evidence items
 * 
 * @param {Object[]} evidenceArray - Array of evidence
 * @param {Object} options - Options
 * @returns {Object} - Summary with topic distribution
 */
const aggregateTopics = (evidenceArray, options = {}) => {
  const { investigationKeywords = [] } = options;

  if (!Array.isArray(evidenceArray) || evidenceArray.length === 0) {
    return {
      total: 0,
      distribution: {},
      topTopic: null,
      topicDetails: [],
    };
  }

  const topicCounts = {};
  const allTopics = [];

  // Classify each evidence item
  evidenceArray.forEach(evidence => {
    if (!evidence.content) return;

    const topics = classifyTopic(evidence.content, { investigationKeywords });

    if (topics.length > 0) {
      const primaryTopic = topics.find(t => t.isPrimary);
      if (primaryTopic) {
        topicCounts[primaryTopic.name] = (topicCounts[primaryTopic.name] || 0) + 1;
        allTopics.push(primaryTopic);
      }
    }
  });

  // Calculate percentages
  const distribution = {};
  Object.entries(topicCounts).forEach(([topic, count]) => {
    distribution[topic] = parseFloat(((count / evidenceArray.length) * 100).toFixed(1));
  });

  // Find top topic
  const topTopic = Object.entries(topicCounts).sort(([, a], [, b]) => b - a)[0];

  const topicDetails = Object.entries(topicCounts)
    .map(([name, count]) => ({
      name,
      count,
      percentage: parseFloat(((count / evidenceArray.length) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);

  return {
    total: evidenceArray.length,
    classified: Object.values(topicCounts).reduce((a, b) => a + b, 0),
    distribution,
    topTopic: topTopic ? { name: topTopic[0], count: topTopic[1] } : null,
    topicDetails,
  };
};

/**
 * Get topic metadata and rules
 * 
 * @returns {Object} - Metadata about topic classification
 */
const getMetadata = () => {
  return {
    method: 'Rule-based keyword matching',
    version: '1.0',
    description: 'Transparent classification based on predefined keyword lists',
    topics: Object.keys(TOPIC_KEYWORDS),
    primaryWeightPerKeyword: 2,
    secondaryWeightPerKeyword: 1,
    confidenceCalculation: 'Score / MaxPossibleScore',
    limitations: [
      'Context-dependent meanings not fully captured',
      'May misclassify if multiple topics are present',
      'Keyword lists may not cover all variations',
      'Single primary topic per evidence item',
    ],
    rules: Object.entries(TOPIC_KEYWORDS).map(([topic, keywords]) => ({
      topic,
      primaryKeywords: keywords.primary,
      secondaryKeywords: keywords.secondary,
    })),
  };
};

module.exports = {
  classifyTopic,
  aggregateTopics,
  getMetadata,
  TOPIC_KEYWORDS,
};
