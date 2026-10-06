const express = require('express');
const router = express.Router();
const investigationController = require('../controllers/investigationController');
const { validateInvestigation, validateObjectId } = require('../middleware/validation');

// Create new investigation
router.post('/', validateInvestigation, investigationController.createInvestigation);

// Get all investigations
router.get('/', investigationController.getAllInvestigations);

// Get investigation by ID
router.get('/:id', validateObjectId, investigationController.getInvestigationById);

// Update investigation
router.put('/:id', validateObjectId, validateInvestigation, investigationController.updateInvestigation);

// Delete investigation
router.delete('/:id', validateObjectId, investigationController.deleteInvestigation);

module.exports = router;
