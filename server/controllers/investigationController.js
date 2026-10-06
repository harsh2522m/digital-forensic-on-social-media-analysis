const Investigation = require('../models/Investigation');

// Create a new investigation
exports.createInvestigation = async (req, res) => {
  try {
    const { name, target, description, keywords, startDate, endDate, investigator } = req.body;

    // Validation
    if (!name || !target || !startDate || !investigator) {
      return res.status(400).json({
        error: 'Missing required fields: name, target, startDate, investigator',
      });
    }

    const investigation = new Investigation({
      name,
      target,
      description,
      keywords: keywords || [],
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      investigator,
    });

    await investigation.save();

    res.status(201).json({
      message: 'Investigation created successfully',
      investigation,
    });
  } catch (error) {
    console.error('Error creating investigation:', error);
    res.status(500).json({
      error: 'Failed to create investigation',
      details: error.message,
    });
  }
};

// Get all investigations
exports.getAllInvestigations = async (req, res) => {
  try {
    const investigations = await Investigation.find().sort({ createdAt: -1 });

    res.json({
      count: investigations.length,
      investigations,
    });
  } catch (error) {
    console.error('Error fetching investigations:', error);
    res.status(500).json({
      error: 'Failed to fetch investigations',
      details: error.message,
    });
  }
};

// Get investigation by ID
exports.getInvestigationById = async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by MongoDB _id or investigationId
    let investigation = await Investigation.findById(id);
    if (!investigation) {
      investigation = await Investigation.findOne({ investigationId: id });
    }

    if (!investigation) {
      return res.status(404).json({
        error: 'Investigation not found',
        id,
      });
    }

    res.json({
      investigation,
    });
  } catch (error) {
    console.error('Error fetching investigation:', error);
    res.status(500).json({
      error: 'Failed to fetch investigation',
      details: error.message,
    });
  }
};

// Update investigation
exports.updateInvestigation = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Try to find by MongoDB _id or investigationId
    let investigation = await Investigation.findById(id);
    if (!investigation) {
      investigation = await Investigation.findOne({ investigationId: id });
    }

    if (!investigation) {
      return res.status(404).json({
        error: 'Investigation not found',
        id,
      });
    }

    // Update allowed fields
    const allowedFields = ['name', 'target', 'description', 'keywords', 'startDate', 'endDate', 'investigator', 'status', 'notes'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        investigation[field] = updateData[field];
      }
    });

    await investigation.save();

    res.json({
      message: 'Investigation updated successfully',
      investigation,
    });
  } catch (error) {
    console.error('Error updating investigation:', error);
    res.status(500).json({
      error: 'Failed to update investigation',
      details: error.message,
    });
  }
};

// Delete investigation
exports.deleteInvestigation = async (req, res) => {
  try {
    const { id } = req.params;

    // Try to find by MongoDB _id or investigationId
    let investigation = await Investigation.findById(id);
    if (!investigation) {
      investigation = await Investigation.findOne({ investigationId: id });
    }

    if (!investigation) {
      return res.status(404).json({
        error: 'Investigation not found',
        id,
      });
    }

    await Investigation.deleteOne({ _id: investigation._id });

    res.json({
      message: 'Investigation deleted successfully',
      investigationId: investigation.investigationId,
    });
  } catch (error) {
    console.error('Error deleting investigation:', error);
    res.status(500).json({
      error: 'Failed to delete investigation',
      details: error.message,
    });
  }
};
