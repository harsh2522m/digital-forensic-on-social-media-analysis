# Deployment Sequence: MongoDB Atlas + Render

**Project:** Digital Forensic on Social Media Analysis  
**Target Platform:** Render (Frontend + Backend) + MongoDB Atlas (Database)  
**Deployment Time:** ~30-45 minutes

---

## Pre-Deployment (Local Machine)

### Phase 1: Code Preparation (5 minutes)

1. **Verify Git Status**
   ```bash
   git status
   # Should show:
   # - No uncommitted changes to source code
   # - .env file in gitignore (not tracked)
   # - .gitignore, render.yaml present
   ```

2. **Verify Build Configuration**
   ```bash
   # Check package.json scripts
   cat package.json | grep -A 5 '"scripts"'
   # Should include: dev, build, start, server, client, install-all
   ```

3. **Final Commit**
   ```bash
   git add .
   git commit -m "Phase 6: Deployment preparation complete"
   git push origin main
   ```

### Phase 2: Local Production Test (10 minutes)

1. **Build Frontend**
   ```bash
   npm run build
   # Expected: 
   # - Completes without errors
   # - Creates client/dist/ with index.html
   # - JS bundle ~440KB
   ```

2. **Verify Backend Configuration**
   ```bash
   # Check server.js for production readiness
   grep "process.env.PORT\|process.env.MONGODB_URI\|process.env.CLIENT_URL\|process.env.NODE_ENV" server/server.js
   # All should use environment variables, not hard-coded values
   ```

3. **Check Environment Variables**
   ```bash
   cat .env.example
   # Should document:
   # - Backend: NODE_ENV, PORT, MONGODB_URI, CLIENT_URL
   # - Frontend: VITE_API_URL
   # - Production notes and examples
   ```

4. **Local Verification** (if MongoDB available)
   ```bash
   # Set production env
   $env:NODE_ENV = "production"
   $env:PORT = 5000
   
   # Start backend
   cd server
   npm start
   # Expected: "✓ Server running on http://localhost:5000"
   # Expected: "✓ Environment: production"
   
   # In another terminal, test health
   curl http://localhost:5000/api/health
   # Expected: {"status":"ok", ...}
   ```

---

## MongoDB Atlas Setup (10 minutes)

### Step 1: Create Account & Cluster

1. **Visit MongoDB Atlas**
   - Go to: https://mongodb.com/cloud/atlas
   - Click "Try Free"
   - Create account (email/Google/GitHub)
   - Verify email address

2. **Create Organization & Project**
   - Organization Name: "Digital Forensics"
   - Project Name: "digital-forensics"
   - Click "Create Project"

3. **Build Cluster**
   - Click "Build a Database"
   - Select "Free Tier" (M0 Sandbox)
   - Provider: AWS (default)
   - Region: Choose closest to your location
   - Click "Create"
   - Wait for cluster creation (5-10 minutes)

### Step 2: Configure Security

1. **Create Database User**
   - In MongoDB dashboard → "Security" → "Database Access"
   - Click "Add New Database User"
   - Username: `forensics`
   - Password: Generate strong password (save this!)
   - Built-in Role: "Atlas Admin"
   - Click "Add User"

2. **Configure Network Access**
   - In "Security" → "Network Access"
   - Click "Add IP Address"
   - Choose: "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"
   - **Note:** For production, add Render's specific IP if available

3. **Get Connection String**
   - Click "Connect"
   - Choose "Connect your application"
   - Driver: Node.js, Version: 5.0+
   - Copy connection string
   - Format: `mongodb+srv://forensics:password@cluster.mongodb.net/digital-forensics?retryWrites=true&w=majority`

### Step 3: Verify Connection (Local Test)

```bash
# Install mongosh if needed
npm install -g mongosh

# Test connection
mongosh "mongodb+srv://forensics:YOUR_PASSWORD@cluster.mongodb.net/digital-forensics"
# Should connect successfully
# Type: exit

# Verify database name
mongosh "mongodb+srv://forensics:YOUR_PASSWORD@cluster.mongodb.net/digital-forensics" --eval "db.adminCommand('ping')"
# Expected: {"ok": 1}
```

---

## Render Deployment (15 minutes)

### Step 1: Connect GitHub Repository

1. **Create Render Account**
   - Go to: https://render.com
   - Sign up with GitHub account
   - Authorize GitHub access
   - Select your repository

2. **Verify Repository Contents**
   - ✅ `.gitignore` exists
   - ✅ `render.yaml` exists (deployment config)
   - ✅ `package.json` has all scripts
   - ✅ `server/package.json` exists
   - ✅ `client/package.json` exists
   - ✅ `.env` NOT committed (only `.env.example`)

