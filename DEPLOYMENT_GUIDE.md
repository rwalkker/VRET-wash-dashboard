# VRET WASH Deployment Guide

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `vret-wash-dashboard`
3. Make it **Public**
4. **DO NOT** initialize with README, .gitignore, or license
5. Click "Create repository"

## Step 2: Push Code to GitHub

Run these commands in the `vret-wash` directory:

```bash
git remote set-url origin https://github.com/rwalkker/vret-wash-dashboard.git
git push -u origin main
```

## Step 3: Deploy Backend to Render

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub account if not already connected
4. Select repository: `rwalkker/vret-wash-dashboard`
5. Configure:
   - **Name**: `vret-wash-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: (leave blank)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
6. Add Environment Variable:
   - **Key**: `SLACK_WEBHOOK_URL`
   - **Value**: `[Your Slack webhook URL for #phx6-vret-wash]`
7. Click "Create Web Service"
8. Wait for deployment (takes 2-3 minutes)
9. Note the URL: `https://vret-wash-backend.onrender.com`

## Step 4: Deploy Frontend to Render

1. Go to https://render.com/dashboard
2. Click "New +" → "Static Site"
3. Select repository: `rwalkker/vret-wash-dashboard`
4. Configure:
   - **Name**: `vret-wash-frontend`
   - **Branch**: `main`
   - **Root Directory**: (leave blank)
   - **Build Command**: `cd client && npm install && npm run build`
   - **Publish Directory**: `./client/dist`
5. Click "Create Static Site"
6. Wait for deployment (takes 3-4 minutes)
7. Note the URL: `https://vret-wash-frontend.onrender.com`

## Step 5: Test the Application

1. Open `https://vret-wash-frontend.onrender.com`
2. Login with your name and select a team
3. Enter daily metrics for VRET
4. Lock an entry to test Slack integration
5. Check #phx6-vret-wash channel for notification

## URLs

- **Frontend**: https://vret-wash-frontend.onrender.com
- **Backend**: https://vret-wash-backend.onrender.com
- **GitHub**: https://github.com/rwalkker/vret-wash-dashboard
- **Slack Channel**: #phx6-vret-wash

## Features

- 10 VRET metrics tracking
- Single section layout
- WRI safety tracking
- Weekly actions with auto-carryover
- Lock/unlock functionality
- Real-time collaboration
- Slack notifications
- Orange Amazon branding

## Troubleshooting

### Backend won't start
- Check environment variables in Render dashboard
- Verify SLACK_WEBHOOK_URL is set correctly
- Check logs in Render dashboard

### Frontend shows connection errors
- Verify backend is deployed and running
- Check that URLs in frontend code match backend URL
- Clear browser cache and reload

### Slack notifications not working
- Verify SLACK_WEBHOOK_URL environment variable
- Check backend logs for errors
- Test webhook URL with curl

## Support

For issues or questions, contact the development team.
