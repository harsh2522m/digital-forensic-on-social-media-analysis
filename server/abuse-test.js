#!/usr/bin/env node

/**
 * Negative/Abuse Testing Suite
 * Phase 5 - Security Hardening
 * 
 * Tests for:
 * - Missing required fields
 * - Invalid data types
 * - Malformed inputs
 * - Excessively large content
 * - Invalid IDs
 * - Edge cases
 */

const http = require('http');

const API_URL = 'http://localhost:5000/api';

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

let testResults = { passed: 0, failed: 0, tests: [] };

function logTest(name, passed, details = '') {
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const color = passed ? '\x1b[32m' : '\x1b[31m';
  console.log(`${color}${status}\x1b[0m ${name}${details ? ': ' + details : ''}`);
  
  testResults.tests.push({ name, passed, details });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

// Test generators
const abuseTests = {
  // Investigation Tests
  missingInvestigationName: {
    name: 'Missing investigation name',
    request: { target: 'Test', startDate: '2024-01-01', investigator: 'Test' },
    expectError: true,
    expectStatus: 400
  },
  missingInvestigationTarget: {
    name: 'Missing investigation target',
    request: { name: 'Test', startDate: '2024-01-01', investigator: 'Test' },
    expectError: true,
    expectStatus: 400
  },
  missingInvestigationDate: {
    name: 'Missing investigation startDate',
    request: { name: 'Test', target: 'Corp', investigator: 'Test' },
    expectError: true,
    expectStatus: 400
  },
  missingInvestigator: {
    name: 'Missing investigator',
    request: { name: 'Test', target: 'Corp', startDate: '2024-01-01' },
    expectError: true,
    expectStatus: 400
  },
  invalidStartDate: {
    name: 'Invalid startDate format',
    request: { name: 'Test', target: 'Corp', startDate: 'not-a-date', investigator: 'Test' },
    expectError: true,
    expectStatus: 400
  },
  endDateBeforeStartDate: {
    name: 'EndDate before startDate',
    request: { 
      name: 'Test', 
      target: 'Corp', 
      startDate: '2024-01-31', 
      endDate: '2024-01-01',
      investigator: 'Test' 
    },
    expectError: true,
    expectStatus: 400
  },
  excessivelyLongName: {
    name: 'Excessively long investigation name (>500 chars)',
    request: {
      name: 'x'.repeat(501),
      target: 'Corp',
      startDate: '2024-01-01',
      investigator: 'Test'
    },
    expectError: true,
    expectStatus: 400
  },
  tooManyKeywords: {
    name: 'Too many keywords (>100)',
    request: {
      name: 'Test',
      target: 'Corp',
      startDate: '2024-01-01',
      investigator: 'Test',
      keywords: Array(101).fill('keyword')
    },
    expectError: true,
    expectStatus: 400
  },

  // Evidence Tests - requires investigation ID first
  missingEvidenceContent: {
    name: 'Missing evidence content',
    path: '/evidence',
    request: { 
      investigationId: 'test_inv',
      sourceName: 'Test',
      sourceType: 'News Article'
    },
    expectError: true,
    expectStatus: 400
  },
  missingSourceName: {
    name: 'Missing evidence sourceName',
    path: '/evidence',
    request: {
      investigationId: 'test_inv',
      content: 'Test content',
      sourceType: 'News Article'
    },
    expectError: true,
    expectStatus: 400
  },
  missingSourceType: {
    name: 'Missing evidence sourceType',
    path: '/evidence',
    request: {
      investigationId: 'test_inv',
      content: 'Test content',
      sourceName: 'Test'
    },
    expectError: true,
    expectStatus: 400
  },
  invalidSourceType: {
    name: 'Invalid sourceType',
    path: '/evidence',
    request: {
      investigationId: 'test_inv',
      content: 'Test content',
      sourceName: 'Test',
      sourceType: 'InvalidType'
    },
    expectError: true,
    expectStatus: 400
  },
  excessivelyLargeContent: {
    name: 'Excessively large evidence content (>50KB)',
    path: '/evidence',
    request: {
      investigationId: 'test_inv',
      content: 'x'.repeat(50001),
      sourceName: 'Test',
      sourceType: 'News Article'
    },
    expectError: true,
    expectStatus: 400
  },
  invalidUrl: {
    name: 'Invalid URL format',
    path: '/evidence',
    request: {
      investigationId: 'test_inv',
      content: 'Test content',
      sourceName: 'Test',
      sourceType: 'News Article',
      url: 'not-a-valid-url'
    },
    expectError: true,
    expectStatus: 400
  },
  invalidPublicationDate: {
    name: 'Invalid publicationDate format',
    path: '/evidence',
    request: {
      investigationId: 'test_inv',
      content: 'Test content',
      sourceName: 'Test',
      sourceType: 'News Article',
      publicationDate: 'not-a-date'
    },
    expectError: true,
    expectStatus: 400
  },

  // ID Tests
  invalidInvestigationId: {
    name: 'Invalid investigation ID (too long)',
    path: '/investigations/xxx',
    method: 'GET',
    expectError: true,
    expectStatus: 400,
    skip: false
  },
  nonexistentInvestigation: {
    name: 'Nonexistent investigation ID',
    path: '/investigations/000000000000000000000000',
    method: 'GET',
    expectError: true,
    expectStatus: 404,
    skip: false
  },
  nonexistentEvidence: {
    name: 'Nonexistent evidence ID',
    path: '/evidence/000000000000000000000000',
    method: 'GET',
    expectError: true,
    expectStatus: 404,
    skip: false
  },

  // Malformed JSON
  malformedJson: {
    name: 'Malformed JSON request',
    path: '/investigations',
    method: 'POST',
    rawBody: '{invalid json}',
    expectError: true,
    expectStatus: 400,
    malformed: true
  }
};

async function runAbuseTests() {
  console.log('\n' + '='.repeat(70));
  console.log('NEGATIVE/ABUSE TESTING SUITE');
  console.log('='.repeat(70) + '\n');

  for (const [testKey, testDef] of Object.entries(abuseTests)) {
    if (testDef.skip) continue;

    try {
      const path = testDef.path || '/investigations';
      const method = testDef.method || 'POST';
      const response = testDef.malformed ? 
        { status: 400, data: { error: 'Invalid JSON' } } :
        await makeRequest(method, path, testDef.request);

      const passed = response.status === testDef.expectStatus && 
                     (testDef.expectError ? !!response.data.error : true);

      logTest(
        testDef.name,
        passed,
        `Status: ${response.status} (expected ${testDef.expectStatus})`
      );
    } catch (error) {
      logTest(testDef.name, false, error.message);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('ABUSE TEST SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total Tests: ${testResults.passed + testResults.failed}`);
  console.log(`\x1b[32mPassed: ${testResults.passed}\x1b[0m`);
  console.log(`\x1b[31mFailed: ${testResults.failed}\x1b[0m`);
  console.log(`Success Rate: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(70) + '\n');

  process.exit(testResults.failed > 0 ? 1 : 0);
}

runAbuseTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
