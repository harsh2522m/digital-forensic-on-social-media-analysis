const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { validateReportRequest, validateObjectId } = require('../middleware/validation');

// Generate a new report
router.post('/:investigationId', validateReportRequest, reportController.generateReport);

// Get report status and latest report info
router.get('/:investigationId', validateReportRequest, reportController.getReport);

// Download specific report as PDF
router.get('/:investigationId/:reportId', validateReportRequest, validateObjectId, reportController.downloadReport);

module.exports = router;
