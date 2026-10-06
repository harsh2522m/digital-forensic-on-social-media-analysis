/**
 * Input Validation Middleware
 * Phase 5 - Security Hardening
 * 
 * Validates all API inputs to prevent:
 * - Missing required fields
 * - Invalid data types
 * - Malformed URLs
 * - Invalid dates
 * - Excessively large content
 * - Invalid IDs
 */

const MAX_CONTENT_LENGTH = 50000; // 50KB max for evidence content
const MAX_STRING_LENGTH = 500; // General string field max
const MAX_ARRAY_LENGTH = 100; // Max array elements

/**
 * Validate investigation creation request
 */
function validateInvestigation(req, res, next) {
  const { name, target, description, keywords, startDate, endDate, investigator } = req.body;

  // Required fields
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid or missing field: name',
      details: 'Name must be a non-empty string'
    });
  }

  if (name.length > MAX_STRING_LENGTH) {
    return res.status(400).json({
      error: 'Invalid field: name',
      details: `Name must not exceed ${MAX_STRING_LENGTH} characters`
    });
  }

  if (!target || typeof target !== 'string' || target.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid or missing field: target',
      details: 'Target must be a non-empty string'
    });
  }

  if (target.length > MAX_STRING_LENGTH) {
    return res.status(400).json({
      error: 'Invalid field: target',
      details: `Target must not exceed ${MAX_STRING_LENGTH} characters`
    });
  }

  if (!investigator || typeof investigator !== 'string' || investigator.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid or missing field: investigator',
      details: 'Investigator must be a non-empty string'
    });
  }

  // Date validation
  let startDateObj, endDateObj;
  try {
    startDateObj = new Date(startDate);
    if (isNaN(startDateObj.getTime())) {
      throw new Error('Invalid startDate');
    }
  } catch {
    return res.status(400).json({
      error: 'Invalid field: startDate',
      details: 'StartDate must be a valid ISO 8601 date'
    });
  }

  if (endDate) {
    try {
      endDateObj = new Date(endDate);
      if (isNaN(endDateObj.getTime())) {
        throw new Error('Invalid endDate');
      }
      if (endDateObj < startDateObj) {
        return res.status(400).json({
          error: 'Invalid field: endDate',
          details: 'EndDate must be after or equal to startDate'
        });
      }
    } catch {
      return res.status(400).json({
        error: 'Invalid field: endDate',
        details: 'EndDate must be a valid ISO 8601 date'
      });
    }
  }

  // Optional fields with validation
  if (description && typeof description !== 'string') {
    return res.status(400).json({
      error: 'Invalid field: description',
      details: 'Description must be a string'
    });
  }

  if (description && description.length > MAX_STRING_LENGTH * 2) {
    return res.status(400).json({
      error: 'Invalid field: description',
      details: `Description must not exceed ${MAX_STRING_LENGTH * 2} characters`
    });
  }

  if (keywords) {
    if (!Array.isArray(keywords)) {
      return res.status(400).json({
        error: 'Invalid field: keywords',
        details: 'Keywords must be an array'
      });
    }

    if (keywords.length > MAX_ARRAY_LENGTH) {
      return res.status(400).json({
        error: 'Invalid field: keywords',
        details: `Keywords array must not exceed ${MAX_ARRAY_LENGTH} items`
      });
    }

    for (let i = 0; i < keywords.length; i++) {
      if (typeof keywords[i] !== 'string' || keywords[i].length === 0) {
        return res.status(400).json({
          error: 'Invalid field: keywords',
          details: 'Each keyword must be a non-empty string'
        });
      }
    }
  }

  next();
}

/**
 * Validate evidence creation request
 */
function validateEvidence(req, res, next) {
  const { investigationId, content, sourceName, sourceType, publicationDate, url, notes } = req.body;

  // Required fields
  if (!investigationId || typeof investigationId !== 'string' || investigationId.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid or missing field: investigationId',
      details: 'InvestigationId must be a non-empty string'
    });
  }

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid or missing field: content',
      details: 'Content must be a non-empty string'
    });
  }

  if (content.length > MAX_CONTENT_LENGTH) {
    return res.status(400).json({
      error: 'Invalid field: content',
      details: `Content must not exceed ${MAX_CONTENT_LENGTH} characters (${Math.round(MAX_CONTENT_LENGTH / 1024)}KB)`
    });
  }

  if (!sourceName || typeof sourceName !== 'string' || sourceName.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid or missing field: sourceName',
      details: 'SourceName must be a non-empty string'
    });
  }

  if (sourceName.length > MAX_STRING_LENGTH) {
    return res.status(400).json({
      error: 'Invalid field: sourceName',
      details: `SourceName must not exceed ${MAX_STRING_LENGTH} characters`
    });
  }

  if (!sourceType || typeof sourceType !== 'string' || sourceType.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid or missing field: sourceType',
      details: 'SourceType must be a non-empty string'
    });
  }

  const validSourceTypes = ['News Article', 'Blog Post', 'Twitter', 'Facebook', 'LinkedIn', 'Reddit', 'Other'];
  if (!validSourceTypes.includes(sourceType)) {
    return res.status(400).json({
      error: 'Invalid field: sourceType',
      details: `SourceType must be one of: ${validSourceTypes.join(', ')}`
    });
  }

  // URL validation (if provided)
  if (url) {
    if (typeof url !== 'string') {
      return res.status(400).json({
        error: 'Invalid field: url',
        details: 'URL must be a string'
      });
    }

    try {
      new URL(url);
    } catch {
      return res.status(400).json({
        error: 'Invalid field: url',
        details: 'URL must be a valid absolute URL'
      });
    }
  }

  // Date validation (if provided)
  if (publicationDate) {
    try {
      const dateObj = new Date(publicationDate);
      if (isNaN(dateObj.getTime())) {
        throw new Error('Invalid date');
      }
    } catch {
      return res.status(400).json({
        error: 'Invalid field: publicationDate',
        details: 'PublicationDate must be a valid ISO 8601 date'
      });
    }
  }

  // Optional notes
  if (notes && typeof notes !== 'string') {
    return res.status(400).json({
      error: 'Invalid field: notes',
      details: 'Notes must be a string'
    });
  }

  if (notes && notes.length > MAX_STRING_LENGTH * 2) {
    return res.status(400).json({
      error: 'Invalid field: notes',
      details: `Notes must not exceed ${MAX_STRING_LENGTH * 2} characters`
    });
  }

  next();
}

/**
 * Validate ID parameters
 */
function validateObjectId(req, res, next) {
  const id = req.params.id || req.params.investigationId || req.params.reportId;
  
  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid ID parameter',
      details: 'ID must be a non-empty string'
    });
  }

  if (id.length > 100) {
    return res.status(400).json({
      error: 'Invalid ID parameter',
      details: 'ID is malformed'
    });
  }

  next();
}

/**
 * Validate report generation request
 */
function validateReportRequest(req, res, next) {
  const { investigationId } = req.params;

  if (!investigationId || typeof investigationId !== 'string' || investigationId.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid or missing parameter: investigationId',
      details: 'InvestigationId must be a non-empty string'
    });
  }

  if (investigationId.length > 100) {
    return res.status(400).json({
      error: 'Invalid parameter: investigationId',
      details: 'InvestigationId is malformed'
    });
  }

  next();
}

module.exports = {
  validateInvestigation,
  validateEvidence,
  validateObjectId,
  validateReportRequest,
  MAX_CONTENT_LENGTH,
  MAX_STRING_LENGTH,
  MAX_ARRAY_LENGTH
};
