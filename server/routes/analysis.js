const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const { validateObjectId } = require('../middleware/validation');

// Run analysis on an investigation
router.post('/:investigationId', validateObjectId, analysisController.analyzeInvestigation);

// Get analysis results for an investigation
router.get('/:investigationId', validateObjectId, analysisController.getAnalysis);

// Get findings for an investigation
router.get('/:investigationId/findings', validateObjectId, analysisController.getFindings);

// Get timeline data for an investigation
router.get('/:investigationId/timeline', validateObjectId, analysisController.getTimeline);

module.exports = router;
