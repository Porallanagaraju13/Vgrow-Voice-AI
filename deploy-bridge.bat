@echo off
echo ========================================================
echo Deploying VgrowVoice Bridge Server to Google Cloud Run
echo ========================================================
echo.
echo Please ensure you have installed the Google Cloud CLI and run:
echo gcloud auth login
echo gcloud config set project YOUR_PROJECT_ID
echo.
pause

gcloud run deploy vgrowvoice-bridge ^
  --source . ^
  --port 8080 ^
  --allow-unauthenticated ^
  --region us-central1 ^
  --dockerfile bridge.Dockerfile

echo.
echo Deployment Complete!
echo Next Steps:
echo 1. Go to Google Cloud Console - Cloud Run
echo 2. Open vgrowvoice-bridge
echo 3. Edit and Deploy New Revision to add Environment Variables:
echo    - NEXT_PUBLIC_SUPABASE_URL
echo    - SUPABASE_SERVICE_ROLE_KEY
echo    - NEXT_PUBLIC_GEMINI_API_KEY
echo 4. Map your custom domain 'bridge.vgrow.ai' to this service in Cloud Domains.
pause
