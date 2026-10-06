#!/usr/bin/env node

/**
 * Demo Data Loader
 * Phase 5 - Loads synthetic demo data for testing
 * 
 * ⚠️ WARNING: DEMO DATA ONLY
 * All evidence and findings are SYNTHETIC.
 * This data is for testing and demonstration purposes only.
 * NOT REAL FORENSIC EVIDENCE.
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

const Investigation = require('./models/Investigation');
const Evidence = require('./models/Evidence');

const MONGODB_URI = process.env.MONGODB_URI;

const DEMO_EVIDENCE = [
  {
    content: '[DEMO DATA] News article about technology industry trends and market analysis',
    sourceName: 'Tech News Daily',
    sourceType: 'News Article',
    url: 'https://example.com/tech-news-1',
    publicationDate: '2024-01-10'
  },
  {
    content: '[DEMO DATA] Blog post discussing social media platform policies and content moderation',
    sourceName: 'Digital Policy Blog',
    sourceType: 'Blog Post',
    url: 'https://example.com/blog/policies',
    publicationDate: '2024-01-12'
  },
  {
    content: '[DEMO DATA] Forum discussion about privacy concerns and data protection regulations',
    sourceName: 'Privacy Forum',
    sourceType: 'Other Public Web Source',
    url: 'https://example.com/forum/privacy',
    publicationDate: '2024-01-14'
  },
  {
    content: '[DEMO DATA] Article analyzing emerging technologies and their societal implications',
    sourceName: 'Technology Review',
    sourceType: 'News Article',
    url: 'https://example.com/tech-review',
    publicationDate: '2024-01-15'
  },
  {
    content: '[DEMO DATA] Opinion piece on digital security best practices and recommendations',
    sourceName: 'Security Expert Blog',
    sourceType: 'Blog Post',
    url: 'https://example.com/security-tips',
    publicationDate: '2024-01-16'
  },
  {
    content: '[DEMO DATA] Discussion thread about platform transparency and algorithmic accountability',
    sourceName: 'Tech Discussion Forum',
    sourceType: 'Other Public Web Source',
    url: 'https://example.com/discussions/transparency',
    publicationDate: '2024-01-17'
  }
];

async function loadDemoData() {
  console.log('\n' + '='.repeat(70));
  console.log('DEMO DATA LOADER');
  console.log('='.repeat(70));
  console.log('\n⚠️  WARNING: LOADING SYNTHETIC DEMO DATA');
  console.log('All content is fictional and for testing purposes only.\n');

  try {
    // Connect to MongoDB
    console.log(`Connecting to MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    });
    console.log('✓ Connected\n');

    // Create Investigation
    console.log('Creating demo investigation...');
    const investigation = await Investigation.create({
      investigationId: 'demo_' + Date.now(),
      name: '📋 DEMO: Technology Industry Analysis (Synthetic Data)',
      target: 'Fictional Tech Corp (Demo Only)',
      description: '⚠️ DEMO DATA ONLY - Synthetic evidence for testing Phase 5 security and persistence. Contains no real evidence.',
      investigator: 'Demo System',
      keywords: ['demo', 'synthetic', 'testing', 'phase5'],
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-01-31'),
      status: 'active'
    });
    console.log(`✓ Investigation created: ${investigation.investigationId}\n`);

    // Create Evidence
    console.log('Creating demo evidence...');
    const createdEvidence = [];

    for (const [index, evidenceData] of DEMO_EVIDENCE.entries()) {
      const contentWithLabel = `🔬 [SYNTHETIC - DEMO PURPOSE ONLY]\n\n${evidenceData.content}`;
      const hash = crypto.createHash('sha256').update(contentWithLabel).digest('hex');

      const evidence = await Evidence.create({
        investigationId: investigation.investigationId,
        content: contentWithLabel,
        sourceName: evidenceData.sourceName,
        sourceType: evidenceData.sourceType,
        publicationDate: new Date(evidenceData.publicationDate),
        url: evidenceData.url,
        contentHash: hash,
        analysisStatus: 'Pending',
        archivedAt: null
      });

      createdEvidence.push(evidence);
      console.log(`  ✓ Evidence ${index + 1}: ${evidence.evidenceId} (${evidenceData.sourceName})`);
    }

    console.log(`\n✓ ${createdEvidence.length} evidence items created\n`);

    // Summary
    console.log('='.repeat(70));
    console.log('DEMO DATA LOADED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log(`\nInvestigation ID: ${investigation.investigationId}`);
    console.log(`Investigation Name: ${investigation.name}`);
    console.log(`Evidence Count: ${createdEvidence.length}`);

    console.log('\n📝 NEXT STEPS:');
    console.log('1. Open the web application at http://localhost:5173');
    console.log('2. You should see the demo investigation in the investigations list');
    console.log(`3. Search for: "${investigation.investigationId}"`);
    console.log('4. Click on the investigation to open it');
    console.log('5. Review the Evidence tab to see the demo evidence');
    console.log('6. Go to Analysis tab and click "Analyze Investigation"');
    console.log('7. View the Report tab to generate a forensic report');

    console.log('\n⚠️  REMEMBER:');
    console.log('- This is SYNTHETIC/DEMO DATA for testing purposes');
    console.log('- Content is fictional and does not represent real evidence');
    console.log('- Used for Phase 5 security and persistence verification');
    console.log('- Not intended as real forensic analysis\n');

    console.log('='.repeat(70) + '\n');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n✗ FAILED TO LOAD DEMO DATA:');
    console.error(`Error: ${error.message}\n`);
    console.log('Troubleshooting:');
    console.log('1. Ensure MongoDB is running (local or Atlas accessible)');
    console.log('2. Verify MONGODB_URI in .env is correct');
    console.log('3. Check network connectivity for MongoDB Atlas');
    console.log('4. For local MongoDB: mongod should be running\n');
    process.exit(1);
  }
}

loadDemoData();
