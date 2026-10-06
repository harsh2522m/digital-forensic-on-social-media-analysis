#!/usr/bin/env node

/**
 * Integration Test Script for Phases 1-3
 * Tests complete workflow: Investigation CRUD, Evidence Management, and Analysis
 */

const http = require('http');
const crypto = require('crypto');

const API_URL = 'http://localhost:5000/api';

// HTTP helper function
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Helper function to log test results
function logTest(name, passed, details = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const color = passed ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${status}\x1b[0m ${name}${details ? ': ' + details : ''}`);
  
  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

// Helper to calculate SHA-256
function calculateSHA256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

// Test 1: Create Investigation
async function testCreateInvestigation() {
  try {
    const response = await makeRequest('POST', '/investigations', {
      name: 'Integration Test Investigation',
      target: 'TestTarget Corp',
      description: 'Integration test for Phases 1-3',
      investigator: 'Test Tester',
      keywords: ['test', 'integration', 'verification'],
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    });

    if (response.data.investigation && response.data.investigation.investigationId) {
      logTest('Test 1: Create Investigation', true, `ID: ${response.data.investigation.investigationId}`);
      return response.data.investigation.investigationId;
    } else {
      logTest('Test 1: Create Investigation', false, 'No investigation ID in response');
      return null;
    }
  } catch (error) {
    logTest('Test 1: Create Investigation', false, error.message);
    return null;
  }
}

// Test 2: Add 5 Evidence Records
async function testAddEvidence(investigationId) {
  const evidenceIds = [];
  const evidenceData = [
    {
      content: 'TestTarget Corp announced a major data breach affecting thousands of users.',
      sourceName: 'Tech News Daily',
      sourceType: 'News Article',
      url: 'https://technewsdaily.com/article1'
    },
    {
      content: 'Regulatory authorities are investigating TestTarget Corp for security compliance violations.',
      sourceName: 'Privacy Watch',
      sourceType: 'Blog Post',
      url: 'https://privacywatch.com/article2'
    },
    {
      content: 'TestTarget Corp implements new security measures following recent incident.',
      sourceName: 'Business Daily',
      sourceType: 'News Article',
      url: 'https://businessdaily.com/article3'
    },
    {
      content: 'Customer testimonials criticize TestTarget Corp customer service response.',
      sourceName: 'Social Media',
      sourceType: 'Twitter',
      url: 'https://twitter.com/complaints'
    },
    {
      content: 'TestTarget Corp stock price drops 15% amid security concerns and negative press.',
      sourceName: 'Financial Times',
      sourceType: 'News Article',
      url: 'https://ft.com/market'
    }
  ];

  for (let i = 0; i < evidenceData.length; i++) {
    try {
      const response = await makeRequest('POST', '/evidence', {
        investigationId,
        content: evidenceData[i].content,
        sourceName: evidenceData[i].sourceName,
        sourceType: evidenceData[i].sourceType,
        publicationDate: new Date(2024, 0, 15 + i).toISOString().split('T')[0],
        url: evidenceData[i].url
      });

      if (response.data.evidence && response.data.evidence._id) {
        evidenceIds.push({
          id: response.data.evidence._id,
          evidenceId: response.data.evidence.evidenceId,
          content: evidenceData[i].content,
          hash: response.data.evidence.contentHash
        });
        logTest(`Test 2.${i + 1}: Add Evidence Record ${i + 1}`, true, `ID: ${response.data.evidence._id}`);
      } else {
        logTest(`Test 2.${i + 1}: Add Evidence Record ${i + 1}`, false, 'No evidence ID in response');
      }
    } catch (error) {
      logTest(`Test 2.${i + 1}: Add Evidence Record ${i + 1}`, false, error.message);
    }
  }

  return evidenceIds;
}

// Test 3: Verify Evidence Fields
async function testVerifyEvidenceFields(investigationId, evidenceIds) {
  let allValid = true;
  
  for (let i = 0; i < Math.min(evidenceIds.length, 3); i++) {
    try {
      const response = await makeRequest('GET', `/evidence/${evidenceIds[i].id}`);
      const evidence = response.data.evidence;

      const hasId = !!evidence._id;
      const hasTimestamp = !!evidence.createdAt;
      const hasHash = !!evidence.contentHash;
      const hasEvidenceId = !!evidence.evidenceId;

      const valid = hasId && hasTimestamp && hasHash && hasEvidenceId;
      logTest(
        `Test 3.${i + 1}: Verify Evidence ${i + 1} Fields`,
        valid,
        `ID: ${hasId} | TS: ${hasTimestamp} | Hash: ${hasHash} | EvidID: ${hasEvidenceId}`
      );

      if (!valid) allValid = false;
    } catch (error) {
      logTest(`Test 3.${i + 1}: Verify Evidence ${i + 1} Fields`, false, error.message);
      allValid = false;
    }
  }

  return allValid;
}

// Test 4: Validate SHA-256 Hashes
async function testValidateSHA256(evidenceIds) {
  let allValid = true;

  for (let i = 0; i < Math.min(evidenceIds.length, 2); i++) {
    try {
      const response = await makeRequest('GET', `/evidence/${evidenceIds[i].id}`);
      const evidence = response.data.evidence;

      const calculatedHash = calculateSHA256(evidence.content);
      const storedHash = evidence.contentHash;

      const valid = calculatedHash === storedHash;
      logTest(
        `Test 4.${i + 1}: Validate SHA-256 Hash ${i + 1}`,
        valid,
        valid ? 'Hash matches' : `Mismatch: calc=${calculatedHash.substring(0, 8)}... vs stored=${storedHash.substring(0, 8)}...`
      );

      if (!valid) allValid = false;
    } catch (error) {
      logTest(`Test 4.${i + 1}: Validate SHA-256 Hash ${i + 1}`, false, error.message);
      allValid = false;
    }
  }

  return allValid;
}

// Test 5: Run Analysis
async function testRunAnalysis(investigationId) {
  try {
    const response = await makeRequest('POST', `/analysis/${investigationId}`);
    
    if (response.data.analyzed !== undefined && response.data.analyzed > 0) {
      logTest('Test 5: Run Analysis', true, `Analyzed ${response.data.analyzed} items`);
      return response.data;
    } else {
      logTest('Test 5: Run Analysis', false, `analyzed=${response.data.analyzed}, failed=${response.data.failed}`);
      return null;
    }
  } catch (error) {
    logTest('Test 5: Run Analysis', false, error.message);
    return null;
  }
}

// Test 6: Verify Analysis Results
async function testVerifyAnalysisResults(investigationId) {
  try {
    const response = await makeRequest('GET', `/analysis/${investigationId}`);
    const analysis = response.data;

    const hasSummary = !!analysis.summary;
    const hasFindings = Array.isArray(analysis.findings) && analysis.findings.length > 0;
    const hasTimeline = !!analysis.timeline;
    const hasEvidence = Array.isArray(analysis.evidence) && analysis.evidence.length > 0;

    let allValid = hasSummary && hasFindings && hasTimeline && hasEvidence;

    logTest('Test 6.1: Analysis Results Exist', allValid, `Summary: ${hasSummary} | Findings: ${hasFindings} | Timeline: ${hasTimeline} | Evidence: ${hasEvidence}`);

    // Check individual evidence has analysis fields
    if (hasEvidence) {
      let evidenceValid = true;
      for (let i = 0; i < Math.min(3, analysis.evidence.length); i++) {
        const ev = analysis.evidence[i];
        const hasSentiment = !!ev.sentimentLabel && ev.sentimentScore !== undefined;
        const hasKeywords = Array.isArray(ev.extractedKeywords) && ev.extractedKeywords.length > 0;
        const hasTopics = Array.isArray(ev.topics) && ev.topics.length > 0;
        const hasRelevance = ev.relevanceScore !== undefined && ev.relevanceLevel;

        if (!(hasSentiment && hasKeywords && hasTopics && hasRelevance)) {
          evidenceValid = false;
          logTest(`Test 6.2.${i + 1}: Evidence ${i + 1} Analysis Fields`, false, 
            `Sentiment: ${hasSentiment} | Keywords: ${hasKeywords} | Topics: ${hasTopics} | Relevance: ${hasRelevance}`);
        }
      }
      if (evidenceValid) {
        logTest('Test 6.2: Evidence Analysis Fields', true, 'All fields populated');
      }
    }

    return allValid;
  } catch (error) {
    logTest('Test 6: Verify Analysis Results', false, error.message);
    return false;
  }
}

// Test 7: Verify Original Content Unchanged
async function testOriginalContentPreserved(evidenceIds) {
  let allValid = true;

  for (let i = 0; i < Math.min(2, evidenceIds.length); i++) {
    try {
      const response = await makeRequest('GET', `/evidence/${evidenceIds[i].id}`);
      const evidence = response.data.evidence;

      const contentMatches = evidence.content === evidenceIds[i].content;
      logTest(
        `Test 7.${i + 1}: Original Content Preserved ${i + 1}`,
        contentMatches,
        contentMatches ? 'Content unchanged' : 'Content was modified'
      );

      if (!contentMatches) allValid = false;
    } catch (error) {
      logTest(`Test 7.${i + 1}: Original Content Preserved ${i + 1}`, false, error.message);
      allValid = false;
    }
  }

  return allValid;
}

// Test 8: Test Investigation CRUD
async function testInvestigationCRUD() {
  try {
    // CREATE (already tested)
    // READ
    const listResponse = await makeRequest('GET', '/investigations');
    const hasInvestigations = Array.isArray(listResponse.data.investigations) && listResponse.data.investigations.length > 0;
    logTest('Test 8.1: Read Investigations (List)', hasInvestigations, `Found ${listResponse.data.investigations.length} investigations`);

    // UPDATE
    if (hasInvestigations) {
      const inv = listResponse.data.investigations[0];
      const updateResponse = await makeRequest('PUT', `/investigations/${inv._id}`, {
        description: 'Updated description for testing'
      });
      const updated = updateResponse.data.investigation.description === 'Updated description for testing';
      logTest('Test 8.2: Update Investigation', updated, 'Description updated');
    }

    return hasInvestigations;
  } catch (error) {
    logTest('Test 8: Investigation CRUD', false, error.message);
    return false;
  }
}

// Test 9: Test Timeline Endpoint
async function testTimelineEndpoint(investigationId) {
  try {
    const response = await makeRequest('GET', `/analysis/${investigationId}/timeline`);
    const timeline = response.data.timeline;

    const hasData = Array.isArray(timeline.data) && timeline.data.length > 0;
    const hasTrends = Array.isArray(timeline.trends);
    const hasPeaks = Array.isArray(timeline.peakPeriods);

    const valid = hasData && hasTrends && hasPeaks;
    logTest('Test 9: Timeline Endpoint', valid, `Data: ${hasData} | Trends: ${hasTrends} | Peaks: ${hasPeaks}`);

    return valid;
  } catch (error) {
    logTest('Test 9: Timeline Endpoint', false, error.message);
    return false;
  }
}

// Test 11: Test Findings Endpoint
async function testFindingsEndpoint(investigationId) {
  try {
    const response = await makeRequest('GET', `/analysis/${investigationId}/findings`);
    const findings = response.data.findings;

    const isArray = Array.isArray(findings);
    const hasFinding = isArray && findings.length > 0;
    const hasValidStructure = hasFinding && findings[0].id && findings[0].severity;

    const valid = isArray && hasFinding && hasValidStructure;
    logTest('Test 10: Findings Endpoint', valid, `Findings: ${findings.length} items, Valid: ${hasValidStructure}`);

    return valid;
  } catch (error) {
    logTest('Test 10: Findings Endpoint', false, error.message);
    return false;
  }
}

// ===== PHASE 4 TESTS =====

// Test 11: Generate Report
async function testGenerateReport(investigationId) {
  try {
    const response = await makeRequest('POST', `/reports/${investigationId}`);

    if (response.data.reportId && response.data.pdfFileName) {
      logTest('Test 11: Generate Report', true, `Report ID: ${response.data.reportId}`);
      return response.data.reportId;
    } else {
      logTest('Test 11: Generate Report', false, 'No report ID in response');
      return null;
    }
  } catch (error) {
    logTest('Test 11: Generate Report', false, error.message);
    return null;
  }
}

// Test 13: Get Report Status
async function testGetReportStatus(investigationId) {
  try {
    const response = await makeRequest('GET', `/reports/${investigationId}`);
    const report = response.data;

    const hasReport = !!report.latestReport;
    const hasEvidence = report.evidence && report.evidence.total > 0;
    const hasAnalysis = report.analysis;

    const valid = hasReport && hasEvidence && hasAnalysis;
    logTest('Test 12: Get Report Status', valid, `Report: ${hasReport} | Evidence: ${hasEvidence} | Analysis: ${hasAnalysis}`);

    return valid;
  } catch (error) {
    logTest('Test 12: Get Report Status', false, error.message);
    return false;
  }
}

// Test 14: Download Report PDF
async function testDownloadReportPDF(investigationId, reportId) {
  try {
    const response = await makeRequest('GET', `/reports/${investigationId}/${reportId}`);

    // Check if response contains PDF data
    const isPDF = response.data && response.data.length > 0;
    logTest('Test 13: Download Report PDF', isPDF, `PDF size: ${response.data ? response.data.length : 0} bytes`);

    return isPDF;
  } catch (error) {
    logTest('Test 13: Download Report PDF', false, error.message);
    return false;
  }
}

// Test 15: Verify Report Contains Evidence IDs
async function testReportEvidenceIDs(investigationId) {
  try {
    const response = await makeRequest('GET', `/reports/${investigationId}`);
    const report = response.data;

    if (!report.latestReport) {
      logTest('Test 14: Report Evidence IDs', false, 'No report available');
      return false;
    }

    // We can't directly inspect PDF content, so we verify evidence exists
    const evidenceCount = report.evidence?.total || 0;
    const hasEvidenceData = evidenceCount > 0;

    logTest('Test 14: Report Evidence IDs', hasEvidenceData, `Evidence in report: ${evidenceCount}`);

    return hasEvidenceData;
  } catch (error) {
    logTest('Test 14: Report Evidence IDs', false, error.message);
    return false;
  }
}

// Test 16: Verify Report Contains Analysis Data
async function testReportAnalysisData(investigationId) {
  try {
    const response = await makeRequest('GET', `/reports/${investigationId}`);
    const report = response.data;

    const hasAnalysis = !!report.analysis;
    const hasSentiment = report.analysis?.sentiment;
    const hasKeywords = report.analysis?.topKeywords && report.analysis.topKeywords.length > 0;
    const hasTopics = report.analysis?.topTopics && report.analysis.topTopics.length > 0;

    const valid = hasAnalysis && hasSentiment && hasKeywords && hasTopics;
    logTest('Test 15: Report Analysis Data', valid, `Sentiment: ${hasSentiment} | Keywords: ${hasKeywords} | Topics: ${hasTopics}`);

    return valid;
  } catch (error) {
    logTest('Test 15: Report Analysis Data', false, error.message);
    return false;
  }
}

// Test 17: Verify Report Timestamps
async function testReportTimestamps(investigationId) {
  try {
    const response = await makeRequest('GET', `/reports/${investigationId}`);
    const report = response.data;

    if (!report.latestReport) {
      logTest('Test 16: Report Timestamps', false, 'No report available');
      return false;
    }

    const hasGeneratedAt = !!report.latestReport.generatedAt;
    const isValidDate = new Date(report.latestReport.generatedAt).getTime() > 0;

    const valid = hasGeneratedAt && isValidDate;
    logTest('Test 16: Report Timestamps', valid, `Generated at: ${report.latestReport.generatedAt}`);

    return valid;
  } catch (error) {
    logTest('Test 16: Report Timestamps', false, error.message);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('PHASE 1-3 INTEGRATION TEST');
  console.log('='.repeat(60) + '\n');

  // Test sequence
  console.log('Step 1: Investigation Management (Phase 1)');
  const investigationId = await testCreateInvestigation();
  if (!investigationId) {
    console.log('\n⚠ Cannot proceed - investigation creation failed');
    return;
  }

  console.log('\nStep 2: Evidence Management (Phase 2)');
  const evidenceIds = await testAddEvidence(investigationId);
  if (evidenceIds.length === 0) {
    console.log('\n⚠ Cannot proceed - evidence creation failed');
    return;
  }

  await testVerifyEvidenceFields(investigationId, evidenceIds);
  await testValidateSHA256(evidenceIds);

  console.log('\nStep 3: Analysis Engine (Phase 3)');
  const analysisResult = await testRunAnalysis(investigationId);
  if (!analysisResult) {
    console.log('\n⚠ Analysis failed - skipping verification');
  } else {
    await testVerifyAnalysisResults(investigationId);
    await testOriginalContentPreserved(evidenceIds);
    await testTimelineEndpoint(investigationId);
    await testFindingsEndpoint(investigationId);
  }

  console.log('\nStep 4: Phase 1 CRUD Operations');
  await testInvestigationCRUD();

  console.log('\nStep 5: Phase 4 Report Generation');
  const reportId = await testGenerateReport(investigationId);
  if (reportId) {
    await testGetReportStatus(investigationId);
    await testDownloadReportPDF(investigationId, reportId);
    await testReportEvidenceIDs(investigationId);
    await testReportAnalysisData(investigationId);
    await testReportTimestamps(investigationId);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`\x1b[32mPassed: ${testResults.passed}\x1b[0m`);
  console.log(`\x1b[31mFailed: ${testResults.failed}\x1b[0m`);
  console.log(`Success Rate: ${(testResults.passed / (testResults.passed + testResults.failed) * 100).toFixed(1)}%`);
  console.log('='.repeat(60) + '\n');

  // Exit with code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
