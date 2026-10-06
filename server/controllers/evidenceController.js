const Evidence = require('../models/Evidence');
const Investigation = require('../models/Investigation');
const hashService = require('../services/hashService');

// Create new evidence
exports.createEvidence = async (req, res) => {
  try {
    const {
      investigationId,
      sourceName,
      sourceType,
      sourceUrl,
      author,
      publicationDate,
      content,
      notes,
    } = req.body;

    // Validation: Required fields
    if (!sourceName || !sourceType || !content || !investigationId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['sourceName', 'sourceType', 'content', 'investigationId'],
      });
    }

    // Validation: Check that investigation exists
    let investigation = await Investigation.findById(investigationId);
    if (!investigation) {
      investigation = await Investigation.findOne({ investigationId });
    }

    if (!investigation) {
      return res.status(404).json({
        error: 'Investigation not found',
        investigationId,
      });
    }

    // Validation: Source type
    const validSourceTypes = ['News', 'Blog', 'Forum', 'Public Social Media', 'Other Public Web Source'];
    if (!validSourceTypes.includes(sourceType)) {
      return res.status(400).json({
        error: 'Invalid source type',
        validTypes: validSourceTypes,
      });
    }

    // Validation: Content not empty/whitespace
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        error: 'Evidence content cannot be empty or whitespace only',
      });
    }

    // Validation: URL format if provided
    if (sourceUrl) {
      try {
        new URL(sourceUrl);
      } catch (err) {
        return res.status(400).json({
          error: 'Invalid URL format',
          url: sourceUrl,
        });
      }
    }

    // Validation: Publication date format if provided
    if (publicationDate) {
      const pubDate = new Date(publicationDate);
      if (isNaN(pubDate.getTime())) {
        return res.status(400).json({
          error: 'Invalid publication date format',
          received: publicationDate,
        });
      }
    }

    // Generate SHA-256 hash
    const sha256Hash = hashService.generateHash(content);

    // Create evidence
    const evidence = new Evidence({
      investigationId: investigation.investigationId || investigation._id.toString(),
      sourceName,
      sourceType,
      sourceUrl: sourceUrl || null,
      author: author || null,
      publicationDate: publicationDate ? new Date(publicationDate) : null,
      content,
      sha256Hash,
      notes: notes || null,
      analysisStatus: 'Pending',
    });

    await evidence.save();

    res.status(201).json({
      message: 'Evidence created successfully',
      evidence,
    });
  } catch (error) {
    console.error('Error creating evidence:', error);
    res.status(500).json({
      error: 'Failed to create evidence',
      details: error.message,
    });
  }
};

// Get evidence for an investigation
exports.getEvidenceByInvestigation = async (req, res) => {
  try {
    const { investigationId } = req.params;

    // Verify investigation exists
    let investigation = await Investigation.findById(investigationId);
    if (!investigation) {
      investigation = await Investigation.findOne({ investigationId });
    }

    if (!investigation) {
      return res.status(404).json({
        error: 'Investigation not found',
        investigationId,
      });
    }

    // Get all evidence for this investigation
    const evidence = await Evidence.find({
      investigationId: investigation.investigationId || investigation._id.toString(),
    }).sort({ collectionTimestamp: -1 });

    res.json({
      count: evidence.length,
      investigationId: investigation.investigationId || investigationId,
      evidence,
    });
  } catch (error) {
    console.error('Error fetching evidence:', error);
    res.status(500).json({
      error: 'Failed to fetch evidence',
      details: error.message,
    });
  }
};

// Get evidence by ID
exports.getEvidenceById = async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by MongoDB _id or evidenceId
    let evidence = await Evidence.findById(id);
    if (!evidence) {
      evidence = await Evidence.findOne({ evidenceId: id });
    }

    if (!evidence) {
      return res.status(404).json({
        error: 'Evidence not found',
        id,
      });
    }

    res.json({
      evidence,
    });
  } catch (error) {
    console.error('Error fetching evidence:', error);
    res.status(500).json({
      error: 'Failed to fetch evidence',
      details: error.message,
    });
  }
};

// Verify SHA-256 hash
exports.verifyHash = async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by MongoDB _id or evidenceId
    let evidence = await Evidence.findById(id);
    if (!evidence) {
      evidence = await Evidence.findOne({ evidenceId: id });
    }

    if (!evidence) {
      return res.status(404).json({
        error: 'Evidence not found',
        id,
      });
    }

    // Recalculate hash from stored content
    const calculatedHash = hashService.generateHash(evidence.content);
    const storedHash = evidence.sha256Hash;

    // Compare
    const verified = calculatedHash === storedHash;

    res.json({
      evidenceId: evidence.evidenceId,
      verified,
      storedHash,
      calculatedHash,
      message: verified
        ? 'SHA-256 hash verification successful - stored content matches original'
        : 'SHA-256 hash mismatch - stored content does not match original hash',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error verifying hash:', error);
    res.status(500).json({
      error: 'Failed to verify hash',
      details: error.message,
    });
  }
};

// Delete evidence
exports.deleteEvidence = async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by MongoDB _id or evidenceId
    let evidence = await Evidence.findById(id);
    if (!evidence) {
      evidence = await Evidence.findOne({ evidenceId: id });
    }

    if (!evidence) {
      return res.status(404).json({
        error: 'Evidence not found',
        id,
      });
    }

    const evidenceId = evidence.evidenceId;
    await Evidence.deleteOne({ _id: evidence._id });

    res.json({
      message: 'Evidence deleted successfully',
      evidenceId,
    });
  } catch (error) {
    console.error('Error deleting evidence:', error);
    res.status(500).json({
      error: 'Failed to delete evidence',
      details: error.message,
    });
  }
};
