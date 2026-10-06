const crypto = require('crypto');

/**
 * Generate SHA-256 hash from content
 * 
 * SHA-256 is used as an integrity reference for the stored evidence content.
 * It is NOT used to prove authenticity or legal admissibility.
 * 
 * @param {string} content - The content to hash
 * @returns {string} - Hex-encoded SHA-256 hash
 */
const generateHash = (content) => {
  if (!content || typeof content !== 'string') {
    throw new Error('Content must be a non-empty string');
  }

  const hash = crypto.createHash('sha256');
  hash.update(content, 'utf8');
  return hash.digest('hex');
};

/**
 * Verify that stored content matches its hash
 * 
 * @param {string} content - The stored content
 * @param {string} storedHash - The previously calculated hash
 * @returns {boolean} - True if hash matches, false otherwise
 */
const verifyHash = (content, storedHash) => {
  const calculatedHash = generateHash(content);
  return calculatedHash === storedHash;
};

module.exports = {
  generateHash,
  verifyHash,
};