### Step 2: Deploy Backend Service

1. **Create Web Service**
   - In Render dashboard → "New +" → "Web Service"
   - Connect repository
   - Branch: `main`
   - Name: `digital-forensic-backend`

2. **Configure Build & Start**
   - Build Command: `cd server && npm install`
   - Start Command: `cd server && npm start`
   - Instance Type: Free

3. **Set Environment Variables**
   - NODE_ENV: `production`
   - PORT: `5000`
   - MONGODB_URI: `mongodb+srv://forensics:password@cluster.mongodb.net/digital-forensics?retryWrites=true&w=majority`
   - CLIENT_URL: `https://digital-forensic-frontend.onrender.com` (update with actual frontend URL later)

4. **Configure Health Check**
   - Health Check Path: `/api/health`
   - Health Check Interval: 30 seconds

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (3-5 minutes)
   - Note the backend URL: `https://digital-forensic-backend-XXXX.onrender.com`

### Step 3: Deploy Frontend Service

1. **Create Static Site**
   - In Render dashboard → "New +" → "Static Site"
   - Connect same repository
   - Branch: `main`
   - Name: `digital-forensic-frontend`

2. **Configure Build**
   - Build Command: `npm install && npm run install-all && npm run build`
   - Publish Directory: `client/dist`

3. **Set Environment Variables**
   - VITE_API_URL: `https://digital-forensic-backend-XXXX.onrender.com` (backend URL from Step 2)

4. **Configure Routes (SPA)**
   - Render will automatically serve `index.html` for 404s (SPA mode)
   - This allows React Router to handle routing

5. **Deploy**
   - Click "Create Static Site"
   - Wait for build & deployment (2-3 minutes)
   - Note the frontend URL: `https://digital-forensic-frontend-XXXX.onrender.com`

### Step 4: Update Backend CLIENT_URL

Since we now have the frontend URL, update the backend:

1. **Update Backend Environment Variable**
   - Go to backend service → Settings
   - Find `CLIENT_URL` environment variable
   - Update to actual frontend URL: `https://digital-forensic-frontend-XXXX.onrender.com`
   - Save (will trigger redeploy)

2. **Wait for Redeployment**
   - Backend will automatically redeploy with new CLIENT_URL
   - Check deployment logs for success

---

## Post-Deployment Verification (5 minutes)

### Immediate Checks

1. **Health Endpoint**
   ```bash
   curl https://digital-forensic-backend-XXXX.onrender.com/api/health
   ```
   Expected:
   ```json
   {
     "status": "ok",
     "timestamp": "2026-10-03T...",
     "message": "Digital Forensic Analysis API is running",
     "environment": "production",
     "version": "1.0.0"
   }
   ```

2. **Frontend Loads**
   - Visit: `https://digital-forensic-frontend-XXXX.onrender.com`
   - Expected: Application loads without errors
   - Check browser console for no errors

3. **Network Connectivity**
   - In browser DevTools → Network tab
   - Reload page
   - Check for failed API requests
   - All requests should succeed (status 200)

4. **CORS Headers**
   - Open browser DevTools → Network → select an API call
   - Check response headers:
     - `Access-Control-Allow-Origin: https://digital-forensic-frontend-XXXX.onrender.com`
     - No CORS error should appear

### Functional Testing

1. **Create Investigation**
   - Via frontend UI form
   - Fill: name, target, investigator, dates
   - Submit and verify creation

2. **Add Evidence**
   - Click investigation to open dashboard
   - Add evidence with sample data
   - Verify evidence appears in list

3. **Run Analysis**
   - Click "Analyze Investigation"
   - Verify analysis completes
   - Check sentiment, keywords, topics appear

4. **Generate Report**
   - Click "Generate Report"
   - Verify report created
   - Download report PDF
   - Verify PDF contains all data

### Data Verification

1. **MongoDB Atlas Verification**
   - Go to MongoDB Atlas dashboard
   - Select cluster → Collections
   - Verify data appears in:
     - `Investigations` collection (test investigation)
     - `Evidence` collection (test evidence)
     - `Analysis` collection (analysis results)
     - `Reports` collection (generated report)

2. **Logs Verification**
   - Check Render backend logs:
     - No connection errors
     - No validation errors
     - Health checks passing

---

## Rollback Plan (If Needed)

### Quick Rollback Steps

1. **Via Render Dashboard**
   - Go to service → Deployments
   - Find previous successful deployment
   - Click "Rollback" or "Redeploy"

2. **Via Git Revert**
   ```bash
   git revert HEAD --no-edit
   git push origin main
   # Render automatically redeploys
   ```

