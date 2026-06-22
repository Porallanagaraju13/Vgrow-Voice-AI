@echo off
echo ========================================================
echo Deploying VgrowVoice Web Dashboard to Google Cloud Run
echo ========================================================
echo.
echo Please ensure you have installed the Google Cloud CLI and run:
echo gcloud auth login
echo gcloud config set project YOUR_PROJECT_ID
echo.
pause

gcloud run deploy vgrowvoice-web ^
  --source . ^
  --port 8080 ^
  --allow-unauthenticated ^
  --region us-central1 ^
  --dockerfile web.Dockerfile

echo.
echo Deployment Complete!
echo Next Steps:
echo 1. Go to Google Cloud Console - Cloud Run
echo 2. Open vgrowvoice-web
echo 3. Edit and Deploy New Revision to add Environment Variables (NEXT_PUBLIC_SUPABASE_URL, etc.)
echo 4. Map your custom domain 'vgrow.ai' to this service in Cloud Domains.
pause
