# Phase 3: Analysis Engine Documentation

## Overview

Phase 3 implements the Analysis Engine for Digital Forensic on Social Media Analysis. This phase provides deterministic, explainable analysis of evidence through sentiment analysis, keyword extraction, topic classification, relevance scoring, timeline analysis, and findings generation.

**Core Principle:** All analysis is data-driven, lexicon-based, and rule-based. No machine learning models, no invented results, no external dependencies beyond what's explicitly included.

---

## Architecture

### Analysis Service Layer

The analysis engine is composed of 8 specialized service modules:

```
server/services/
├── textPreprocessor.js        # Text normalization, tokenization, stop-word removal
├── sentimentAnalyzer.js        # Lexicon-based sentiment classification
├── keywordExtractor.js         # Extract top keywords with context weighting
├── topicClassifier.js          # Rule-based topic assignment
├── relevanceCalculator.js      # Weighted relevance scoring
├── timelineAnalyzer.js         # Temporal analysis and trend detection
├── investigationSummary.js     # Aggregate statistics generator
└── findingsGenerator.js        # Deterministic findings derivation
```

### API Layer

**Analysis Controller:** `server/controllers/analysisController.js`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analysis/:investigationId` | Analyze entire investigation (runs analysis on all evidence) |
| GET | `/api/analysis/:investigationId` | Get aggregated analysis results for investigation |
| GET | `/api/analysis/:investigationId/findings` | Get deterministic findings from analysis |
| GET | `/api/analysis/:investigationId/timeline` | Get timeline with sentiment trends and peak periods |
| POST | `/api/evidence/:id/analyze` | Analyze single evidence item (stored in Evidence model) |

### Data Model

**Evidence Model Updates** (`server/models/Evidence.js`)

New fields added to Evidence schema (non-destructive; original content unchanged):

```javascript
{
  // Original fields (immutable)
  content: String,
  source: String,
  publicationDate: Date,
  url: String,
  // ... existing fields
  
  // Analysis fields (added separately)
  sentimentLabel: {
    type: String,
    enum: ['Positive', 'Neutral', 'Negative'],
    default: null
  },
  sentimentScore: {
    type: Number,
    min: -1,
    max: 1,
    default: null
  },
  extractedKeywords: [{
    keyword: String,
    frequency: Number
  }],
  topics: [{
    name: String,
    confidence: Number,      // 0-1 scale
    isPrimary: Boolean
  }],
  relevanceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: null
  },
  relevanceLevel: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    default: null
  },
  analyzedAt: Date,
  analysisVersion: {
    type: String,
    default: '1.0'
  }
}
```

---

## Analysis Methods

### 1. Sentiment Analysis

**Module:** `sentimentAnalyzer.js`

**Method:** Lexicon-based classification using weighted word lists

#### Algorithm

1. **Preprocessing:** Normalize text, remove punctuation, tokenize
2. **Lexicon Lookup:** Count positive and negative words with their weights
3. **Scoring:** Calculate aggregate sentiment score in range [-1, 1]
   - Positive score: count of positive words / total words
   - Negative score: count of negative words / total words
   - Final score: (positive - negative) / max(positive + negative, 1)
4. **Label Assignment:**
   - score > 0.1: **Positive**
   - score < -0.1: **Negative**
   - -0.1 ≤ score ≤ 0.1: **Neutral**

#### Word Lists

**POSITIVE_WORDS (weighted):**
```
'good': 1, 'great': 1.5, 'excellent': 2, 'amazing': 2, 'awesome': 1.5,
'love': 2, 'perfect': 1.5, 'best': 1.5, 'wonderful': 1.5, 'fantastic': 1.5,
'happy': 1.5, 'satisfied': 1, 'impressed': 1, 'positive': 1, 'brilliant': 2,
...
```

**NEGATIVE_WORDS (weighted):**
```
'bad': 1, 'terrible': 2, 'horrible': 2, 'awful': 2, 'worst': 2,
'hate': 2, 'ugly': 1.5, 'poor': 1, 'disappointed': 1.5, 'angry': 1.5,
'frustrated': 1, 'sad': 1, 'negative': 1, 'useless': 1.5, 'broken': 1.5,
...
```

**Limitations:**
- Context-insensitive (e.g., "not good" → negative words only)
- Sarcasm not detected
- Emoticons and slang not explicitly handled
- Single-language support (English only)

#### Usage

```javascript
const { analyzeSentiment } = require('./sentimentAnalyzer');