3. **Database Rollback**
   - MongoDB Atlas → Backup section
   - Restore to previous point in time if needed
   - Free tier: 7-day retention

---

## Deployment Troubleshooting

### Build Fails

**Error:** `Cannot find module`
- **Cause:** Dependencies not listed in package.json
- **Fix:** 
  - Verify locally: `npm run install-all && npm run build`
  - Check server/package.json and client/package.json
  - Commit missing dependencies

**Error:** `EACCES: permission denied`
- **Cause:** File permissions issue
- **Fix:** 
  - Ensure `.gitignore` excludes `node_modules`
  - Clear build cache: delete dist/, node_modules
  - Recommit and push

### Backend Startup Issues

**Error:** `Cannot connect to MongoDB`
- **Cause:** MONGODB_URI incorrect or network access denied
- **Fix:**
  - Verify connection string: `mongodb+srv://username:password@cluster.net/dbname`
  - Check MongoDB Atlas network access (add 0.0.0.0/0)
  - Verify database user password
  - Test locally first with same connection string

**Error:** `PORT already in use`
- **Cause:** Render sets PORT dynamically, but backend hardcoded value
- **Fix:**
  - Ensure server.js uses `process.env.PORT || 5000`
  - Set PORT environment variable in Render

**Error:** `CORS: Origin not allowed`
- **Cause:** CLIENT_URL not set or doesn't match frontend domain
- **Fix:**
  - Update CLIENT_URL to actual frontend Render URL
  - Trigger backend redeploy
  - Verify CORS headers in response

### Frontend Issues

**Error:** `API requests failing with 404`
- **Cause:** VITE_API_URL not set or incorrect
- **Fix:**
  - Set VITE_API_URL to backend URL in frontend environment
  - Rebuild frontend: click "Manual Deploy" in Render
  - Verify in browser console

**Error:** `Routes return 404`
- **Cause:** SPA fallback not configured
- **Fix:**
  - Ensure `vite.config.js` has `appType: 'spa'`
  - SPA rewrite rules in `render.yaml` will serve index.html
  - May need to redeploy static site

**Error:** `Blank page or loading forever`
- **Cause:** Frontend bundle not loading or API timeout
- **Fix:**
  - Check browser console for errors
  - Check Network tab for failed requests
  - Verify backend health endpoint
  - Clear browser cache

---

## Ongoing Monitoring

### Set Up Alerts

1. **Service Health**
   - Render: Settings → Alerts
   - Enable: "Deployment failure", "Runtime error"

2. **Database Monitoring**
   - MongoDB Atlas: Alerts → Create Alert
   - Monitor: Connection issues, disk space

3. **External Monitoring** (Optional)
   - Use: Pingdom, UptimeRobot, or StatusPage
   - Monitor: Backend health endpoint
   - Alert: via email or Slack

### Regular Maintenance

- **Weekly:** Check Render deployment logs
- **Monthly:** Review MongoDB Atlas metrics
- **Quarterly:** Run full security audit
- **As Needed:** Update dependencies, apply patches

---

## Success Checklist

✅ **Deployment Complete When:**

- [ ] GitHub repository pushed with all changes
- [ ] MongoDB Atlas cluster created with user and access configured
- [ ] Backend deployed to Render (health endpoint responding)
- [ ] Frontend deployed to Render (loads without errors)
- [ ] VITE_API_URL set in frontend (pointing to backend)
- [ ] CLIENT_URL set in backend (pointing to frontend)
- [ ] CORS working (no errors in browser console)
- [ ] Test investigation created via UI
- [ ] Test evidence added via UI
- [ ] Analysis runs successfully
- [ ] Report generates and downloads as PDF
- [ ] MongoDB data verified in Atlas
- [ ] All logs checked for errors
- [ ] Health endpoint responding 200 OK
- [ ] Frontend and backend URLs documented

---

## Environment Variables Summary

| Service | Variable | Value | Example |
|---------|----------|-------|---------|
| Backend | NODE_ENV | `production` | `production` |
| Backend | PORT | From Render | `5000` |
| Backend | MONGODB_URI | MongoDB Atlas | `mongodb+srv://...` |
| Backend | CLIENT_URL | Frontend URL | `https://frontend.onrender.com` |
| Frontend | VITE_API_URL | Backend URL | `https://backend.onrender.com` |

---

**Deployment Status:** ✅ Ready for Production

**Estimated Deployment Time:** 30-45 minutes  
**Estimated Monthly Cost:**
- Render: $0 (free tier for single service) + pay-as-you-go
- MongoDB Atlas: $0 (free tier M0)
- Total: $0-$15/month depending on usage

---

*Phase 6 Complete: October 2026*
