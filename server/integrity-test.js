#!/usr/bin/env node

/**
 * Forensic Data Integrity Testing Suite
 * Phase 5 - Verification of data persistence and consistency
 * 
 * Tests:
 * - Evidence creation with SHA-256 hash
 * - Hash verification after storage
 * - Archive functionality
 * - Archive preservation (content + hash unchanged)
 * - Analysis data consistency
 * - PDF report data consistency
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

const Investigation = require('./models/Investigation');
const Evidence = require('./models/Evidence');
const Analysis = require('./models/Analysis');
const Report = require('./models/Report');

const MONGODB_URI = process.env.MONGODB_URI;
let testResults = { passed: 0, failed: 0, tests: [] };

function logTest(name, passed, details = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const color = passed ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${status}\x1b[0m ${name}${details ? ': ' + details : ''}`);
  
  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function runIntegrityTests() {
  console.log('\n' + '='.repeat(70));
  console.log('FORENSIC DATA INTEGRITY TESTING SUITE');
  console.log('='.repeat(70));
  console.log(`MongoDB: ${MONGODB_URI}\n`);

  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('✓ Connected\n');

    // ========== TEST A: Evidence Creation with SHA-256 ==========
    console.log('TEST A: Evidence Creation with SHA-256\n');

    const testInv = await Investigation.create({
      investigationId: 'integrity_test_' + Date.now(),
      name: 'Integrity Test Investigation',
      target: 'Test Corp',
      description: 'Data integrity verification',
      investigator: 'System Test',
      keywords: ['test', 'integrity'],
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-31'),
      status: 'active'
    });

    const contentA = 'This is test evidence content for integrity verification';
    const hashA = crypto.createHash('sha256').update(contentA).digest('hex');

    const evidenceA = await Evidence.create({
      investigationId: testInv.investigationId,
      content: contentA,
      sourceName: 'Test Source A',
      sourceType: 'News Article',
      publicationDate: new Date('2024-01-15'),
      url: 'https://example.com/article',
      contentHash: hashA,
      analysisStatus: 'Pending',
      archivedAt: null
    });

    logTest('Test A.1: Evidence Created', !!evidenceA._id, `ID: ${evidenceA.evidenceId}`);
    logTest('Test A.2: SHA-256 Hash Generated', hashA.length === 64, `Hash: ${hashA.substring(0, 16)}...`);
    logTest('Test A.3: Server Timestamp Created', !!evidenceA.createdAt, `Time: ${evidenceA.createdAt}`);

    // ========== TEST B: Evidence Verification ==========
    console.log('\nTEST B: Evidence Verification\n');

    const retrievedA = await Evidence.findById(evidenceA._id);
    const recalcHashA = crypto.createHash('sha256').update(retrievedA.content).digest('hex');

    logTest('Test B.1: Content Persisted', retrievedA.content === contentA, 'Content matches');
    logTest('Test B.2: Hash Persisted', retrievedA.contentHash === hashA, 'Hash matches');
    logTest('Test B.3: Hash Verification', recalcHashA === hashA, 'Recalculated hash matches');

    // ========== TEST C: Archive Functionality ==========
    console.log('\nTEST C: Archive Functionality\n');

    const originalContent = retrievedA.content;
    const originalHash = retrievedA.contentHash;
    const originalTimestamp = new Date(retrievedA.createdAt);

    retrievedA.archivedAt = new Date();
    retrievedA.analysisStatus = 'Archived';
    await retrievedA.save();

    logTest('Test C.1: Archive Timestamp Set', !!retrievedA.archivedAt, `Archived at: ${retrievedA.archivedAt}`);
    logTest('Test C.2: Status Updated to Archived', retrievedA.analysisStatus === 'Archived', 'Status: Archived');

    // ========== TEST D: Archive Preservation ==========
    console.log('\nTEST D: Archive Preservation\n');

    const archivedEvidence = await Evidence.findById(evidenceA._id);

    logTest(
      'Test D.1: Archived Content Unchanged',
      archivedEvidence.content === originalContent,
      'Content preserved'
    );

    logTest(
      'Test D.2: Archived Hash Unchanged',
      archivedEvidence.contentHash === originalHash,
      'Hash preserved'
    );

    logTest(
      'Test D.3: Collection Timestamp Unchanged',
      new Date(archivedEvidence.createdAt).getTime() === originalTimestamp.getTime(),
      'Timestamp preserved'
    );

    // ========== TEST E: Analysis Data Consistency ==========
    console.log('\nTEST E: Analysis Data Consistency\n');

    const analysis = await Analysis.create({
      investigationId: testInv.investigationId,
      summary: {
        totalEvidence: 1,
        analyzedEvidence: 1,
        dominantSentiment: 'Neutral'
      },
      evidence: [{
        evidenceId: evidenceA.evidenceId,
        sentimentLabel: 'Neutral',
        sentimentScore: 0.5,
        extractedKeywords: [
          { keyword: 'test', frequency: 2 },
          { keyword: 'evidence', frequency: 1 }
        ],
        topics: [
          { name: 'Testing', confidence: 0.8 }
        ],
        relevanceScore: 0.75,
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
        sentiment: {
          positive: 0,
          neutral: 1,
          negative: 0
        }
      }]
    });

    logTest('Test E.1: Analysis Created', !!analysis._id, `Analysis ID generated`);
    logTest('Test E.2: Evidence Analysis Linked', analysis.evidence[0].evidenceId === evidenceA.evidenceId, 'Evidence ID matches');
    logTest('Test E.3: Sentiment Recorded', analysis.evidence[0].sentimentLabel === 'Neutral', 'Sentiment: Neutral');
    logTest('Test E.4: Keywords Extracted', analysis.evidence[0].extractedKeywords.length === 2, 'Keywords: 2');
    logTest('Test E.5: Topics Identified', analysis.evidence[0].topics.length === 1, 'Topics: 1');
    logTest('Test E.6: Findings Generated', analysis.findings.length === 1, 'Findings: 1');

    // Retrieve and verify consistency
    const retrievedAnalysis = await Analysis.findById(analysis._id);

    logTest(
      'Test E.7: Analysis Persisted',
      retrievedAnalysis.summary.totalEvidence === 1,
      'Analysis retrieved successfully'
    );

    logTest(
      'Test E.8: Sentiment Data Consistent',
      retrievedAnalysis.evidence[0].sentimentScore === 0.5,
      'Sentiment score: 0.5'
    );

    // ========== TEST F: Report Data Consistency ==========
    console.log('\nTEST F: Report Data Consistency\n');

    const report = await Report.create({
      reportId: 'integrity_report_' + Date.now(),
      investigationId: testInv.investigationId,
      generatedAt: new Date(),
      analysisVersion: '1.0',
      applicationVersion: '1.0',
      reportMetadata: {
        title: `Report: ${testInv.name}`,
        investigationName: testInv.name,
        target: testInv.target,
        investigator: testInv.investigator,
        totalEvidence: 1,
        analyzedEvidence: 1,
        generatedTimestamp: new Date()
      },
      pdfFileName: `Integrity_Report_${testInv.investigationId.substring(0, 8)}_${new Date().toISOString().split('T')[0]}.pdf`
    });

    logTest('Test F.1: Report Created', !!report._id, `Report ID: ${report.reportId}`);
    logTest('Test F.2: Metadata Stored', report.reportMetadata.totalEvidence === 1, 'Metadata: 1 evidence');
    logTest('Test F.3: Safe Filename', report.pdfFileName.includes('.pdf'), 'PDF filename format correct');

    const retrievedReport = await Report.findById(report._id);

    logTest(
      'Test F.4: Report Persisted',
      retrievedReport.investigationId === testInv.investigationId,
      'Report retrieved successfully'
    );

    logTest(
      'Test F.5: Metadata Consistent',
      retrievedReport.reportMetadata.investigationName === testInv.name,
      'Metadata consistent'
    );

    // ========== TEST G: Relationship Integrity ==========
    console.log('\nTEST G: Relationship Integrity\n');

    const invCount = await Investigation.countDocuments({ investigationId: testInv.investigationId });
    const evCount = await Evidence.countDocuments({ investigationId: testInv.investigationId });
    const anaCount = await Analysis.countDocuments({ investigationId: testInv.investigationId });
    const repCount = await Report.countDocuments({ investigationId: testInv.investigationId });

    logTest('Test G.1: Investigation Relationship', invCount === 1, `Count: ${invCount}`);
    logTest('Test G.2: Evidence Relationship', evCount === 1, `Count: ${evCount}`);
    logTest('Test G.3: Analysis Relationship', anaCount === 1, `Count: ${anaCount}`);
    logTest('Test G.4: Report Relationship', repCount === 1, `Count: ${repCount}`);

    // ========== TEST H: Data Immutability After Archive ==========
    console.log('\nTESH H: Data Immutability After Archive\n');

    const finalCheck = await Evidence.findById(evidenceA._id);

    logTest(
      'Test H.1: Content Immutable After Archive',
      finalCheck.content === originalContent && finalCheck.analysisStatus === 'Archived',
      'Content unchanged after archiving'
    );

    logTest(
      'Test H.2: Hash Integrity Maintained',
      finalCheck.contentHash === originalHash,
      'Hash integrity maintained'
    );

    // Final Summary
    console.log('\n' + '='.repeat(70));
    console.log('INTEGRITY TEST SUMMARY');
    console.log('='.repeat(70));
    console.log('✓ Evidence creation with SHA-256');
    console.log('✓ Hash verification');
    console.log('✓ Archive functionality');
    console.log('✓ Archive preservation (content + hash + timestamp)');
    console.log('✓ Analysis data consistency');
    console.log('✓ Report metadata consistency');
    console.log('✓ Relationship integrity');
    console.log('✓ Data immutability');

    console.log(`\nTotal Tests: ${testResults.passed + testResults.failed}`);
    console.log(`\x1b[32mPassed: ${testResults.passed}\x1b[0m`);
    console.log(`\x1b[31mFailed: ${testResults.failed}\x1b[0m`);
    console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
    console.log('='.repeat(70) + '\n');

    await mongoose.disconnect();
    process.exit(testResults.failed > 0 ? 1 : 0);

  } catch (error) {
    console.error('\n✗ TEST FAILED:');
    console.error(`Error: ${error.message}\n`);
    process.exit(1);
  }
}

runIntegrityTests();