const result = analyzeSentiment('This product is absolutely amazing!');
// Returns: {
//   score: 0.85,
//   label: 'Positive',
//   explanation: 'Contains 2 positive words (weight: 2.5 total)'
// }
```

---

### 2. Keyword Extraction

**Module:** `keywordExtractor.js`

**Method:** Frequency-based extraction with context weighting

#### Algorithm

1. **Preprocessing:** Normalize, remove punctuation, tokenize, remove stop words
2. **Stop Word Removal:** Remove common English words (the, is, and, etc.)
3. **Frequency Calculation:** Count occurrences of each term
4. **Context Boost:**
   - Investigation keywords: ×2 multiplier
   - Target name matches: ×1.5 multiplier
5. **Ranking:** Sort by weighted frequency, return top N keywords
6. **Output:** List of top keywords with their raw frequencies

#### Stop Word List

Includes 200+ common English words: a, an, the, is, are, been, be, have, has, do, does, did, will, would, could, should, can, may, might, must, shall, should, to, for, from, in, on, at, by, with, of, or, and, but, as, if, because, as, while, during, before, after, above, below, under, over, between, through, etc.

#### Context Boosting

**Investigation Keywords:** If evidence mentions keywords from investigation metadata, boost frequency ×2
```javascript
// Example:
investigation.keywords = ['data breach', 'security'];
evidence.content = 'A data breach incident...';
'data' and 'breach' frequency: ×2
```

**Target Name Matches:** If evidence mentions investigation target, boost ×1.5
```javascript
investigation.target = 'Company XYZ';
evidence.content = 'Company XYZ denies the allegations...';
'company', 'xyz' frequency: ×1.5
```

#### Usage

```javascript
const { extractKeywords } = require('./keywordExtractor');

const keywords = extractKeywords(content, {
  investigationKeywords: ['data breach'],
  targetName: 'Company XYZ',
  topN: 10
});
// Returns: [
//   { keyword: 'data', frequency: 15 },
//   { keyword: 'breach', frequency: 12 },
//   { keyword: 'company', frequency: 9 },
//   ...
// ]
```

**Limitations:**
- No semantic similarity (e.g., 'data' and 'information' counted separately)
- No phrase extraction (single terms only)
- Stop word list may exclude relevant terms in some domains
- No handling of word variations (plurals, tenses)

---

### 3. Topic Classification

**Module:** `topicClassifier.js`

**Method:** Rule-based classification with keyword mapping

#### Algorithm

1. **Topic Keywords Map:** Define primary and secondary keywords for each topic
2. **Keyword Matching:** Count matches of primary (weight 2) and secondary (weight 1) keywords
3. **Confidence Calculation:** score / maxPossibleScore (0-1 scale)
4. **Classification:** Assign all topics with confidence > 0, mark primary if confidence > 0.5
5. **Output:** Sorted by confidence, highest confidence topic first

#### Topic Keywords Map

```javascript
{
  'Cybersecurity': {
    primary: ['data breach', 'hack', 'malware', 'ransomware', 'phishing', 'vulnerability', 'exploit'],
    secondary: ['security', 'attack', 'cyber', 'threat', 'intrusion']
  },
  'Privacy': {
    primary: ['privacy', 'gdpr', 'ccpa', 'personal data', 'pii', 'data protection'],
    secondary: ['consent', 'regulation', 'compliance', 'tracking']
  },
  'Customer Service': {
    primary: ['customer service', 'complaint', 'support', 'helpdesk', 'billing'],
    secondary: ['resolution', 'issue', 'response', 'quality']
  },
  'Product': {
    primary: ['product', 'feature', 'bug', 'update', 'release', 'version'],
    secondary: ['functionality', 'performance', 'quality', 'design']
  },
  'Pricing': {
    primary: ['price', 'cost', 'billing', 'rate', 'subscription', 'fee'],
    secondary: ['expensive', 'affordable', 'value', 'payment']
  },
  'Fraud': {
    primary: ['fraud', 'scam', 'fake', 'counterfeit', 'forgery', 'deception'],
    secondary: ['suspicious', 'unauthorized', 'claim', 'case']
  },
  'Reputation': {
    primary: ['reputation', 'scandal', 'controversy', 'backlash', 'criticism'],
    secondary: ['public', 'image', 'perception', 'negative']
  },
  'General': {
    primary: [],
    secondary: []  // Fallback category
  }
}
```

#### Confidence Scoring

```
Confidence = Total Weighted Matches / Max Possible Score

