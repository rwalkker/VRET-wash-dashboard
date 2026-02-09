# VRET WASH GitHub Push Script
Write-Host "Pushing VRET WASH to GitHub..." -ForegroundColor Cyan

# Add remote (you'll need to create the repo on GitHub first)
git remote add origin https://github.com/rwalkker/vret-wash-dashboard.git

# Push to GitHub
Write-Host "`nPushing to GitHub..." -ForegroundColor Cyan
git branch -M main
git push -u origin main

Write-Host "`nDone! Repository pushed to GitHub." -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go to https://render.com" -ForegroundColor White
Write-Host "2. Create new Web Service for BACKEND:" -ForegroundColor White
Write-Host "   - Name: vret-wash-backend" -ForegroundColor White
Write-Host "   - Repo: rwalkker/vret-wash-dashboard" -ForegroundColor White
Write-Host "   - Build Command: npm install" -ForegroundColor White
Write-Host "   - Start Command: npm start" -ForegroundColor White
Write-Host "   - Add Environment Variable: SLACK_WEBHOOK_URL" -ForegroundColor White
Write-Host "3. Create new Static Site for FRONTEND:" -ForegroundColor White
Write-Host "   - Name: vret-wash-frontend" -ForegroundColor White
Write-Host "   - Repo: rwalkker/vret-wash-dashboard" -ForegroundColor White
Write-Host "   - Build Command: cd client && npm install && npm run build" -ForegroundColor White
Write-Host "   - Publish Directory: ./client/dist" -ForegroundColor White

Read-Host "`nPress Enter to exit"
