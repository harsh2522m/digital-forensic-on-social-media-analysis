# Phase 3 Testing & Verification Guide

This document provides step-by-step instructions to verify Phase 3 implementation.

---

## Pre-Test Setup

### 1. Start Backend Server

```bash
cd server
npm install  # if not already done
node server.js
```

Expected output:
```
============================================================
✓ Server running on http://localhost:5000
✓ Environment: development
✓ Phase: Phase 1 - Backend Foundation
============================================================
```

### 2. Start Frontend Dev Server (in new terminal)

```bash
cd client
npm install  # if not already done
npm start
```

Expected: React app opens at http://localhost:3000

### 3. Verify API Health

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-20T...",
  "message": "Digital Forensic Analysis API is running",
  "phase": "Phase 1 - Backend Foundation",
  "version": "1.0.0"
}
```

---

## Test Sequence

### Phase 1 Sanity Check (5 min)

Before testing Phase 3, verify Phase 1-2 functionality still works:

#### 1.1 Create Investigation

```bash
curl -X POST http://localhost:5000/api/investigations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Investigation",
    "target": "Company XYZ",
    "description": "Test for Phase 3",
    "investigator": "Test User",
    "keywords": ["data breach", "security"],
    "startDate": "2024-01-01",
    "endDate": "2024-01-31"
  }'
```

**Expected:** Response with `investigationId` (e.g., `inv_123`)

**Save this ID** for next steps. Let's call it `{INVESTIGATION_ID}`

#### 1.2 Get Investigation

```bash
curl http://localhost:5000/api/investigations/{INVESTIGATION_ID}
```

**Expected:** Returns investigation details

#### 1.3 Create Evidence

```bash
curl -X POST http://localhost:5000/api/evidence \
  -H "Content-Type: application/json" \
  -d '{
    "investigationId": "{INVESTIGATION_ID}",
    "content": "Company XYZ announced a major data breach affecting 10 million users. The breach exposed personal information including names, email addresses, and encrypted passwords. Security experts have been analyzing the incident for several days. The company has notified affected users and is offering free credit monitoring.",
    "sourceName": "Tech News Daily",
    "sourceType": "News Article",
    "publicationDate": "2024-01-15",
    "url": "https://technewsdaily.com/company-xyz-breach"
  }'
