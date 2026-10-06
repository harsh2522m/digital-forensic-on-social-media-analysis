/**
 * Seed Script for Digital Forensic Analysis
 * 
 * This script loads sample demonstration data into MongoDB.
 * 
 * Usage:
 *   node utils/seed.js
 * 
 * IMPORTANT: All data is SYNTHETIC/DEMO data for testing purposes only.
 * This does NOT represent real evidence or real events.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Investigation = require('../models/Investigation');
const Evidence = require('../models/Evidence');
const hashService = require('../services/hashService');
const sampleData = require('../../dataset/sample-evidence.json');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/digital-forensics';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✓ MongoDB connected for seeding');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    console.log('\n=== Digital Forensic Analysis - Sample Data Seeding ===\n');

    // Create sample investigation
    const investigation = new Investigation({
      name: 'Demo Investigation - Phase 2 Testing',
      target: 'Fictional Scenario',
      description: 'This is a demonstration investigation with sample evidence. All data is synthetic and created for testing purposes only.',
      keywords: ['demo', 'testing', 'phase-2', 'evidence-management'],
      startDate: new Date('2026-09-01'),
      endDate: new Date('2026-10-03'),
      investigator: 'Demo Investigator',
      status: 'active',
      notes: 'Synthetic demo data for Phase 2 testing',
    });

    await investigation.save();
    console.log(`✓ Created investigation: ${investigation.investigationId}`);

    // Create evidence items from sample data
    let evidenceCount = 0;
    for (const sample of sampleData) {
      const evidence = new Evidence({
        investigationId: investigation.investigationId,
        sourceName: sample.sourceName,
        sourceType: sample.sourceType,
        sourceUrl: sample.sourceUrl,
        author: sample.author,
        publicationDate: new Date(sample.publicationDate),
        content: sample.content,
        sha256Hash: hashService.generateHash(sample.content),
        notes: sample.notes,
        analysisStatus: 'Pending',
      });

      await evidence.save();
      console.log(`✓ Created evidence: ${evidence.evidenceId}`);
      evidenceCount++;
    }

    console.log(`\n✓ Seeding complete!`);
    console.log(`  - 1 investigation created`);
    console.log(`  - ${evidenceCount} evidence items created`);
    console.log(`\nInvestigation ID: ${investigation.investigationId}`);
    console.log('Investigation Name: Demo Investigation - Phase 2 Testing');
    console.log('\nYou can now open this investigation in the web interface.');
    console.log('IMPORTANT: This is DEMO data. All evidence content is fictional.\n');
  } catch (error) {
    console.error('✗ Error seeding data:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed\n');
  }
};

connectDB().then(() => seedData());
