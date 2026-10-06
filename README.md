# Digital Forensic on Social Media Analysis

Academic final-year cybersecurity/digital-forensics project demonstrating how publicly available online information can be collected, organized as digital evidence, analyzed, and converted into a structured forensic-style investigation report.

**Important:** This application only collects and analyzes publicly available information. It does NOT access private accounts, messages, or unauthorized data.

## Project Overview

### Purpose

Build a professional web application that demonstrates:
- Public evidence collection and organization
- Digital evidence metadata management
- SHA-256 integrity verification
- Evidence analysis (sentiment, keywords, topics, timeline)
- Structured forensic findings
- Professional PDF report generation

### Key Features

1. **Investigation Management** - Create and manage forensic investigations
2. **Evidence Management** - Store publicly available evidence with hash verification
3. **Analysis Engine** - Sentiment, keyword, topic, and timeline analysis
4. **Report Generation** - Professional forensic-style PDF reports
5. **Dashboard** - Investigation overview and findings

## Tech Stack

- **Frontend:** React 18 + Vite + React Router
- **Backend:** Node.js + Express.js
- **Database:** MongoDB
- **PDF Generation:** jsPDF + html2canvas
- **Charts:** Chart.js + react-chartjs-2
- **Language:** JavaScript (ES6+)

## Project Structure

```
digital-forensic-social-media-analysis/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── utils/          # Utilities
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/                 # Express backend
│   ├── controllers/        # Request handlers
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── middleware/         # Custom middleware
│   ├── config/             # Configuration
│   ├── server.js
│   └── package.json
├── dataset/                # Sample data files
├── docs/                   # Documentation
├── .env.example           # Environment template
├── package.json           # Root package.json
└── README.md
```

## Prerequisites

- **Node.js** v16 or higher
- **npm** or **yarn**
- **MongoDB** v5.0 or higher (local or MongoDB Atlas)

### Install Node.js