```

**Expected:** Response with evidence `_id`. Save this ID as `{EVIDENCE_ID_1}`

#### 1.4 Add More Evidence (3+ items total)

Repeat the curl above 2-3 times with different content:

**Evidence 2:**
```json
{
  "investigationId": "{INVESTIGATION_ID}",
  "content": "Privacy advocates criticize Company XYZ for inadequate security measures. GDPR violations noted in preliminary investigation. Data protection authorities have opened official inquiry into compliance failures. Legal experts warn of potential millions in fines.",
  "sourceName": "Privacy Watch",
  "sourceType": "Blog",
  "publicationDate": "2024-01-16",
  "url": "https://privacywatch.com/xyz-gdpr"
}
```

**Evidence 3:**
```json
{
  "investigationId": "{INVESTIGATION_ID}",
  "content": "Company XYZ implements new security protocols following data breach incident. Management announces $50 million investment in cybersecurity infrastructure. New chief information security officer hired from leading tech companies. Customers express cautious optimism about improvements.",
  "sourceName": "Business Daily",
  "sourceType": "News Article",
  "publicationDate": "2024-01-18",
  "url": "https://businessdaily.com/xyz-security"
}
```

**Expected:** Each returns evidence with `_id`

#### 1.5 Verify Evidence Retrieved

```bash
curl http://localhost:5000/api/evidence?investigationId={INVESTIGATION_ID}
```

**Expected:** Returns array of 3 evidence items

---

### Phase 3 API Tests (15 min)

#### Test 2.1: Analyze Investigation

```bash
curl -X POST http://localhost:5000/api/analysis/{INVESTIGATION_ID}
```

**Expected Response (200 OK):**
```json
{
  "message": "Analysis completed",
  "investigationId": "inv_...",
  "analyzed": 3,
  "failed": 0,
  "total": 3,
  "summary": {
    "totalEvidence": 3,
    "analyzedEvidence": 3,
    "dominantSentiment": "Mixed" or "Negative" or similar,
    "topKeywords": [...],
    "topTopics": [...],
    "sentiment": {
      "positive": <number>,
      "neutral": <number>,
      "negative": <number>
    },
    "relevanceStats": {
      "high": <number>,
      "medium": <number>,
      "low": <number>
    }
  },
  "findings": [...]
}
```

**Verify:**
- ✓ `analyzed` equals number of evidence items (3)
- ✓ `failed` is 0
- ✓ `summary.analyzedEvidence` equals 3
- ✓ `sentiment` has positive, neutral, negative counts (all ≥ 0)
- ✓ `findings` array has items
- ✓ Response code is 200

**Time:** Should complete in < 2 seconds for 3 items

---

#### Test 2.2: Get Analysis

```bash
curl http://localhost:5000/api/analysis/{INVESTIGATION_ID}
```

**Expected Response (200 OK):**
```json
{
  "investigationId": "inv_...",
  "summary": {...},
  "findings": [...],
  "timeline": {...},
  "evidence": [
    {
      "evidenceId": "...",
      "sentimentLabel": "Positive" | "Neutral" | "Negative",
      "sentimentScore": <-1 to 1>,
      "extractedKeywords": [
        { "keyword": "...", "frequency": <number> }
      ],
      "topics": [
        { "name": "...", "confidence": <0-1>, "isPrimary": true|false }
      ],
      "relevanceScore": <0-100>,
      "relevanceLevel": "High" | "Medium" | "Low"
    }
  ]
}
```

**Verify:**
- ✓ `summary` exists and has content
- ✓ `findings` array present
- ✓ `timeline` exists
- ✓ Each evidence has:
  - sentimentLabel (one of: Positive, Neutral, Negative)
  - sentimentScore (between -1 and 1)
  - extractedKeywords array with keyword + frequency
  - topics array with name, confidence, isPrimary
  - relevanceScore (0-100)
  - relevanceLevel (High/Medium/Low)

---

#### Test 2.3: Get Findings

```bash
curl http://localhost:5000/api/analysis/{INVESTIGATION_ID}/findings
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "findings": [
    {
      "id": "finding_001",
      "title": "Finding Title",
      "severity": "HIGH" | "MEDIUM" | "LOW",
      "description": "Analytical result: ...",
      "evidence": <number>,
      "percentage": <0-100>,
      "category": "sentiment" | "keywords" | "topics" | "relevance" | "timeline"
    }
  ]
}
```

**Verify:**
- ✓ `findings` is non-empty array
- ✓ Each finding has: id, title, severity, description, evidence, percentage, category
- ✓ Severity values are valid (HIGH/MEDIUM/LOW)
- ✓ Categories are valid
- ✓ Percentage is 0-100

---

#### Test 2.4: Get Timeline

```bash
curl http://localhost:5000/api/analysis/{INVESTIGATION_ID}/timeline
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "timeline": {
    "data": [
      {
        "date": "2024-01-15",
        "count": <number>,
        "sentiment": {
          "positive": { "count": <number>, "percentage": <0-100> },
          "neutral": { "count": <number>, "percentage": <0-100> },
          "negative": { "count": <number>, "percentage": <0-100> }
        }
      }
    ],
    "trends": [
      {
        "period": "2024-01-15 to 2024-01-20",
        "type": "increasing_negative" | "decreasing_negative" | "stable",
        "description": "..."
      }
    ],
    "peakPeriods": [
      {
        "date": "2024-01-18",
        "reason": "highest_volume" | "highest_negative",
        "count": <number>
      }
    ],
    "dateRange": {
      "start": "2024-01-15",
      "end": "2024-01-18"
    }
  }
}
```

**Verify:**
- ✓ `data` array has entries for each day with evidence
- ✓ Each day's sentiment percentages sum to ~100
- ✓ `trends` array present
- ✓ `peakPeriods` array present
- ✓ `dateRange` has start and end dates

---

#### Test 2.5: Analyze Single Evidence

```bash
curl -X POST http://localhost:5000/api/evidence/{EVIDENCE_ID_1}/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "investigationId": "{INVESTIGATION_ID}"
  }'
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "evidence": {
    "_id": "...",
    "sentimentLabel": "Positive" | "Neutral" | "Negative",
    "sentimentScore": <-1 to 1>,
    "extractedKeywords": [...],
    "topics": [...],
    "relevanceScore": <0-100>,
    "relevanceLevel": "High" | "Medium" | "Low",
    "analyzedAt": "2024-01-20T...",
    "analysisVersion": "1.0"
  }
}
```

**Verify:**
- ✓ Analysis fields populated
- ✓ analysisVersion is "1.0"
- ✓ analyzedAt is recent timestamp

---

### Phase 3 Frontend Tests (10 min)

#### Test 3.1: Navigate to Investigation

1. Open http://localhost:3000 in browser
2. Create new investigation (or view existing)
3. Verify **Analysis** tab visible

**Expected:**
- ✓ Tab labeled "📊 Analysis" visible next to Overview, Evidence, Add Evidence tabs

---

#### Test 3.2: Analysis Dashboard Load

1. Click **Analysis** tab
2. Wait for component to load
3. Verify **"Analyze Investigation"** button visible

**Expected:**
- ✓ Component loads without errors
- ✓ Blue button with "Analyze Investigation" text visible
- ✓ Message like "No analysis results available" if not yet analyzed

---

#### Test 3.3: Run Analysis from Frontend

1. Click **"Analyze Investigation"** button
2. Wait for analysis to complete (2-5 seconds)
3. Verify results display

**Expected:**
- ✓ Loading spinner appears
- ✓ After completion, content populates
- ✓ Tabs become active: Overview, Sentiment, Keywords, Topics, Timeline, Findings

---

#### Test 3.4: Overview Tab

1. Click **Overview** tab
2. Verify statistics display

**Expected:**
- ✓ Shows:
  - Total Evidence Analyzed
  - Dominant Sentiment
  - Top Keywords (3-5)
  - Top Topics (2-3)
  - Analysis Timestamp

---

#### Test 3.5: Sentiment Tab

1. Click **Sentiment** tab
2. Verify pie chart

**Expected:**
- ✓ Pie chart displays with 3 slices:
  - Positive (with percentage)
  - Neutral (with percentage)
  - Negative (with percentage)
- ✓ Colors differentiate: green/red/gray or similar
- ✓ Percentages sum to 100%

---

#### Test 3.6: Keywords Tab

1. Click **Keywords** tab
2. Verify bar chart

**Expected:**
- ✓ Horizontal bar chart with top keywords
- ✓ At least 5 keywords displayed
- ✓ X-axis shows frequency count
- ✓ Keywords are relevant to investigation

---

#### Test 3.7: Topics Tab

1. Click **Topics** tab
2. Verify horizontal bar chart

**Expected:**
- ✓ Horizontal bar chart with topics
- ✓ At least 2-3 topics displayed (Cybersecurity, Privacy, etc.)
- ✓ Percentages visible
- ✓ Bars represent confidence/percentage

---

#### Test 3.8: Timeline Tab

1. Click **Timeline** tab
2. Wait for line chart to load

**Expected:**
- ✓ Line chart displays with dates on X-axis
- ✓ 3 lines representing: Positive, Neutral, Negative sentiment over time
- ✓ Date range matches evidence dates (Jan 15-18 approx)

---

#### Test 3.9: Findings Tab

1. Click **Findings** tab
2. Verify findings display

**Expected:**
- ✓ Finding cards displayed
- ✓ Each card shows:
  - Title
  - Severity badge (HIGH/MEDIUM/LOW with color)
  - Description text
  - Evidence count
- ✓ Cards sorted by severity (HIGH first)

---

### Data Integrity Tests (5 min)

#### Test 4.1: Original Evidence Unchanged

```bash
curl http://localhost:5000/api/evidence/{EVIDENCE_ID_1}
```

**Verify:**
- ✓ Original `content` field unchanged
- ✓ Original `sourceName` unchanged
- ✓ Analysis fields present (sentimentLabel, etc.)
- ✓ No data corruption in original fields

---

#### Test 4.2: Re-analysis Idempotent

1. Analyze investigation again

```bash
curl -X POST http://localhost:5000/api/analysis/{INVESTIGATION_ID}
```

2. Compare results with first analysis

**Expected:**
- ✓ Results identical (deterministic)
- ✓ No errors on re-run
- ✓ analyzedAt updates to new timestamp

---

#### Test 4.3: Analysis Version

```bash
curl http://localhost:5000/api/evidence/{EVIDENCE_ID_1}
```

**Verify:**
- ✓ `analysisVersion` is "1.0"
- ✓ Consistent across all evidence

---

## Validation Checklist

### Backend (All 5 endpoints)

- [ ] POST /api/analysis/:investigationId (Analyze)
  - [ ] Returns 200 with analysis results
  - [ ] Analyzes all evidence items
  - [ ] Updates evidence documents with analysis fields
  - [ ] Generates findings
  
- [ ] GET /api/analysis/:investigationId (Get Analysis)
  - [ ] Returns 200 with cached results
  - [ ] Includes summary, findings, timeline, evidence
  
- [ ] GET /api/analysis/:investigationId/findings (Get Findings)
  - [ ] Returns 200 with formatted findings
  - [ ] All findings have required fields
  
- [ ] GET /api/analysis/:investigationId/timeline (Get Timeline)
  - [ ] Returns 200 with timeline data
  - [ ] Shows sentiment distribution by date
  - [ ] Includes trends and peak periods
  
- [ ] POST /api/evidence/:id/analyze (Analyze Single Evidence)
  - [ ] Returns 200 with analyzed evidence
  - [ ] Updates Evidence document

### Analysis Correctness

- [ ] **Sentiment Analysis**
  - [ ] Positive sentiment on positive text
  - [ ] Negative sentiment on negative text
  - [ ] Neutral sentiment on mixed/neutral text
  - [ ] Scores range -1 to 1
  
- [ ] **Keyword Extraction**
  - [ ] Relevant keywords extracted
  - [ ] Stop words removed
  - [ ] Investigation keywords present
  - [ ] Frequencies calculated correctly
  
- [ ] **Topic Classification**
  - [ ] Topics assigned based on content
  - [ ] Confidence scores 0-1
  - [ ] Primary topics marked correctly
  - [ ] Multiple topics possible
  
- [ ] **Relevance Scoring**
  - [ ] Scores 0-100
  - [ ] Target matches boost score
  - [ ] Keywords boost score
  - [ ] Levels assigned (High/Medium/Low)
  
- [ ] **Timeline Analysis**
  - [ ] Grouped by date correctly
  - [ ] Sentiment distribution accurate
  - [ ] Trends detected
  - [ ] Peak periods identified
  
- [ ] **Findings Generation**
  - [ ] Findings generated from data
  - [ ] Severity levels assigned
  - [ ] Evidence counts accurate
  - [ ] No invented results

### Frontend (All 6 tabs)

- [ ] AnalysisDashboard component loads
- [ ] "Analyze Investigation" button works
- [ ] Loading state displays
- [ ] All 6 tabs functional:
  - [ ] Overview: stats display
  - [ ] Sentiment: pie chart renders
  - [ ] Keywords: bar chart renders
  - [ ] Topics: bar chart renders
  - [ ] Timeline: line chart renders
  - [ ] Findings: cards display
  
- [ ] Charts render with correct data
- [ ] No console errors
- [ ] Responsive design maintained

### Data Integrity

- [ ] Original content preserved
- [ ] Analysis non-destructive
- [ ] Re-analysis produces identical results
- [ ] Analysis version tracked
- [ ] analyzedAt timestamp accurate

---

## Common Issues & Troubleshooting

### Issue: "Investigation not found" on analyze

**Solution:**
- Verify investigationId is correct
- Check investigation exists: `GET /api/investigations/{ID}`

---

### Issue: "No evidence available for analysis"

**Solution:**
- Create at least 3 evidence items
- Verify evidence linked to investigation
- Check evidence not archived

---

### Issue: Charts not rendering in frontend

**Solution:**
- Check browser console for errors
- Verify Chart.js installed: `npm list chart.js` in client/
- Clear browser cache and reload

---

### Issue: Analysis takes >10 seconds

**Solution:**
- Normal for large investigations (100+ items)
- Check for errors in backend logs
- Verify MongoDB connectivity

---

### Issue: Findings array empty

**Solution:**
- Ensure at least 3 evidence items analyzed
- Check evidence has content (not empty strings)
- Verify analysis ran successfully

---

## Performance Notes

**Expected Times:**
- 3 evidence items: < 1 second
- 10 evidence items: 1-2 seconds
- 50 evidence items: 3-5 seconds
- 100 evidence items: 5-10 seconds

**If slower:**
- Check system resources (CPU, memory)
- Check MongoDB performance
- Look for errors in backend logs

---

## Next Steps After Verification

1. ✅ All tests pass → Phase 3 Complete
2. Document any issues found
3. Fix any bugs discovered
4. Plan Phase 4 (PDF Reports)
5. Archive test data or clean up

---

## Test Report Template

```
Date: [TODAY]
Tester: [NAME]
Environment: [LOCAL/STAGING/PRODUCTION]

Backend API Tests: ✓ PASS / ✗ FAIL
- Analyze Investigation: ✓ / ✗
- Get Analysis: ✓ / ✗
- Get Findings: ✓ / ✗
- Get Timeline: ✓ / ✗
- Analyze Single Evidence: ✓ / ✗

Frontend Tests: ✓ PASS / ✗ FAIL
- Dashboard Load: ✓ / ✗
- Overview Tab: ✓ / ✗
- Sentiment Chart: ✓ / ✗
- Keywords Chart: ✓ / ✗
- Topics Chart: ✓ / ✗
- Timeline Chart: ✓ / ✗
- Findings Display: ✓ / ✗

Data Integrity: ✓ PASS / ✗ FAIL
- Original Content Preserved: ✓ / ✗
- Re-analysis Idempotent: ✓ / ✗
- Analysis Version Tracked: ✓ / ✗

Issues Found:
1. [DESCRIPTION]
   - Solution: [FIX]

Overall Result: ✓ PASS / ✗ FAIL
```

---

## Questions?

Refer to:
- Phase 3 Architecture: `docs/phase-3-analysis-engine.md`
- Implementation: `server/controllers/analysisController.js`
- Services: `server/services/`
- Frontend: `client/src/components/AnalysisDashboard.jsx`