Example:
- Content matches 2 primary keywords (weight 2 each) = 4 points
- Content matches 1 secondary keyword (weight 1) = 1 point
- Total = 5 points
- Max possible (if all primary keywords matched) = 14 points
- Confidence = 5 / 14 ≈ 0.36
```

#### Usage

```javascript
const { classifyTopic } = require('./topicClassifier');

const topics = classifyTopic(content);
// Returns: [
//   { name: 'Cybersecurity', confidence: 0.85, isPrimary: true },
//   { name: 'Privacy', confidence: 0.42, isPrimary: false },
//   { name: 'General', confidence: 0.1, isPrimary: false }
// ]
```

**Limitations:**
- Keyword-based only (no semantic understanding)
- Multiple topics possible (content can be about multiple areas)
- Keyword list requires manual maintenance
- No hierarchical topic relationships

---

### 4. Relevance Scoring

**Module:** `relevanceCalculator.js`

**Method:** Weighted component scoring (0-100 scale)

#### Algorithm

Relevance = (Component1 + Component2 + Component3 + Component4) × 10

**Components:**

| Component | Max Points | Calculation |
|-----------|-----------|-------------|
| **Target Match** | 40 | Investigation target name appears in content: 40 points; partial match: 20; no match: 0 |
| **Keywords** | 40 | For each investigation keyword found: 10 points (max 40) |
| **Source Metadata** | 15 | URL domain match (7.5 points), post metadata matches (7.5 points) |
| **Content Depth** | 5 | Text length > 500 chars (3 points), > 1000 chars (5 points) |

**Total: 0-100 scale**

#### Relevance Levels

- **High:** Score ≥ 70
- **Medium:** Score 40-69
- **Low:** Score < 40

#### Usage

```javascript
const { calculateRelevance } = require('./relevanceCalculator');

const relevance = calculateRelevance(content, {
  investigationTarget: 'Company XYZ',
  investigationKeywords: ['data breach', 'security'],
  sourceUrl: 'https://news.company-xyz.com/article',
  targetNameMatches: 1
});
// Returns: {
//   score: 85,
//   level: 'High',
//   breakdown: {
//     targetMatch: 40,
//     keywords: 30,
//     sourceMetadata: 15,
//     contentDepth: 5
//   }
// }
```

**Limitations:**
- Simple string matching (no fuzzy matching)
- Equal weighting for all keywords
- URL domain check is basic pattern matching
- Content depth is simple character count

---

### 5. Timeline Analysis

**Module:** `timelineAnalyzer.js`

**Method:** Temporal grouping with sentiment trend detection

#### Algorithm

1. **Date Grouping:** Group all evidence by publication date (YYYY-MM-DD)
2. **Sentiment Distribution:** For each date, calculate sentiment counts and percentages
3. **Trend Detection:** Analyze sentiment changes over consecutive dates
4. **Peak Period Identification:** Find dates with highest evidence volume or strongest sentiment

#### Trend Types

- **Increasing Negative:** Negative sentiment % increases over consecutive periods
- **Decreasing Negative:** Negative sentiment % decreases over consecutive periods
- **Stable:** Sentiment distribution relatively consistent
- **Positive Surge:** Positive sentiment % spikes significantly
- **Neutral Dominance:** Neutral sentiment > 60% for period

#### Usage

```javascript
const { generateTimelineData } = require('./timelineAnalyzer');

