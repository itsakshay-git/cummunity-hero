# Google Cloud Deployment Guide

This document describes how to deploy the Community Hero platform on Google Cloud.

## Deployment Target
The application is fully optimized to be built, bundled, and run on Google Cloud Run or Google Cloud App Engine:
1. **Frontend**: Vite builds assets to `/dist/` which is served by the Express backend.
2. **Backend**: Express runs on Node, listening on the port provided by the environment (`PORT`).

---

## 1. Local Build & Test
Verify that both modules compile successfully:
```bash
npm run build
```
This produces:
- `dist/index.html` + assets (compiled client bundle).
- `dist/server.cjs` (bundled production Express backend).

---

## 2. Setting Environment Variables
Ensure you configure the following variables in your deployment environment (e.g. Cloud Run env variables):
- `NODE_ENV=production`
- `PORT=8080` (or whichever port Cloud Run expects)
- `GEMINI_API_KEY=your_gemini_api_key_here` (used by the AI scanner module)

---

## 3. Deploying to Cloud Run
1. Ensure the Google Cloud SDK (`gcloud`) is installed.
2. Run the build and deploy command from the root directory:
```bash
gcloud run deploy community-hero --source . --port 8080 --allow-unauthenticated
```
3. Cloud Run will automatically detect the `package.json`, install dependencies, run the `build` script, and start the listener container using `npm start` (executing `node dist/server.cjs`).
