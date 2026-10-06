const express = require('express');
const router = express.Router();
const evidenceController = require('../controllers/evidenceController');
const analysisController = require('../controllers/analysisController');
const { validateEvidence, validateObjectId } = require('../middleware/validation');

// Create new evidence
router.post('/', validateEvidence, evidenceController.createEvidence);

// Get evidence for an investigation
router.get('/investigation/:investigationId', validateObjectId, evidenceController.getEvidenceByInvestigation);

// Get evidence by ID
router.get('/:id', validateObjectId, evidenceController.getEvidenceById);

// Verify SHA-256 hash
router.post('/:id/verify-hash', validateObjectId, evidenceController.verifyHash);

// Analyze single evidence
router.post('/:id/analyze', validateObjectId, analysisController.analyzeSingleEvidence);

// Delete evidence
router.delete('/:id', validateObjectId, evidenceController.deleteEvidence);

module.exports = router;