const timeline = generateTimelineData(evidence);
// Returns: {
//   data: [
//     {
//       date: '2024-01-15',
//       count: 5,
//       sentiment: {
//         positive: { count: 2, percentage: 40 },
//         neutral: { count: 2, percentage: 40 },
//         negative: { count: 1, percentage: 20 }
//       }
//     },
//     // ... more dates
//   ],
//   trends: [
//     { period: '2024-01-15 to 2024-01-20', type: 'increasing_negative' }
//   ],
//   peakPeriods: [
//     { date: '2024-01-18', reason: 'highest_negative', count: 8 }
//   ],
//   dateRange: { start: '2024-01-15', end: '2024-02-10' }
// }
```

**Limitations:**
- Temporal resolution limited to days (no hourly analysis)
- Trend detection requires at least 2 data points
- No external event correlation
- Simple percentage-based trend detection

---

### 6. Findings Generation

**Module:** `findingsGenerator.js`

**Method:** Deterministic findings derivation from aggregated analysis

#### Algorithm

1. **Data Collection:** Aggregate all analysis results (sentiment, keywords, topics, relevance, timeline)
2. **Finding Rules:** Apply deterministic rules based on thresholds
3. **Sorting:** Order findings by priority (relevance score, evidence count, sentiment extremity)
4. **Formatting:** Use forensic language, distinguish observations from assumptions

#### Finding Rules

| Rule | Trigger | Severity |
|------|---------|----------|
| **Dominant Sentiment** | If one sentiment > 70% of analyzed evidence | HIGH |
| **Sentiment Shift** | If negative sentiment increases > 20% over timeline | HIGH |
| **High-Relevance Evidence** | If > 30% of evidence has relevance score > 70 | MEDIUM |
| **Topic Concentration** | If single topic accounts for > 50% of evidence | MEDIUM |
| **Peak Period** | If notable spike in evidence volume or sentiment | MEDIUM |
| **Keyword Prevalence** | If investigation keywords appear in > 50% of evidence | MEDIUM |
| **Source Diversity** | If evidence from <3 unique sources | LOW |
| **Temporal Coverage** | If evidence spans < 7 days | LOW |

#### Finding Examples

```
HIGH SEVERITY:
"Analytical Result: Negative sentiment dominates evidence set (73% of analyzed items). 
Observed trend: Sentiment shifts from neutral to negative over the period 
[date-range]. This is consistent with a negative public perception event."

MEDIUM SEVERITY:
"Analytical Result: Investigation keyword 'data breach' appears in 18 evidence items (62% of total). 
Finding: Keyword prevalence suggests significant public discourse around this issue."

LOW SEVERITY:
"Data Quality Note: Evidence collection spans 3 days. Observation: Limited temporal coverage 
may not capture longer-term trends."
```

#### Finding Format

```javascript
{
  id: 'finding_001',
  title: 'Dominant Sentiment',
  severity: 'HIGH',
  description: 'Analytical result description...',
  evidence: 12,  // number of evidence items supporting this finding
  percentage: 73,  // percentage of total
  category: 'sentiment',
  timestamp: '2024-01-20T10:30:00Z'
}
```

#### Usage

```javascript
const { generateFindings } = require('./findingsGenerator');

const findings = generateFindings(aggregatedAnalysis, evidence);
// Returns: [
//   { id: 'finding_001', title: 'Dominant Sentiment', severity: 'HIGH', ... },
//   { id: 'finding_002', title: 'Sentiment Shift', severity: 'HIGH', ... },
//   // ... more findings sorted by severity and priority
// ]
```

**Limitations:**
- Threshold-based (no statistical significance testing)
- Rules are manually crafted and may require tuning
- All findings are deterministic (no probabilistic analysis)
- No external validation of findings

#### Language Guidelines

**DO:**
- "Analytical result: ..."
- "Observed trend: ..."
- "Evidence-supported finding: ..."
- "Data shows: ..."
- "The analysis indicates: ..."

**DON'T:**
- Invent results not supported by data
- Use speculative language ("might", "could", "possibly")
- Make causal claims without evidence
- Assume ground truth about people or events

---

## Frontend Components

### Analysis Dashboard (`client/src/components/AnalysisDashboard.jsx`)

**Main component** that orchestrates analysis workflow and displays results.

**Props:**
- `investigationId` (string, required): Investigation ID to analyze
- `evidence` (array): Pre-fetched evidence items (optional, for optimization)

**State:**
- `analysis` (object): Aggregated analysis results
- `findings` (array): Generated findings
- `timeline` (object): Timeline data
- `loading` (boolean): Analysis in progress
- `error` (string): Error message if any
- `analyzing` (boolean): Running analysis operation
- `activeTab` (string): Current tab selection

**Tabs:**

1. **Overview** - Summary statistics
   - Total evidence analyzed
   - Dominant sentiment
   - Top keywords
   - Most common topics
   - Analysis timestamp

2. **Sentiment** - Sentiment distribution
   - Pie chart: Positive/Neutral/Negative percentages
   - Count and percentage for each

3. **Keywords** - Extracted keywords
   - Bar chart: Top 10 keywords by frequency
   - Clickable keywords (filtered by topic)

4. **Topics** - Topic distribution
   - Horizontal bar chart: Topic percentages
   - Confidence scores

5. **Timeline** - Temporal analysis
   - Line chart: Sentiment trends over time
   - Date range selector
   - Peak periods highlighted

6. **Findings** - Generated findings
   - Sorted by severity
   - Finding cards with title, description, evidence count
   - "Learn More" expandable details

**Key Functions:**

```javascript
// Trigger full investigation analysis
handleAnalyzeInvestigation()

