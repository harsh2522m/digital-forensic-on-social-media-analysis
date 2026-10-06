# Phase 6: Deployment Preparation & Testing Guide

**Project:** Digital Forensic on Social Media Analysis  
**Phase:** 6 - Deployment Preparation  
**Status:** Production-Ready  
**Date:** October 2026

---

## Table of Contents

1. [Deployment Architecture](#deployment-architecture)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Local Production Testing (17-Step Matrix)](#local-production-testing-17-step-matrix)
4. [MongoDB Atlas Setup](#mongodb-atlas-setup)
5. [Render Deployment](#render-deployment)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

---

## Deployment Architecture

### Infrastructure Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        RENDER PLATFORM                      │
├──────────────────────────┬──────────────────────────────────┤
│   Frontend Static Site   │     Backend Web Service          │
│   ─────────────────────  │     ────────────────────        │
│   React 18 + Vite       │     Node.js + Express            │
│   Builds to: dist/      │     Port: 5000                   │
│   URL: *.onrender.com   │     URL: *.onrender.com          │
│                         │                                  │
│   Environment:          │     Environment:                 │
│   - VITE_API_URL        │     - NODE_ENV=production        │
│                         │     - PORT=5000                  │
│                         │     - MONGODB_URI                │
│                         │     - CLIENT_URL                 │
└────────────┬────────────┴────────────┬─────────────────────┘
             │                         │
             └──────────────┬──────────┘
                            │
                    ┌───────▼────────┐
                    │ MongoDB Atlas  │
                    │ Cloud Database │
                    │ Free M0 Tier   │
                    └────────────────┘
```

### Data Flow

1. **User visits frontend** (Render Static Site)
2. **Frontend makes API calls** to backend (via VITE_API_URL)
3. **Backend processes requests** and queries MongoDB Atlas
4. **Response returned** to frontend (CORS-protected)
5. **Reports generated** on-demand in-memory (no disk storage)

### Files Modified for Deployment

| File | Changes | Purpose |
|------|---------|---------|
| `.gitignore` | Created | Exclude .env, node_modules, dist from Git |
| `render.yaml` | Created | Deployment configuration for Render |
| `client/vite.config.js` | Updated | Added SPA mode and VITE_API_URL support |
| `client/src/services/api.js` | Updated | Use VITE_API_URL environment variable |
| `.env.example` | Updated | Documented all required environment variables |
| `server/server.js` | No changes needed | Already configured for production |

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All Phase 1-5 features working correctly
- [ ] No console errors in browser
- [ ] No unhandled promise rejections
- [ ] All API endpoints tested
- [ ] 68/68 tests passing (from Phase 5)

### Configuration
- [ ] `.env.example` created with all variables documented
- [ ] `.gitignore` excludes `.env` and `node_modules`
- [ ] `render.yaml` created with correct build/start commands
- [ ] Environment variables have sensible defaults
- [ ] No hard-coded localhost URLs in production code

### Security
- [ ] No secrets committed to Git (grep verified)
- [ ] CORS configured with CLIENT_URL (no wildcards in production)
- [ ] Helmet security headers enabled
- [ ] MongoDB credentials not in source code
- [ ] HTTPS enforced (Render default)

### Database
- [ ] MongoDB Atlas account created
- [ ] Database user created with strong password
- [ ] Network access configured
- [ ] Connection string tested locally
- [ ] Database selected (digital-forensics)

### Build & Performance
- [ ] `npm run build` succeeds without errors
- [ ] Frontend bundle size reasonable (<5MB)
- [ ] Backend starts without errors
- [ ] No console warnings during startup
- [ ] Health endpoint responds successfully

---

## Local Production Testing (17-Step Matrix)

### Purpose
Verify all workflows function correctly in production environment before cloud deployment.

### Prerequisites
- Node.js v16+ installed
- Local MongoDB running (or MongoDB Atlas connection string)
- `.env` file configured with production values
- All dependencies installed (`npm run install-all`)

### Test Matrix

#### Step 1: Build Frontend Production Bundle
```bash
cd client
npm run build
```
**Expected Result:** 
- No errors or warnings
- `dist/` directory created with HTML, CSS, JS files
- `dist/index.html` exists (SPA entry point)

**Verification:**
```bash
ls -la client/dist/
# Should show: index.html, assets/ directory
```

---

#### Step 2: Verify Backend Can Start in Production Mode
```bash
# Set production environment
set NODE_ENV=production  # Windows: set
# Linux/Mac: export NODE_ENV=production

# Start backend
cd server
npm start
```

**Expected Result:**
- Server starts on port 5000
- Output shows: "✓ Server running on http://localhost:5000"
- Output shows: "✓ Environment: production"
- Output shows: "✓ CORS Origin: [your CLIENT_URL]"
- Output shows: "✓ Security: Helmet enabled"

**Verification:**
```bash
curl http://localhost:5000/api/health
# Should return JSON with status, timestamp, environment
```

---

#### Step 3: Verify Database Connection in Production
```bash
# In another terminal, while backend is running
curl http://localhost:5000/
```

**Expected Result:**
- Backend endpoint responds (doesn't require database)
- Output shows API endpoints available
- No connection errors in server logs

**Verification:**
- Check server console for no MongoDB errors
- If using MongoDB Atlas, verify connection string in logs

---

#### Step 4: Test Health Endpoint
```bash
curl http://localhost:5000/api/health
```

**Expected Result:**
```json
{
  "status": "ok",
  "timestamp": "2026-10-03T...",
  "message": "Digital Forensic Analysis API is running",
  "environment": "production",
  "version": "1.0.0"
}
```

---

#### Step 5: Serve Frontend Build in Production
```bash
# In a new terminal
cd client
npx serve -s dist -l 5173
```

**Expected Result:**
- Frontend served on http://localhost:5173
- Static files served from `dist/` directory

---

#### Step 6: Test Frontend Loads
```bash
# Visit in browser or curl
curl http://localhost:5173/
```

**Expected Result:**
- HTML page loads (200 status)
- Contains React app markup
- No 404 errors

---

#### Step 7: Test SPA Route Fallback
```bash
curl http://localhost:5173/investigations
```

**Expected Result:**
- Still returns `index.html` (200 status)
- SPA fallback working (not 404)

---

#### Step 8: Test Frontend → Backend CORS Request
```bash
# From frontend directory, test API call
curl -X GET http://localhost:5173/api/health \
  -H "Origin: http://localhost:5173"
```

**Expected Result:**
- Response includes CORS headers:
  - `Access-Control-Allow-Origin: http://localhost:5173`
  - Status 200 OK

---

#### Step 9: Create Investigation via API
```bash
curl -X POST http://localhost:5000/api/investigations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Investigation",
    "target": "TestTarget",
    "investigator": "Tester",
    "startDate": "2026-10-01"
  }'
```

**Expected Result:**
- Returns 201 Created
- Response includes investigationId, createdAt
- Data persisted in MongoDB

**Verification:**
```bash
curl http://localhost:5000/api/investigations
# Should include the created investigation
```

---

#### Step 10: Add Evidence
```bash
# Use investigationId from Step 9
curl -X POST http://localhost:5000/api/evidence \
  -H "Content-Type: application/json" \
  -d '{
    "investigationId": "INV-...",
    "sourceName": "Test Source",
    "sourceType": "Blog Post",
    "url": "https://example.com/article",
    "author": "Test Author",
    "content": "This is test content for analysis",
    "publicationDate": "2026-10-01"
  }'
```

**Expected Result:**
- Returns 201 Created
- Response includes evidenceId, contentHash (SHA-256)
- Evidence linked to investigation

---

#### Step 11: Run Analysis
```bash
# Use investigationId from Step 9
curl -X POST http://localhost:5000/api/analysis/INV-... \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Result:**
- Returns 201 Created
- Analysis results include:
  - sentiment (positive, neutral, negative counts)
  - topKeywords
  - topTopics
  - findings
  - timeline

---

#### Step 12: Generate Report
```bash
# Use investigationId from Step 9
curl -X POST http://localhost:5000/api/reports/INV-... \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Result:**
- Returns 201 Created
- Response includes reportId, pdfFileName
- Report metadata stored in MongoDB

---

#### Step 13: Download Report as PDF
```bash
# Use reportId from Step 12
curl http://localhost:5000/api/reports/INV-.../report_... \
  -o report.pdf
```

**Expected Result:**
- Returns 200 OK
- Content-Type: application/pdf
- PDF file downloads successfully
- PDF contains all investigation data

**Verification:**
```bash
file report.pdf
# Should output: PDF document
```

---

#### Step 14: Test Frontend UI in Production Mode
1. Open http://localhost:5173 in browser
2. Create new investigation via UI form
3. Add evidence via UI form
4. Run analysis via UI button
5. Generate report via UI button
6. Download report from UI

**Expected Result:**
- All UI interactions work
- API calls succeed (check Network tab in DevTools)
- No console errors
- Report downloads successfully

---

#### Step 15: Test Frontend Routing (Direct Navigation)
1. Open http://localhost:5173 in browser
2. Click through pages (Home, Investigations, Dashboard)
3. Navigate directly to `/investigations` in URL bar
4. Navigate directly to `/investigate/<id>` in URL bar

**Expected Result:**
- All routes load correctly
- No 404 errors
- Content renders properly
- SPA routing works as expected

---

#### Step 16: Verify Production Error Handling
1. Try to create investigation with missing required field:
```bash
curl -X POST http://localhost:5000/api/investigations \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}'  # Missing required fields
```

**Expected Result:**
- Returns 400 Bad Request
- Response includes error message
- No stack trace in response (production safety)

2. Try to generate report without analysis:
```bash
# Create investigation + evidence, but skip analysis, then generate report
```

**Expected Result:**
- Returns 400 Bad Request
- Error message: "Evidence has not been analyzed"
- No crash or 500 error

---

#### Step 17: Performance & Load Verification
1. Check frontend bundle size:
```bash
ls -lh client/dist/assets/
```

**Expected Result:**
- Main JS bundle < 500KB
- Total bundle < 2MB
- Reasonable performance metrics

2. Check backend startup time:
```bash
# Start backend and note time to "Server running"
npm start
```

**Expected Result:**
- Starts within 5 seconds
- No memory leaks (check process memory)
- Health endpoint responds quickly

3. Check MongoDB Atlas connection:
```bash
curl http://localhost:5000/api/investigations
```

**Expected Result:**
- Response time < 1 second
- No timeout errors
- Data retrieves successfully

---

## MongoDB Atlas Setup

### Quick Start

1. **Create Account**: https://mongodb.com/cloud/atlas
2. **Create Cluster**: Free tier (M0 Sandbox)
3. **Create User**: 
   - Database Access → Add Database User
   - Username: `forensics`
   - Password: [generate strong password]
4. **Allow Network Access**:
   - Network Access → Add IP Address
   - For development: Add your current IP
   - For production: Add Render IP or 0.0.0.0/0
5. **Get Connection String**:
   - Clusters → Connect → Connect your application
   - Copy connection string
   - Replace `<password>` with your database user password
   - Replace `myFirstDatabase` with `digital-forensics`

### Verification

```bash
# Test connection locally
MONGODB_URI="mongodb+srv://forensics:password@cluster.mongodb.net/digital-forensics?retryWrites=true&w=majority"
mongosh "$MONGODB_URI"
# Should connect to MongoDB
```

---

## Render Deployment

### Step-by-Step Deployment

1. **Push Code to GitHub**
   - Ensure `.gitignore` excludes `.env`
   - Ensure `render.yaml` exists
   - Push all code to main branch

2. **Connect to Render**
   - Create Render account: https://render.com
   - Authorize GitHub access
   - Select your repository

3. **Deploy Backend**
   - New → Web Service
   - Connect repository
   - Branch: main
   - Build: `cd server && npm install`
   - Start: `cd server && npm start`
   - Set environment variables (see Pre-Deployment)

4. **Deploy Frontend**
   - New → Static Site
   - Connect repository
   - Branch: main
   - Build: `npm install && npm run install-all && npm run build`
   - Publish: `client/dist`
   - Set environment variables

### Monitoring

- Check Render dashboard for deployment status
- View logs for any build/startup errors
- Monitor service health in real-time
- Set up alerts for service failures

---

## Post-Deployment Verification

### Immediate Checks (After Deploy)

1. **Health Endpoint**
   ```bash
   curl https://your-backend.onrender.com/api/health
   ```
   Expected: 200 OK with status=ok

2. **Frontend Loads**
   ```bash
   curl https://your-frontend.onrender.com/
   ```
   Expected: 200 OK with HTML content

3. **Check CORS**
   - Open frontend in browser
   - Check Network tab for API calls
   - Verify CORS headers present

4. **Create Test Investigation**
   - Via frontend UI
   - Verify data persists
   - Check MongoDB Atlas for data

### Ongoing Monitoring

- [ ] Monitor backend logs for errors
- [ ] Monitor database connection errors
- [ ] Monitor CORS errors in frontend
- [ ] Monitor build/deploy failures
- [ ] Set up uptime monitoring (Render native or external)
- [ ] Check usage metrics (CPU, memory, network)

---

## Troubleshooting

### Deployment Failures

**Error: "Build failed"**
- Check build logs in Render dashboard
- Verify package.json scripts exist
- Ensure dependencies install successfully locally

**Error: "Cannot find module"**
- Verify npm install succeeds locally
- Check package.json dependencies
- Ensure node_modules not in git

**Error: "Cannot connect to MongoDB"**
- Verify MONGODB_URI is correct
- Check MongoDB Atlas network access
- Verify database user password (no special characters without encoding)
- Test connection string locally first

### Runtime Issues

**Error: "CORS error" in frontend console**
- Verify backend CLIENT_URL matches frontend domain
- Check CORS headers in response
- Verify backend is running

**Error: "Cannot reach API"**
- Check backend URL in frontend (VITE_API_URL)
- Verify backend service is running
- Check network connectivity between services

**Error: "500 Internal Server Error"**
- Check backend logs in Render dashboard
- Verify environment variables set correctly
- Verify MongoDB connection working

### Data Issues

**Reports not generating:**
- Verify evidence analyzed before report generation
- Check for errors in analysis response

**Evidence missing:**
- Verify MongoDB connection
- Check database user permissions
- Verify correct database name used

---

## Rollback Procedures

### If Deployment Fails

1. **Keep Previous Version Running**
   - Render maintains previous deployments
   - Can quickly switch if needed

2. **Rollback Steps**
   - In Render dashboard → Service → Deployments
   - Find previous successful deployment
   - Click "Rollback" or "Deploy this commit"

3. **Alternative: Revert Git Commit**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```
   - Render automatically redeploys on push

### Data Rollback

MongoDB Atlas automatic backups available:
- Free tier: 7-day backup retention
- In Atlas dashboard → Backup section
- Can restore to specific point in time

---

## Success Criteria

✅ **Phase 6 Complete When:**
1. Local production build succeeds
2. All 17 test steps pass
3. Frontend loads without errors
4. Backend API responds correctly
5. CORS configured correctly
6. MongoDB connection verified
7. Health endpoint working
8. Reports generate successfully
9. No secrets in source code
10. Deployment to Render succeeds
11. Post-deployment verification passes
12. Documentation complete

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Oct 2026 | Initial deployment guide created |

---

**Project Status:** ✅ Phase 6 - Deployment Preparation COMPLETE