- Download from [nodejs.org](https://nodejs.org)
- Choose LTS version
- Verify: `node --version` and `npm --version`

### Set Up MongoDB

**Option 1: Local MongoDB**
- Download from [mongodb.com](https://www.mongodb.com/try/download/community)
- Follow installation guide for your OS
- Verify: `mongod --version`

**Option 2: MongoDB Atlas (Cloud)**
- Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
- Create free account
- Create cluster
- Get connection string

## Installation

### 1. Clone and Navigate to Project

```bash
cd "c:\Users\harsh\Desktop\Digital fornsic on social media anlysix"
```

### 2. Install Dependencies

Install all dependencies (frontend, backend, and root):

```bash
npm run install-all
```

Or install separately:

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 3. Configure Environment Variables

Create `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Backend
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/digital-forensics
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/digital-forensics?retryWrites=true&w=majority
```

### 4. Start MongoDB

**If using local MongoDB:**

```bash
mongod
```

**If using MongoDB Atlas:**
- Connection string is in your `.env` file

## Running the Application

### Development Mode (Both Frontend and Backend)

From the root directory:

```bash
npm run dev
```

This starts:
- Backend on `http://localhost:5000`
- Frontend on `http://localhost:5173`

### Run Services Separately

**Backend only:**
```bash
npm run server
```
- Server: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

**Frontend only:**
```bash
npm run client
```
- App: `http://localhost:5173`

### Load Demo Data (Phase 5)

To load synthetic demo data for testing:

```bash
cd server
node load-demo-data.js
```

This creates a demo investigation with 6 synthetic evidence items for testing.

### Run Security Tests (Phase 5)

**MongoDB Verification:**
```bash
cd server
node mongodb-verify.js
```

**Data Integrity Tests:**
```bash
cd server
node integrity-test.js
```

**Negative/Abuse Tests:**
```bash
cd server
node abuse-test.js
```

**Frontend Error Handling:**
```bash
cd server
node frontend-error-test.js
```

**Integration Tests (All Phases):**
```bash
cd server
npm start &
node integration-test.js
```

## API Endpoints

### Health & Status
- `GET /` - API root
- `GET /api/health` - Health check

### Investigations
- `POST /api/investigations` - Create investigation
- `GET /api/investigations` - Get all investigations
- `GET /api/investigations/:id` - Get investigation by ID
- `PUT /api/investigations/:id` - Update investigation
- `DELETE /api/investigations/:id` - Delete investigation

### Evidence (Phase 2)
- `POST /api/evidence` - Create evidence
- `GET /api/evidence/investigation/:investigationId` - Get evidence for investigation
- `GET /api/evidence/:id` - Get evidence by ID
- `DELETE /api/evidence/:id` - Delete evidence

### Analysis (Phase 3)
- `POST /api/analysis/:investigationId` - Run analysis
- `GET /api/analysis/:investigationId` - Get analysis results

### Reports (Phase 4)
- `POST /api/reports/:investigationId` - Generate report
- `GET /api/reports/:investigationId` - Get report metadata

## Usage

### Phase 1: Investigation Management ✓

1. Open `http://localhost:5173`
2. Navigate to investigations section
3. Create new investigation with:
   - Investigation name
   - Target (person, company, event, etc.)
   - Keywords
   - Date range
   - Investigator name

### Phase 2: Evidence Management ✓

1. Add publicly available evidence sources
2. Evidence receives SHA-256 hash automatically
3. Evidence linked to investigation
4. Browse and manage evidence items

### Phase 3: Analysis ✓

1. Navigate to Analysis tab in Investigation Dashboard
2. Click "Analyze Investigation" to analyze all evidence
3. View results in 6 tabs:
   - **Overview** - Summary statistics
   - **Sentiment** - Distribution pie chart
   - **Keywords** - Top keywords bar chart
   - **Topics** - Topic distribution chart
   - **Timeline** - Sentiment trends over time
   - **Findings** - Data-driven forensic findings
4. Results automatically saved to evidence items

### Phase 4: Report Generation (Upcoming)

1. Generate professional forensic-style PDF report
2. Download report with all findings

## Database Schema

### Investigations Collection

```javascript
{
  investigationId: String,      // INV-2026-001
  name: String,
  target: String,
  description: String,
  keywords: [String],
  startDate: Date,
  endDate: Date,
  investigator: String,
  status: String,               // active, completed, on_hold, closed
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Evidence Collection (Phase 2)

```javascript
{
  evidenceId: String,           // EV-2026-001-001
  investigationId: String,
  sourceName: String,
  sourceType: String,           // News, Blog, Forum, Public Social Media, Other
  url: String,
  author: String,
  publicationDate: Date,
  collectionTimestamp: Date,    // Immutable
  content: String,              // Immutable
  notes: String,
  sha256Hash: String,           // Immutable, auto-generated
  sentiment: Object,            // { label, score }
  topics: [String],
  extractedKeywords: [Object],
  relevance: Number,
  analysisStatus: String,       // pending, completed, failed
  createdAt: Date,
  updatedAt: Date
}
```

### Reports Collection (Phase 4)

```javascript
{
  reportId: String,             // RPT-2026-001
  investigationId: String,
  generatedAt: Date,
  reportMetadata: Object,
  pdfPath: String               // Optional
}
```

## Development Phases

### Phase 1: Backend Foundation ✓
- [x] Express server setup
- [x] MongoDB connection
- [x] Investigation CRUD endpoints
- [x] React + Vite frontend setup
- [x] Basic navigation and home page

### Phase 2: Evidence Management ✓
- [x] Evidence model with SHA-256
- [x] Evidence CRUD endpoints
- [x] Evidence entry form
- [x] Evidence table display

### Phase 3: Analysis Engine ✓
- [x] Sentiment analysis service (lexicon-based)
- [x] Keyword extraction service (frequency + boost)
- [x] Topic classification service (rule-based)
- [x] Relevance scoring service
- [x] Timeline analysis service
- [x] Findings generation service
- [x] Analysis visualization components (6 tabs)
- [x] Chart components (sentiment, keywords, topics, timeline)

### Phase 4: Report Generation (Planned)
- [ ] Report template design
- [ ] PDF generation service
- [ ] Report endpoints
- [ ] Findings compilation

### Phase 5: Security Hardening & Testing (Planned) ➜ **IN PROGRESS**
- [x] Real MongoDB persistence verification
- [x] Environment configuration (.env, .env.example)
- [x] CORS production configuration
- [x] Helmet HTTP security headers
- [x] Input validation middleware
- [x] Request size limits
- [x] Production-safe error handling
- [x] Security logging
- [x] Forensic data integrity tests
- [x] Negative/abuse testing suite
- [x] Frontend error handling verification
- [x] Production build creation
- [x] Report file handling verification
- [x] Dependency audit
- [x] Demo data loader
- [x] Security documentation

## Security Features (Phase 5)

### Input Validation
- ✅ All fields validated for type, length, and format
- ✅ URLs validated as absolute URLs
- ✅ Dates validated as ISO 8601 format
- ✅ Request body size limited to 10MB
- ✅ Evidence content limited to 50KB
- ✅ Descriptive error messages for invalid input

### HTTP Security
- ✅ Helmet middleware with security headers
- ✅ Content-Security-Policy configured
- ✅ X-Frame-Options: DENY (clickjacking prevention)
- ✅ X-Content-Type-Options: nosniff
- ✅ CORS restricted to configured origin
- ✅ No stack traces in production responses

### Error Handling
- ✅ Production-safe error responses
- ✅ No database connection strings exposed
- ✅ No filesystem paths exposed
- ✅ No environment variables exposed
- ✅ Appropriate HTTP status codes
- ✅ Consistent error response format

### Database Integrity
- ✅ SHA-256 hash verification
- ✅ Archive preservation (immutable content + hash)
- ✅ Relationship integrity maintained
- ✅ MongoDB persistence verified
- ✅ Data consistency across MongoDB → API → PDF

### Environment Configuration
- ✅ All sensitive values in .env
- ✅ No hard-coded credentials
- ✅ Production vs development modes supported
- ✅ CLIENT_URL for CORS configuration
- ✅ Request limits configurable

## Deployment Guide

### Overview

This application is configured for deployment to Render (cloud platform) with MongoDB Atlas (cloud database). The monorepo structure with separate frontend (static site) and backend (web service) is managed via `render.yaml`.

**Key Deployment Architecture:**
- **Frontend**: React + Vite → Render Static Site (served from `client/dist`)
- **Backend**: Node.js + Express → Render Web Service
- **Database**: MongoDB Atlas (cloud-hosted, free tier available)
- **Configuration**: Environment variables (no hard-coded values)

### Step 1: Prepare MongoDB Atlas

1. **Create MongoDB Atlas Account**
   - Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for free account
   - Verify email

2. **Create a Cluster**
   - Click "Create a Project" → name it "digital-forensics"
   - Click "Build a Cluster" → select "Free Tier" (M0 Sandbox)
   - Choose provider and region
   - Wait for cluster to be ready (5-10 minutes)

3. **Create Database User**
   - In "Security" tab → "Database Access"
   - Click "Add New Database User"
   - Username: `forensics` (or your choice)
   - Password: Generate strong password (save this!)
   - Set permissions to "Atlas Admin"

4. **Configure Network Access**
   - In "Security" tab → "Network Access"
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0) for Render
   - Or add Render's IP after deployment (more secure)

5. **Get Connection String**
   - In "Clusters" → "Connect" → "Connect your application"
   - Choose "Node.js" driver
   - Copy the connection string
   - Replace `<password>` with database user password
   - Replace `myFirstDatabase` with `digital-forensics`
   - Example: `mongodb+srv://forensics:password@cluster.mongodb.net/digital-forensics?retryWrites=true&w=majority`

### Step 2: Prepare GitHub Repository

1. **Push Code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Phase 6: Deployment preparation for Render + MongoDB Atlas"
   git branch -M main
   git remote add origin https://github.com/yourusername/digital-forensics.git
   git push -u origin main
   ```

2. **Verify Files Are Committed**
   - ✅ `.gitignore` exists (excludes .env, node_modules, dist)
   - ✅ `render.yaml` exists (deployment configuration)
   - ✅ `package.json` scripts exist (dev, build, start)
   - ✅ All source code files committed
   - ✅ `.env` file NOT committed (only `.env.example`)

### Step 3: Deploy to Render

1. **Connect GitHub Repository**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub account (or email)
   - Authorize GitHub access
   - Select this repository

2. **Create Backend Web Service**
   - Click "New +" → "Web Service"
   - Connect GitHub repository
   - Choose `main` branch
   - Build command: `cd server && npm install`
   - Start command: `cd server && npm start`
   - Environment variables (see below)

3. **Create Frontend Static Site**
   - Click "New +" → "Static Site"
   - Connect same GitHub repository
   - Choose `main` branch
   - Build command: `npm install && npm run install-all && npm run build`
   - Publish directory: `client/dist`
   - Environment variables: Set `VITE_API_URL` to backend service URL

4. **Set Environment Variables**

   **Backend Service:**
   ```
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb+srv://forensics:password@cluster.mongodb.net/digital-forensics?retryWrites=true&w=majority
   CLIENT_URL=https://your-frontend-url.onrender.com
   ```

   **Frontend Site:**
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```

5. **Deploy**
   - Click "Create Web Service" / "Create Static Site"
   - Render will automatically:
     - Clone your repository
     - Run build command
     - Start the service
     - Assign a URL (e.g., `https://digital-forensics.onrender.com`)

### Step 4: Verify Deployment

1. **Test Backend Health**
   - Visit `https://your-backend-url.onrender.com/api/health`
   - Should see JSON response with status, timestamp, environment

2. **Test Frontend**
   - Visit `https://your-frontend-url.onrender.com`
   - Should see the Digital Forensic application
   - Navigation should work

3. **Test Full Workflow**
   - Create investigation
   - Add evidence
   - Run analysis
   - Generate report

### Troubleshooting Deployment

**Build Fails: "Cannot find module"**
- Solution: Verify `npm run install-all` works locally
- Check that `server/package.json` and `client/package.json` both exist

**Backend Cannot Connect to MongoDB**
- Verify `MONGODB_URI` is correct (copy from MongoDB Atlas)
- Ensure MongoDB user password is correct (no special characters without encoding)
- Check Network Access allows Render IP or "Anywhere"
- Test locally first with same `MONGODB_URI`

**Frontend Shows "Failed to fetch /api/..."**
- Verify `VITE_API_URL` is set to backend service URL
- Ensure backend `CLIENT_URL` includes frontend domain
- Check CORS response headers (`Access-Control-Allow-Origin`)

**Health Endpoint Returns 404**
- Verify backend service is running
- Check logs in Render dashboard
- Ensure `server.js` has `/api/health` route

**Static Site Returns 404 for Routes**
- Ensure `vite.config.js` has `appType: 'spa'`
- SPA rewrite rules in `render.yaml` should send all requests to `index.html`

### Updating Deployment

1. **Make Code Changes Locally**
   ```bash
   # ... edit files ...
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```

2. **Automatic Redeployment**
   - Render automatically rebuilds and deploys on `git push`
   - Check Render dashboard for deployment logs

3. **Manual Redeployment**
   - In Render dashboard, click service → "Manual Deploy" → "Deploy latest commit"

### Environment Variables Reference

| Variable | Backend | Frontend | Example | Notes |
|----------|---------|----------|---------|-------|
| NODE_ENV | ✅ | ❌ | `production` | Controls Express error handling |
| PORT | ✅ | ❌ | `5000` | Render sets automatically |
| MONGODB_URI | ✅ | ❌ | `mongodb+srv://...` | MongoDB Atlas connection string |
| CLIENT_URL | ✅ | ❌ | `https://frontend.onrender.com` | Frontend domain for CORS |
| VITE_API_URL | ❌ | ✅ | `https://backend.onrender.com` | Backend API endpoint for production |

### Security Checklist

- [ ] `.env` file not committed to Git (only `.env.example`)
- [ ] MongoDB Atlas user has strong password
- [ ] MongoDB network access restricted or verified
- [ ] HTTPS enforced (Render default)
- [ ] CORS configured for your domain (no wildcards in production)
- [ ] Helmet security headers enabled (verify in backend logs)
- [ ] All environment variables set in Render dashboard
- [ ] No API keys or credentials in source code

## Troubleshooting

### MongoDB Connection Error

**Error:** `MongooseError: Cannot connect to MongoDB`

**Solution:**
1. Verify MongoDB is running (`mongod` command)
2. Check `MONGODB_URI` in `.env` file
3. If using MongoDB Atlas, verify connection string and network access

### Port Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
- Change PORT in `.env` file
- Or kill process on port: `taskkill /PID <processId> /F` (Windows)

### Frontend Cannot Connect to Backend

**Error:** `Failed to fetch from /api/...`

**Solution:**
1. Verify backend is running on `http://localhost:5000`
2. Check CORS settings in `server.js`
3. Verify proxy in `vite.config.js`

### Node Modules Error

**Error:** `Cannot find module '...`

**Solution:**
```bash
# Delete node_modules and reinstall
rm -r node_modules package-lock.json
npm install
```

## Important: Academic Integrity

This project is designed for academic learning and demonstration purposes. 

**Disclaimers:**
- SHA-256 hashing does NOT prove original source authenticity
- Sentiment analysis is rule-based and simplified, NOT definitive
- Evidence is limited to publicly available information only
- Correlation observed in data does NOT imply causation
- The report is forensic-style but NOT legal evidence
- No private accounts or unauthorized data is collected

All collection, analysis, and reporting must comply with:
- Platform terms of service
- Local laws and regulations
- Ethical research principles
- Academic integrity standards

## Documentation

See the `/docs/` directory for:
- Architecture documentation
- Database design details
- API specifications
- Testing procedures
- Deployment guides
- Future scope

## Future Enhancements

- Multi-language support
- Advanced ML-based sentiment analysis
- Live public API data collection
- Evidence chain of custody tracking
- Collaboration features
- Evidence versioning
- Export to additional formats

## Contact & Support

For questions about this academic project, refer to the documentation in `/docs/` or contact your project supervisor.

---

**Project Title:** Digital Forensic on Social Media Analysis  
**Type:** Academic Final-Year Project  
**Current Phase:** 4/8 - Forensic Report Generation (COMPLETE) ✓  
**Security Hardening:** Phase 5 (COMPLETE) ✓  
**Status:** Production-Ready with Security Hardening