// Switch between tabs
handleTabChange(tabName)

// Generate PDF report (Phase 4, not implemented)
// handleExportReport()
```

### Chart Components

#### SentimentChart (`client/src/components/charts/SentimentChart.jsx`)

Pie chart visualization using Chart.js

```javascript
<SentimentChart data={{
  positive: 35,
  neutral: 40,
  negative: 25
}} />
```

#### KeywordsChart (`client/src/components/charts/KeywordsChart.jsx`)

Horizontal bar chart of top keywords

```javascript
<KeywordsChart data={[
  { keyword: 'data', frequency: 42 },
  { keyword: 'breach', frequency: 38 },
  // ...
]} />
```

#### TopicsChart (`client/src/components/charts/TopicsChart.jsx`)

Horizontal bar chart of topic distribution (percentage)

```javascript
<TopicsChart data={[
  { name: 'Cybersecurity', percentage: 45 },
  { name: 'Privacy', percentage: 28 },
  // ...
]} />
```

#### TimelineChart (`client/src/components/charts/TimelineChart.jsx`)

Line chart with sentiment trends over time

```javascript
<TimelineChart data={{
  dates: ['2024-01-15', '2024-01-16', ...],
  positive: [10, 12, ...],
  neutral: [15, 14, ...],
  negative: [5, 6, ...]
}} />
```

---

## API Examples

### Analyze Investigation

**Request:**
```bash
POST /api/analysis/inv_12345
Content-Type: application/json

{}
```

**Response:**
```json
{
  "success": true,
  "message": "Investigation analysis completed",
  "analysis": {
    "investigationId": "inv_12345",
    "summary": {
      "totalEvidence": 25,
      "analyzedEvidence": 24,
      "dominantSentiment": "Neutral",
      "topKeywords": ["data", "breach", "security"],
      "topTopics": ["Cybersecurity", "Privacy"]
    },
    "sentiment": {
      "positive": 8,
      "neutral": 10,
      "negative": 6
    },
    "keywords": [
      { "keyword": "data", "frequency": 42 },
      { "keyword": "breach", "frequency": 38 }
    ],
    "topics": [
      { "name": "Cybersecurity", "percentage": 55, "count": 15 },
      { "name": "Privacy", "percentage": 30, "count": 8 }
    ]
  }
}
```

### Get Analysis

**Request:**
```bash
GET /api/analysis/inv_12345
```

**Response:** Same as above (cached analysis result)

### Get Findings

**Request:**
```bash
GET /api/analysis/inv_12345/findings
```

**Response:**
```json
{
  "success": true,
  "findings": [
    {
      "id": "finding_001",
      "title": "Dominant Sentiment",
      "severity": "HIGH",
      "description": "Analytical result: Neutral sentiment dominates...",
      "evidence": 10,
      "percentage": 42,
      "category": "sentiment"
    },
    {
      "id": "finding_002",
      "title": "Keyword Prevalence",
      "severity": "MEDIUM",
      "description": "Analytical result: 'data' appears in 42 evidence items (88%)...",
      "evidence": 21,
      "percentage": 88,
      "category": "keywords"
    }
  ]
}
```

### Get Timeline

**Request:**
```bash
GET /api/analysis/inv_12345/timeline
```

**Response:**
```json
{
  "success": true,
  "timeline": {
    "data": [
      {
        "date": "2024-01-15",
        "count": 5,
        "sentiment": {
          "positive": { "count": 2, "percentage": 40 },
          "neutral": { "count": 2, "percentage": 40 },
          "negative": { "count": 1, "percentage": 20 }
        }
      }
    ],
    "trends": [
      {
        "period": "2024-01-15 to 2024-01-20",
        "type": "stable",
        "description": "Sentiment remained relatively stable"
      }
    ],
    "peakPeriods": [
      {
        "date": "2024-01-18",
        "reason": "highest_volume",
        "count": 8
      }
    ]
  }
}
```

### Analyze Single Evidence

**Request:**
```bash
POST /api/evidence/evid_123/analyze
Content-Type: application/json

