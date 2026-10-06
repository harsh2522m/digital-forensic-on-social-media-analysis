/**
 * Test Server - In-Memory Mode for Integration Testing
 * Minimal Express server with in-memory data storage for testing
 * This allows testing without MongoDB dependency
 */

const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json({ limit: '50mb' }));

// In-memory stores
const investigations = [];
const evidence = [];

// Helper: Generate IDs
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

function calculateSHA256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Test server running in memory mode',
    phase: 'Integration Test'
  });
});

// Investigations API
app.post('/api/investigations', (req, res) => {
  try {
    const { name, target, description, keywords, startDate, endDate, investigator } = req.body;
    
    if (!name || !target || !startDate || !investigator) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const investigation = {
      _id: generateId(),
      investigationId: 'inv_' + generateId(),
      name,
      target,
      description,
      keywords: keywords || [],
      startDate,
      endDate,
      investigator,
      status: 'Active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    investigations.push(investigation);
    
    res.status(201).json({
      message: 'Investigation created successfully',
      investigation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/investigations', (req, res) => {
  res.json({
    count: investigations.length,
    investigations
  });
});

app.get('/api/investigations/:id', (req, res) => {
  const inv = investigations.find(i => i._id === req.params.id || i.investigationId === req.params.id);
  if (!inv) return res.status(404).json({ error: 'Not found' });
  res.json({ investigation: inv });
});

app.put('/api/investigations/:id', (req, res) => {
  const inv = investigations.find(i => i._id === req.params.id || i.investigationId === req.params.id);
  if (!inv) return res.status(404).json({ error: 'Not found' });
  
  Object.assign(inv, req.body, { updatedAt: new Date() });
  res.json({ message: 'Updated', investigation: inv });
});

// Evidence API
app.post('/api/evidence', (req, res) => {
  try {
    const { investigationId, content, sourceName, sourceType, publicationDate, url } = req.body;
    
    if (!investigationId || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ev = {
      _id: generateId(),
      evidenceId: 'evid_' + generateId(),
      investigationId,
      content,
      sourceName,
      sourceType,
      publicationDate,
      url,
      contentHash: calculateSHA256(content),
      analysisStatus: 'Pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      // Analysis fields
      sentimentLabel: null,
      sentimentScore: null,
      extractedKeywords: [],
      topics: [],
      relevanceScore: null,
      relevanceLevel: null,
      analyzedAt: null,
      analysisVersion: null
    };

    evidence.push(ev);
    
    res.status(201).json({
      message: 'Evidence created',
      evidence: ev
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/evidence/:id', (req, res) => {
  const ev = evidence.find(e => e._id === req.params.id || e.evidenceId === req.params.id);
  if (!ev) return res.status(404).json({ error: 'Not found' });
  res.json({ evidence: ev });
});

app.get('/api/evidence', (req, res) => {
  const { investigationId } = req.query;
  const items = investigationId 
    ? evidence.filter(e => e.investigationId === investigationId)
    : evidence;
  res.json({ evidence: items });
});

// Analysis API - Minimal implementation
app.post('/api/analysis/:investigationId', (req, res) => {
  try {
    const invId = req.params.investigationId;
    const inv = investigations.find(i => i._id === invId || i.investigationId === invId);
    if (!inv) return res.status(404).json({ error: 'Investigation not found' });

    // Look for evidence using the investigation's investigationId or _id
    let evArray = evidence.filter(e => e.investigationId === inv.investigationId || e.investigationId === inv._id);
    
    if (evArray.length === 0) {
      return res.status(400).json({ error: 'No evidence found' });
    }

    // Perform analysis on each evidence
    const analysisServices = {
      sentiment: (text) => {
        const negWords = ['bad', 'negative', 'poor', 'failed', 'issue', 'problem', 'worst', 'terrible', 'breach', 'violation', 'complaint'];
        const posWords = ['good', 'positive', 'great', 'excellent', 'resolved', 'improved', 'best', 'fantastic', 'announced', 'investment'];
        
        const textLower = text.toLowerCase();
        const negCount = negWords.filter(w => textLower.includes(w)).length;
        const posCount = posWords.filter(w => textLower.includes(w)).length;
        
        const score = (posCount - negCount) / Math.max(posCount + negCount, 1);
        let label = 'Neutral';
        if (score > 0.1) label = 'Positive';
        if (score < -0.1) label = 'Negative';
        
        return { label, score };
      },
      keywords: (text) => {
        const words = text.toLowerCase().match(/\b\w{4,}\b/g) || [];
        const freq = {};
        words.forEach(w => freq[w] = (freq[w] || 0) + 1);
        return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => ({ keyword: k, frequency: v }));
      },
      topics: (text) => {
        const textLower = text.toLowerCase();
        const topics = [];
        if (textLower.includes('breach') || textLower.includes('security')) topics.push({ name: 'Cybersecurity', confidence: 0.8, isPrimary: true });
        if (textLower.includes('data') || textLower.includes('privacy')) topics.push({ name: 'Privacy', confidence: 0.7, isPrimary: true });
        if (textLower.includes('customer') || textLower.includes('service')) topics.push({ name: 'Customer Service', confidence: 0.6, isPrimary: false });
        if (topics.length === 0) topics.push({ name: 'General', confidence: 0.5, isPrimary: false });
        return topics;
      },
      relevance: (text, inv) => {
        const score = Math.random() * 60 + 40; // 40-100
        return {
          score: Math.round(score),
          level: score >= 70 ? 'High' : score >= 40 ? 'Medium' : 'Low'
        };
      }
    };

    let analyzed = 0;
    evArray.forEach(ev => {
      const sentiment = analysisServices.sentiment(ev.content);
      const keywords = analysisServices.keywords(ev.content);
      const topics = analysisServices.topics(ev.content);
      const relevance = analysisServices.relevance(ev.content, inv);

      ev.sentimentLabel = sentiment.label;
      ev.sentimentScore = sentiment.score;
      ev.extractedKeywords = keywords;
      ev.topics = topics;
      ev.relevanceScore = relevance.score;
      ev.relevanceLevel = relevance.level;
      ev.analyzedAt = new Date();
      ev.analysisVersion = '1.0';
      ev.analysisStatus = 'Analyzed';
      
      analyzed++;
    });

    res.json({
      message: 'Analysis completed',
      investigationId: inv.investigationId,
      analyzed: analyzed,
      failed: 0,
      total: evArray.length,
      summary: {
        totalEvidence: evArray.length,
        analyzedEvidence: analyzed,
        dominantSentiment: 'Mixed',
        topKeywords: ['test', 'corp', 'data'],
        topTopics: ['Cybersecurity', 'Privacy'],
        sentiment: {
          positive: evArray.filter(e => e.sentimentLabel === 'Positive').length,
          neutral: evArray.filter(e => e.sentimentLabel === 'Neutral').length,
          negative: evArray.filter(e => e.sentimentLabel === 'Negative').length
        },
        relevanceStats: {
          high: evArray.filter(e => e.relevanceLevel === 'High').length,
          medium: evArray.filter(e => e.relevanceLevel === 'Medium').length,
          low: evArray.filter(e => e.relevanceLevel === 'Low').length
        }
      },
      findings: [
        {
          id: 'finding_001',
          title: 'Test Finding',
          severity: 'MEDIUM',
          description: 'Test finding',
          evidence: analyzed,
          percentage: 50,
          category: 'sentiment'
        }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/analysis/:investigationId', (req, res) => {
  const invId = req.params.investigationId;
  const inv = investigations.find(i => i._id === invId || i.investigationId === invId);
  if (!inv) return res.status(404).json({ error: 'Not found' });

  const evArray = evidence.filter(e => e.investigationId === inv.investigationId || e.investigationId === inv._id);
  
  res.json({
    investigationId: inv.investigationId,
    summary: {
      totalEvidence: evArray.length,
      analyzedEvidence: evArray.filter(e => e.analysisStatus === 'Analyzed').length,
      dominantSentiment: 'Mixed'
    },
    findings: [
      {
        id: 'finding_001',
        title: 'Test Finding',
        severity: 'MEDIUM',
        description: 'Test finding',
        evidence: evArray.length,
        percentage: 50,
        category: 'sentiment'
      }
    ],
    timeline: { data: [], trends: [], peakPeriods: [], dateRange: {} },
    evidence: evArray
  });
});

app.get('/api/analysis/:investigationId/findings', (req, res) => {
  res.json({
    success: true,
    findings: [
      {
        id: 'finding_001',
        title: 'Test Finding',
        severity: 'MEDIUM',
        description: 'Test finding for integration',
        evidence: 3,
        percentage: 60,
        category: 'sentiment'
      }
    ]
  });
});

app.get('/api/analysis/:investigationId/timeline', (req, res) => {
  res.json({
    success: true,
    timeline: {
      data: [
        {
          date: '2024-01-15',
          count: 2,
          sentiment: { positive: { count: 1, percentage: 50 }, neutral: { count: 1, percentage: 50 }, negative: { count: 0, percentage: 0 } }
        }
      ],
      trends: [
        { period: '2024-01-15 to 2024-01-20', type: 'stable', description: 'Stable sentiment' }
      ],
      peakPeriods: [
        { date: '2024-01-15', reason: 'highest_volume', count: 2 }
      ],
      dateRange: { start: '2024-01-15', end: '2024-01-20' }
    }
  });
});

// ===== REPORT API =====

app.post('/api/reports/:investigationId', (req, res) => {
  try {
    const invId = req.params.investigationId;
    const inv = investigations.find(i => i._id === invId || i.investigationId === invId);
    if (!inv) return res.status(404).json({ error: 'Investigation not found' });

    const evArray = evidence.filter(e => e.investigationId === inv.investigationId || e.investigationId === inv._id);
    if (evArray.length === 0) {
      return res.status(400).json({ error: 'No evidence available for report' });
    }

    const analyzedCount = evArray.filter(e => e.sentimentLabel).length;
    if (analyzedCount === 0) {
      return res.status(400).json({ error: 'Evidence has not been analyzed', hint: 'Run analysis first' });
    }

    const reportId = 'report_' + Math.random().toString(36).substr(2, 9);
    const dateStr = new Date().toISOString().split('T')[0];
    const pdfFileName = `Forensic_Report_${invId.substring(0, 8)}_${dateStr}.pdf`;

    res.status(201).json({
      success: true,
      message: 'Report generated successfully',
      reportId,
      investigationId: inv.investigationId,
      pdfFileName,
      generatedAt: new Date(),
      totalEvidence: evArray.length,
      analyzedEvidence: analyzedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/:investigationId', (req, res) => {
  try {
    const invId = req.params.investigationId;
    const inv = investigations.find(i => i._id === invId || i.investigationId === invId);
    if (!inv) return res.status(404).json({ error: 'Investigation not found' });

    const evArray = evidence.filter(e => e.investigationId === inv.investigationId || e.investigationId === inv._id);

    const sentiment = {
      positive: evArray.filter(e => e.sentimentLabel === 'Positive').length,
      neutral: evArray.filter(e => e.sentimentLabel === 'Neutral').length,
      negative: evArray.filter(e => e.sentimentLabel === 'Negative').length
    };

    const keywordMap = {};
    evArray.forEach(e => {
      if (e.extractedKeywords && Array.isArray(e.extractedKeywords)) {
        e.extractedKeywords.slice(0, 5).forEach(kw => {
          const key = kw.keyword || kw;
          keywordMap[key] = (keywordMap[key] || 0) + (kw.frequency || 1);
        });
      }
    });

    const topKeywords = Object.entries(keywordMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([kw]) => kw);

    res.json({
      investigationId: inv.investigationId,
      investigation: {
        name: inv.name,
        target: inv.target,
        investigator: inv.investigator,
        startDate: inv.startDate,
        endDate: inv.endDate
      },
      evidence: {
        total: evArray.length,
        analyzed: evArray.filter(e => e.sentimentLabel).length,
        pending: evArray.filter(e => !e.sentimentLabel).length
      },
      analysis: {
        sentiment,
        topKeywords,
        topTopics: ['Cybersecurity', 'Privacy'],
        totalEvidence: evArray.length,
        analyzedEvidence: evArray.filter(e => e.sentimentLabel).length
      },
      latestReport: {
        reportId: 'report_test123',
        generatedAt: new Date(),
        pdfFileName: `Forensic_Report_${invId.substring(0, 8)}_2024-01-20.pdf`,
        metadata: {
          title: `Forensic Report: ${inv.name}`,
          investigationName: inv.name,
          target: inv.target,
          investigator: inv.investigator,
          totalEvidence: evArray.length,
          analyzedEvidence: evArray.filter(e => e.sentimentLabel).length
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reports/:investigationId/:reportId', (req, res) => {
  try {
    // Return a minimal PDF for testing
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Forensic_Report_test.pdf"`);
    // Send a minimal valid PDF
    const pdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/MediaBox[0 0 612 792]/Contents 5 0 R>>endobj 4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj 5 0 obj<</Length 44>>stream\nBT /F1 12 Tf 100 700 Td (Test PDF) Tj ET\nendstream endobj xref 0 6 0000000000 65535 f 0000000009 00000 n 0000000058 00000 n 0000000115 00000 n 0000000229 00000 n 0000000308 00000 n trailer<</Size 6/Root 1 0 R>>startxref 401 %%EOF');
    res.send(pdfBuffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`✓ TEST SERVER running on http://localhost:${PORT}`);
  console.log(`✓ Mode: In-Memory (No MongoDB required)`);
  console.log(`${'='.repeat(60)}\n`);
});
