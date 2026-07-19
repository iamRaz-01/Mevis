# MEVIS Production Deployment Guide

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                     PRODUCTION DEPLOYMENT                          │
│                                                                    │
│  ┌─────────────────┐     ┌─────────────────────────────────────┐  │
│  │  Vercel (Free)  │     │          Railway (Free Trial)        │  │
│  │                 │     │                                     │  │
│  │  dashboard      │────▶│  context-service (port 3008)        │  │
│  │  Next.js 14     │     │  gateway         (port 8000)        │  │
│  │  mevis.vercel.  │     │  persistent SQLite disk volume      │  │
│  │  app            │     │  mevis-*.up.railway.app             │  │
│  └─────────────────┘     └─────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

## ✅ Already Done (Code is pushed to GitHub)

- Multi-stage Dockerfiles for `context-service` and `gateway`
- Vercel config for `dashboard` (`apps/dashboard/vercel.json`)
- Railway config (`railway.json`)
- Production docker-compose (`docker/docker-compose.prod.yml`)
- GitHub Actions CD pipeline (`.github/workflows/deploy.yml`)
- All Milestone 10 code (Volunteer Workspace, AI Co-pilot, Operations)

---

## Step 1: Deploy Backend → Railway

### 1.1 Create Railway Account & Project
1. Go to https://railway.app → Sign Up with GitHub
2. Click **New Project** → **Deploy from GitHub Repo** → Select `iamRaz-01/Mevis`

### 1.2 Create `context-service` Service
1. In your Railway project, click **Add Service** → **GitHub Repo**
2. Select the `Mevis` repo
3. Set **Root Directory** to: *(leave empty — uses root)*
4. Set **Build Command** to: *(leave empty — uses Dockerfile)*
5. Set **Dockerfile Path**: `services/context-service/Dockerfile`
6. Add a **Volume** at path `/data` for SQLite persistence
7. Set Environment Variables:
   ```
   NODE_ENV=production
   PORT=3008
   DB_URL=/data/mevis.db
   LOG_LEVEL=info
   ```
8. Deploy and note the generated URL (e.g., `https://mevis-context-service-production.up.railway.app`)

### 1.3 Create `gateway` Service
1. Add another service from the same repo
2. Set **Dockerfile Path**: `services/gateway/Dockerfile`
3. Set Environment Variables:
   ```
   NODE_ENV=production
   PORT=8000
   LOG_LEVEL=info
   CONTEXT_SERVICE_URL=https://mevis-context-service-production.up.railway.app
   ```
4. Deploy and note the gateway URL

### 1.4 Get Railway API Token
1. Go to Railway → Account Settings → **Tokens**
2. Create token, copy it → save as GitHub Secret `RAILWAY_TOKEN`

---

## Step 2: Deploy Frontend → Vercel

### 2.1 Create Vercel Account & Import Project
1. Go to https://vercel.com → Sign Up with GitHub
2. Click **Add New Project** → Import `iamRaz-01/Mevis`
3. Set **Root Directory**: `apps/dashboard`
4. **Framework**: Next.js (auto-detected)
5. Set Environment Variables:
   ```
   NEXT_PUBLIC_CONTEXT_SERVICE_URL=https://mevis-context-service-production.up.railway.app
   NEXT_PUBLIC_GATEWAY_URL=https://mevis-gateway-production.up.railway.app
   ```
6. Click **Deploy** → Note the URL (e.g., `https://mevis.vercel.app`)

### 2.2 Get Vercel API Token  
1. Go to Vercel → Settings → **Tokens**
2. Create token → save as GitHub Secret `VERCEL_TOKEN`
3. Get your **Vercel Org ID** and **Project ID** from Project Settings → General

---

## Step 3: Configure GitHub for Auto-Deploy

### GitHub Secrets (Settings → Secrets → Actions)
| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | Your Vercel API token |
| `RAILWAY_TOKEN` | Your Railway API token |

### GitHub Variables (Settings → Variables → Actions)
| Variable | Value |
|----------|-------|
| `CONTEXT_SERVICE_URL` | Railway context-service URL |
| `GATEWAY_URL` | Railway gateway URL |

---

## Step 4: Verify Deployment

### Backend Health Check
```bash
curl https://mevis-context-service-production.up.railway.app/api/health
```
Expected: `{"success":true,"data":{"status":"UP",...}}`

### Frontend
Open: `https://mevis.vercel.app`

### API Test
```bash
curl https://mevis-context-service-production.up.railway.app/runtime/operational/v1/volunteers
```

---

## Quick-Start: Local Docker Test

Before cloud deploy, test production build locally:
```bash
# From project root
docker compose -f docker/docker-compose.prod.yml up --build

# Test
curl http://localhost:3008/api/health
curl http://localhost:8000/api/health
```

---

## Monitoring

- **Railway**: Dashboard → Deployments tab shows live logs
- **Vercel**: Dashboard → Deployments shows build logs and edge network status
- **GitHub Actions**: Repository → Actions tab shows CI/CD pipeline status

---

## URLs Summary (after deployment)

| Service | Platform | URL |
|---------|----------|-----|
| Dashboard | Vercel | `https://mevis.vercel.app` |
| Context Service | Railway | `https://mevis-context-service-*.up.railway.app` |
| Gateway | Railway | `https://mevis-gateway-*.up.railway.app` |