{
  "investigationId": "inv_12345",
  "investigationTarget": "Company XYZ",
  "investigationKeywords": ["data breach", "security"]
}
```

**Response:**
```json
{
  "success": true,
  "evidence": {
    "_id": "evid_123",
    "sentimentLabel": "Negative",
    "sentimentScore": -0.45,
    "extractedKeywords": [
      { "keyword": "breach", "frequency": 3 },
      { "keyword": "data", "frequency": 2 }
    ],
    "topics": [
      { "name": "Cybersecurity", "confidence": 0.82, "isPrimary": true },
      { "name": "Privacy", "confidence": 0.45, "isPrimary": false }
    ],
    "relevanceScore": 78,
    "relevanceLevel": "High",
    "analyzedAt": "2024-01-20T10:30:00Z",
    "analysisVersion": "1.0"
  }
}
```

---

## Test Cases

### Unit Tests

**Sentiment Analyzer**
- ✓ Positive text classification
- ✓ Negative text classification
- ✓ Neutral text classification
- ✓ Empty text handling
- ✓ Weighted word scoring

**Keyword Extractor**
- ✓ Stop word removal
- ✓ Frequency calculation
- ✓ Investigation keyword boost (×2)
- ✓ Target name boost (×1.5)
- ✓ Top N keyword selection

**Topic Classifier**
- ✓ Primary keyword matching (weight 2)
- ✓ Secondary keyword matching (weight 1)
- ✓ Confidence calculation
- ✓ Multiple topic assignment
- ✓ Topic sorting by confidence

**Relevance Calculator**
- ✓ Target match scoring (40 points)
- ✓ Keyword match scoring (40 points)
- ✓ Source metadata scoring (15 points)
- ✓ Content depth scoring (5 points)
- ✓ Level assignment (High/Medium/Low)

### Integration Tests

**Full Analysis Workflow**
1. Create investigation with keywords and target
2. Add evidence items
3. Call POST /api/analysis/:investigationId
4. Verify all 5 analysis types completed
5. Call GET /api/analysis/:investigationId/findings
6. Verify findings generated
7. Call GET /api/analysis/:investigationId/timeline
8. Verify timeline data aggregated

**Single Evidence Analysis**
1. Add evidence to investigation
2. Call POST /api/evidence/:id/analyze
3. Verify evidence document updated with analysis fields
4. Verify no error on re-analysis

**Frontend Tests**
1. Navigate to Investigation → Analysis tab
2. Verify AnalysisDashboard loads
3. Click "Analyze Investigation"
4. Verify loading state appears
5. Verify tabs become populated with data
6. Verify charts render correctly
7. Verify findings display with correct severity levels

---

## Performance Considerations

### Analysis Time Complexity

- **Sentiment:** O(n) where n = word count
- **Keywords:** O(n log n) for sorting (n = unique terms)
- **Topics:** O(n·m) where m = number of topics (naive matching)
- **Relevance:** O(n) for string matching
- **Timeline:** O(n log n) for date grouping (n = evidence count)
- **Findings:** O(n log n) for sorting (n = finding rules)

**Total:** Approximately O(n·m) for full investigation analysis, where n = evidence count, m = avg evidence length

### Optimization Strategies

- **Caching:** Store analysis results, invalidate on evidence update
- **Batching:** Process evidence in chunks for large investigations
- **Async:** Run analysis in background workers if investigation > 500 items
- **Indexing:** Pre-compute keyword frequencies for investigations

---

## Limitations & Future Work

### Current Limitations

1. **Lexicon-Based Sentiment:** Context-insensitive, no negation handling, no sarcasm detection
2. **Single Language:** English only; no multilingual support
3. **Keyword Extraction:** Simple frequency-based; no phrase extraction or semantic similarity
4. **Topic Classification:** Rule-based keywords; no semantic topic modeling
5. **Relevance Scoring:** Manual weighting; no learned weights
6. **Timeline Analysis:** Daily granularity; no hourly or cross-timezone analysis
7. **Findings:** Deterministic rules; no probabilistic or confidence-based findings

### Future Enhancements (Post-Phase 3)

- **Phase 4:** PDF report generation with findings summary
- **Advanced Sentiment:** Incorporate negation handling, sarcasm detection, aspect-based sentiment
- **NLP Integration:** Optional BERT or other transformer models for semantic analysis
- **Multilingual Support:** Extend lexicons and stop words to multiple languages
- **Topic Modeling:** Implement LDA or LDAvis for discovery-based topics
- **Statistical Testing:** Add p-values and confidence intervals to findings
- **Visualization:** Interactive timeline with date range selection
- **Export:** Multiple formats (JSON, CSV, PDF)

---

## Troubleshooting

### Analysis Returns Empty Results

**Cause:** Evidence missing content field or malformed

**Solution:** 
1. Check evidence content length > 0
2. Verify evidence.content is string type
3. Regenerate analysis with POST /api/analysis/:investigationId

### Findings Not Generating

**Cause:** Aggregated analysis incomplete or thresholds not met

**Solution:**
1. Check at least 3 evidence items analyzed
2. Verify analysis contains sentiment/keywords/topics
3. Check finding thresholds in findingsGenerator.js

### Timeline Shows No Data

**Cause:** Evidence missing publicationDate

**Solution:**
1. Verify all evidence has valid publicationDate
2. Check date format: ISO 8601 (YYYY-MM-DD)
3. Regenerate timeline with GET /api/analysis/:investigationId/timeline

### Charts Not Rendering

**Cause:** Chart.js dependency missing or data format incorrect

**Solution:**
1. Verify Chart.js installed: npm list chart.js
2. Check data passed to chart components matches schema
3. Check browser console for errors

---

## Files Summary

**Backend Services:**
- `server/services/textPreprocessor.js` (185 lines)
- `server/services/sentimentAnalyzer.js` (140 lines)
- `server/services/keywordExtractor.js` (165 lines)
- `server/services/topicClassifier.js` (190 lines)
- `server/services/relevanceCalculator.js` (155 lines)
- `server/services/timelineAnalyzer.js` (210 lines)
- `server/services/investigationSummary.js` (120 lines)
- `server/services/findingsGenerator.js` (180 lines)

**Backend Controllers & Routes:**
- `server/controllers/analysisController.js` (200 lines)
- `server/routes/analysis.js` (45 lines)

**Frontend Components:**
- `client/src/components/AnalysisDashboard.jsx` (320 lines)
- `client/src/components/AnalysisDashboard.css` (250 lines)
- `client/src/components/charts/SentimentChart.jsx` (60 lines)
- `client/src/components/charts/KeywordsChart.jsx` (70 lines)
- `client/src/components/charts/TopicsChart.jsx` (70 lines)
- `client/src/components/charts/TimelineChart.jsx` (80 lines)
- `client/src/components/charts/ChartsCommon.css` (50 lines)

**Total:** ~2,600 lines of analysis code + frontend

---

## Release Notes

**Phase 3 v1.0 - Initial Release**

✅ Sentiment analysis (lexicon-based)
✅ Keyword extraction (frequency + context boost)
✅ Topic classification (rule-based)
✅ Relevance scoring (weighted components)
✅ Timeline analysis (sentiment trends)
✅ Findings generation (deterministic)
✅ React frontend with visualizations
✅ API endpoints for all analysis functions
✅ Evidence model analysis fields
✅ Comprehensive documentation

⏭️ Future: PDF reports, advanced NLP, multilingual support

---

## Support & Questions

For issues or questions about Phase 3 Analysis Engine, refer to specific method sections above or check implementation files for detailed comments.

**Key Contacts:**
- Architecture: See `server/services/` for implementation details
- Frontend: See `client/src/components/AnalysisDashboard.jsx`
- API Docs: See Analysis Controller routes in this document
