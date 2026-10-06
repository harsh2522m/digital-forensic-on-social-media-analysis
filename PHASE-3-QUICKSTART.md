# Phase 3 - Quick Start Guide

## What's New in Phase 3

Phase 3 adds an **Analysis Engine** to the Digital Forensic on Social Media Analysis platform. You can now automatically analyze evidence for sentiment, keywords, topics, relevance, and temporal trends.

---

## 30-Second Setup

### 1. Start Backend
```bash
cd server
node server.js
```
Expected: Server runs on http://localhost:5000

### 2. Start Frontend
```bash
cd client
npm start
```
Expected: React app opens at http://localhost:3000

### 3. Create Investigation & Add Evidence
1. Go to http://localhost:3000
2. Create new investigation (Investigation tab)
3. Add at least 3 evidence items (Evidence tab)

### 4. Run Analysis
1. Click **Analysis** tab
2. Click **"Analyze Investigation"** button
3. Wait 1-5 seconds for results
4. Explore 6 tabs: Overview, Sentiment, Keywords, Topics, Timeline, Findings

---

## What You Can Do

### 📊 Dashboard
- **Overview** - Summary statistics and top insights
- **Sentiment** - Pie chart of positive/neutral/negative distribution
- **Keywords** - Bar chart of most frequent keywords
- **Topics** - Distribution across 8 topic categories
- **Timeline** - Sentiment trends over time
- **Findings** - Data-driven findings with severity levels

### 🔍 Analysis Methods

**Sentiment Analysis**
- Classifies evidence as Positive, Neutral, or Negative
- Uses lexicon-based approach (100+ words in database)
- Scores from -1 (negative) to 1 (positive)

**Keyword Extraction**
- Extracts top keywords from evidence
- Boosts investigation keywords (×2) and target name (×1.5)
- Removes 200+ common stop words
- Shows frequency of each keyword

**Topic Classification**
- Categorizes evidence into 8 topics:
  - Cybersecurity, Privacy, Customer Service, Product
  - Pricing, Fraud, Reputation, General
- Shows confidence score for each topic

**Relevance Scoring**
- Scores evidence 0-100 for investigation relevance
- Components: target match (40%), keywords (40%), source (15%), depth (5%)
- Labels: High (≥70), Medium (40-69), Low (<40)

**Timeline Analysis**
- Groups evidence by publication date
- Shows sentiment distribution per date
- Detects trends (increasing negative, stable, etc.)
- Identifies peak periods

**Findings Generation**
- Generates data-driven findings
- 8 finding rules based on analysis results
- Severity levels: HIGH, MEDIUM, LOW
- Forensic language, no invented results

---

## API Endpoints

### Analyze Investigation
```bash
POST /api/analysis/{investigationId}
# Analyzes all evidence and generates results
# Response: { summary, findings, analyzed count, timestamp }
```

### Get Analysis
```bash
GET /api/analysis/{investigationId}
# Returns cached/computed analysis results
# Response: { summary, findings, timeline, evidence with analysis fields }
```

### Get Findings
```bash
GET /api/analysis/{investigationId}/findings
# Returns just the findings
# Response: { findings: [{ id, title, severity, description, ... }] }
```

### Get Timeline
```bash
GET /api/analysis/{investigationId}/timeline
# Returns timeline data with trends
# Response: { data, trends, peakPeriods, dateRange }
```

### Analyze Single Evidence
```bash
POST /api/evidence/{evidenceId}/analyze
# Analyzes one evidence item
# Request: { investigationId }
# Response: { evidence with analysis fields }
```

---

## Test Data Example

### Create Investigation
```bash
curl -X POST http://localhost:5000/api/investigations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Data Breach Investigation",
    "target": "Company XYZ",
    "description": "Analysis of data breach incident",
    "investigator": "Test User",
    "keywords": ["data breach", "security", "breach"],
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'
```

### Add Evidence
```bash
curl -X POST http://localhost:5000/api/evidence \
  -H "Content-Type: application/json" \
  -d '{
    "investigationId": "{investigationId}",
    "content": "Company XYZ announced a major data breach affecting thousands of users. The incident exposed personal information. Security measures are being reviewed.",
    "sourceName": "Tech News",
    "sourceType": "News Article",
    "publicationDate": "2024-01-15",
    "url": "https://technews.com/article"
  }'
```

