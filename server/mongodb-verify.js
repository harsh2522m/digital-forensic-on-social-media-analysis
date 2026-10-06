#!/usr/bin/env node

/**
 * MongoDB Verification Script
 * Tests real MongoDB persistence and data integrity
 * Phase 5 - Production Verification
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

// Import models
const Investigation = require('./models/Investigation');
const Evidence = require('./models/Evidence');
const Analysis = require('./models/Analysis');
const Report = require('./models/Report');

const MONGODB_URI = process.env.MONGODB_URI;

async function verifyMongoDB() {
  console.log('\n' + '='.repeat(70));
  console.log('MONGODB REAL PERSISTENCE VERIFICATION');
  console.log('='.repeat(70));
  console.log(`MongoDB URI: ${MONGODB_URI}\n`);

  try {
    // Connect to MongoDB
    console.log('Step 1: Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('✓ Connected to MongoDB\n');

    // Test 1: Create Investigation
    console.log('Step 2: Creating investigation...');
    const investigation = await Investigation.create({
      investigationId: 'test_verify_' + Date.now(),
      name: 'MongoDB Persistence Test Investigation',
      target: 'Test Target Corp',
      description: 'Real MongoDB verification test',
      investigator: 'System Test',
      keywords: ['test', 'verification', 'mongodb'],
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      status: 'active'
    });
    console.log(`✓ Investigation created: ${investigation.investigationId}\n`);

    // Test 2: Retrieve Investigation
    console.log('Step 3: Retrieving investigation from database...');
    const retrievedInv = await Investigation.findById(investigation._id);
    if (retrievedInv && retrievedInv.investigationId === investigation.investigationId) {
      console.log('✓ Investigation retrieved successfully\n');
    } else {
      console.log('✗ Investigation retrieval failed\n');
      throw new Error('Investigation not found');
    }

    // Test 3: Create Evidence with Hash
    console.log('Step 4: Creating evidence with SHA-256 hash...');
    const evidenceContent = `Test evidence content created at ${new Date().toISOString()}`;
    const contentHash = crypto.createHash('sha256').update(evidenceContent).digest('hex');

    const evidence = await Evidence.create({
      investigationId: investigation.investigationId,
      content: evidenceContent,
      sourceName: 'Test News Source',
      sourceType: 'News Article',
      publicationDate: new Date('2024-01-15'),
      url: 'https://example.com/test',
      contentHash: contentHash,
      analysisStatus: 'Pending',
      archivedAt: null
    });
    console.log(`✓ Evidence created: ${evidence.evidenceId}`);
    console.log(`  Hash: ${contentHash.substring(0, 16)}...\n`);

    // Test 4: Verify Hash Persistence
    console.log('Step 5: Verifying hash persistence...');
    const retrievedEvidence = await Evidence.findById(evidence._id);
    const recalculatedHash = crypto.createHash('sha256').update(retrievedEvidence.content).digest('hex');
    
    if (recalculatedHash === retrievedEvidence.contentHash) {
      console.log('✓ Hash verified: Stored hash matches recalculated hash\n');
    } else {
      console.log('✗ Hash mismatch\n');
      throw new Error('Hash verification failed');
    }

    // Test 5: Archive Evidence
    console.log('Step 6: Testing archive functionality...');
    const originalContent = retrievedEvidence.content;
    const originalHash = retrievedEvidence.contentHash;
    
    retrievedEvidence.archivedAt = new Date();
    retrievedEvidence.analysisStatus = 'Archived';
    await retrievedEvidence.save();
    console.log('✓ Evidence archived\n');

    // Test 6: Verify Archive Preservation
    console.log('Step 7: Verifying archived evidence preservation...');
    const archivedEvidence = await Evidence.findById(evidence._id);
    
    if (archivedEvidence.content === originalContent && 
        archivedEvidence.contentHash === originalHash &&
        archivedEvidence.archivedAt) {
      console.log('✓ Archived evidence content and hash preserved\n');
    } else {
      console.log('✗ Archive verification failed\n');
      throw new Error('Archive preservation failed');
    }

    // Test 7: Create Analysis
    console.log('Step 8: Creating analysis results...');
    const analysis = await Analysis.create({
      investigationId: investigation.investigationId,
      summary: {
        totalEvidence: 1,
        analyzedEvidence: 1,
        dominantSentiment: 'Neutral'
      },
      evidence: [{
        evidenceId: evidence.evidenceId,
        sentimentLabel: 'Neutral',
        sentimentScore: 0.5,
        extractedKeywords: ['test', 'verification'],
        topics: [{ name: 'Testing', confidence: 0.8 }],
        relevanceScore: 0.7,
        relevanceLevel: 'MEDIUM'
      }],
      findings: [{
        title: 'Test Finding',
        severity: 'LOW',
        description: 'This is a test finding'
      }],
      timeline: [{
        date: '2024-01-15',
        count: 1,
        sentiment: { positive: 0, neutral: 1, negative: 0 }
      }]
    });
    console.log(`✓ Analysis created for investigation\n`);

    // Test 8: Retrieve Analysis
    console.log('Step 9: Retrieving analysis from database...');
    const retrievedAnalysis = await Analysis.findOne({ investigationId: investigation.investigationId });
    if (retrievedAnalysis && retrievedAnalysis.summary.totalEvidence === 1) {
      console.log('✓ Analysis retrieved successfully\n');
    } else {
      console.log('✗ Analysis retrieval failed\n');
      throw new Error('Analysis not found');
    }

    // Test 9: Create Report
    console.log('Step 10: Creating report metadata...');
    const report = await Report.create({
      reportId: 'report_verify_' + Date.now(),
      investigationId: investigation.investigationId,
      generatedAt: new Date(),
      analysisVersion: '1.0',
      applicationVersion: '1.0',
      reportMetadata: {
        title: `Report: ${investigation.name}`,
        investigationName: investigation.name,
        target: investigation.target,
        investigator: investigation.investigator,
        totalEvidence: 1,
        analyzedEvidence: 1,
        generatedTimestamp: new Date()
      },
      pdfFileName: 'Test_Report_verify_2024-01-15.pdf'
    });
    console.log(`✓ Report metadata created: ${report.reportId}\n`);

    // Test 10: Verify Data Relationships
    console.log('Step 11: Verifying data relationships...');
    const invCount = await Investigation.countDocuments({ investigationId: investigation.investigationId });
    const evCount = await Evidence.countDocuments({ investigationId: investigation.investigationId });
    const anaCount = await Analysis.countDocuments({ investigationId: investigation.investigationId });
    const repCount = await Report.countDocuments({ investigationId: investigation.investigationId });

    console.log(`  Investigations: ${invCount} ✓`);
    console.log(`  Evidence: ${evCount} ✓`);
    console.log(`  Analysis: ${anaCount} ✓`);
    console.log(`  Reports: ${repCount} ✓\n`);

    if (invCount === 1 && evCount === 1 && anaCount === 1 && repCount === 1) {
      console.log('✓ All data relationships verified\n');
    } else {
      throw new Error('Data relationship verification failed');
    }

    // Summary
    console.log('='.repeat(70));
    console.log('VERIFICATION SUMMARY');
    console.log('='.repeat(70));
    console.log('✓ MongoDB connection successful');
    console.log('✓ Investigation creation and retrieval');
    console.log('✓ Evidence creation with SHA-256 hash');
    console.log('✓ Hash persistence verification');
    console.log('✓ Evidence archiving');
    console.log('✓ Archive preservation (content + hash)');
    console.log('✓ Analysis creation and retrieval');
    console.log('✓ Report creation and metadata storage');
    console.log('✓ Data relationships maintained');
    console.log('\n✓ MONGODB REAL PERSISTENCE VERIFIED\n');
    console.log('='.repeat(70) + '\n');

    // Test restart persistence (optional - if user provides flag)
    if (process.argv.includes('--test-restart')) {
      console.log('Testing persistence after simulated restart...');
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
      
      setTimeout(async () => {
        await mongoose.connect(MONGODB_URI, {
          useNewUrlParser: true,
          useUnifiedTopology: true
        });
        const finalCheck = await Investigation.findById(investigation._id);
        if (finalCheck) {
          console.log('✓ Data persisted after reconnection\n');
        }
        process.exit(0);
      }, 2000);
    } else {
      process.exit(0);
    }

  } catch (error) {
    console.error('\n✗ VERIFICATION FAILED:');
    console.error(`Error: ${error.message}\n`);
    console.log('Troubleshooting:');
    console.log('1. Ensure MongoDB is running (local or Atlas accessible)');
    console.log('2. Verify MONGODB_URI in .env is correct');
    console.log('3. Check network connectivity for MongoDB Atlas');
    console.log('4. For local MongoDB: mongod should be running\n');
    process.exit(1);
  }
}

verifyMongoDB();