### Run Analysis
```bash
curl -X POST http://localhost:5000/api/analysis/{investigationId}
```

---

## Evidence Analysis Fields

After analysis, each Evidence document gets these new fields:

```javascript
{
  sentimentLabel: "Positive" | "Neutral" | "Negative",
  sentimentScore: -1 to 1,
  extractedKeywords: [
    { keyword: "data", frequency: 5 },
    { keyword: "breach", frequency: 4 }
  ],
  topics: [
    { name: "Cybersecurity", confidence: 0.85, isPrimary: true },
    { name: "Privacy", confidence: 0.42, isPrimary: false }
  ],
  relevanceScore: 85,
  relevanceLevel: "High",
  analyzedAt: "2024-01-20T10:30:00Z",
  analysisVersion: "1.0"
}
```

---

## Features

✓ **Deterministic** - Same analysis results on re-run  
✓ **No ML Models** - Uses lexicon and rule-based methods  
✓ **No External APIs** - All analysis local  
✓ **No Invented Results** - Only data-driven findings  
✓ **Fast** - Sub-second for 3-5 items, seconds for 100+  
✓ **Non-Destructive** - Original evidence content preserved  
✓ **Explainable** - All methods transparent and understandable  

---

## Common Workflows

### Workflow 1: Quick Analysis
1. Create investigation
2. Add 3+ evidence items
3. Click "Analyze Investigation" button
4. View sentiment and keywords
5. Review findings

**Time:** ~2 minutes

### Workflow 2: Deep Investigation
1. Create investigation with keywords and date range
2. Gradually add evidence (10-20 items)
3. Run analysis periodically
4. Track sentiment trends over time
5. Export findings

**Time:** Variable based on evidence volume

### Workflow 3: Batch Analysis
1. Create investigation
2. Add large evidence set (50+ items)
3. Run analysis (will take 5-10 seconds)
4. Focus on high-relevance items
5. Review findings for insights

**Time:** ~5-15 minutes

---

## Troubleshooting

### Issue: "No evidence available for analysis"
**Solution:** Add at least 1 evidence item before analyzing

### Issue: Charts not showing
**Solution:** 
- Check browser console for errors
- Refresh page
- Verify evidence has analysis fields

### Issue: Analysis takes too long
**Solution:** 
- Normal for 100+ items
- Check server logs for errors
- Verify MongoDB running

### Issue: Findings empty
**Solution:**
- Ensure 3+ evidence items analyzed
- Check evidence has content (not empty)
- Verify analysis completed successfully

---

## What's NOT in Phase 3

- ❌ PDF report generation (Phase 4)
- ❌ Machine learning models
- ❌ Web scraping
- ❌ Authentication/authorization changes
- ❌ Multilingual support
- ❌ Real-time analysis updates
- ❌ Batch scheduled analysis
- ❌ Advanced NLP features (negation, sarcasm)

---

## Next Phase (Phase 4)

Phase 4 will add:
- PDF report generation
- Advanced sentiment analysis
- Export to multiple formats
- Scheduled analysis jobs
- Real-time progress tracking

---

## Documentation

**Full Docs:**
- `docs/phase-3-analysis-engine.md` - Complete architecture & methods
- `docs/PHASE-3-TESTING.md` - Full test cases & verification
- `docs/PHASE-3-IMPLEMENTATION-SUMMARY.md` - Implementation details

**Code:**
- `server/services/` - Analysis engine (8 modules)
- `server/controllers/analysisController.js` - API endpoints
- `client/src/components/AnalysisDashboard.jsx` - Frontend UI
- `client/src/components/charts/` - Chart components

---

## Need Help?

1. Check documentation (links above)
2. Review test cases (PHASE-3-TESTING.md)
3. Check server logs for errors
4. Verify all services files present

---

## Summary

Phase 3 adds a complete analysis engine to your forensic platform. Analyze evidence for sentiment, keywords, topics, relevance, and trends with zero configuration. All analysis is deterministic, fast, and transparent.

**Ready to analyze?** Start with the 30-second setup above! 🚀

---

*Phase 3 - Analysis Engine is live and ready for use*
