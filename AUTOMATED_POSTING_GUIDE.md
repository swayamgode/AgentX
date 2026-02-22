# Automated Multi-Account Posting System

## Overview
This system automates the entire process of generating, scheduling, and uploading quote videos across multiple YouTube accounts. It analyzes your video analytics to determine optimal posting times and creates unique content for each account.

## Features

### 1. **Hands-Free Posting (New)**
- **Auto-Quota Recovery**: If YouTube hits an upload limit, the system automatically reschedules the video for the next day.
- **Auto-Stock Management**: If you have fewer than 2 days of content left, the scheduler automatically opens your browser to generate a fresh batch of videos.
- **Analytics-Based Scheduling**: Identifies peak engagement hours and spreads uploads to avoid hitting limits.

### 2. **Multi-Account Support**
- Manages multiple YouTube accounts simultaneously
- Generates unique content for each account
- Prevents content duplication across accounts

### 3. **Automated Content Generation**
- Reads topics from `topics.txt`
- Generates unique memes with AI
- Creates videos with different templates
- Adds variety with different audio tracks

### 4. **Smart Scheduling**
- Schedules 10 videos per account by default
- Spreads videos across multiple days
- Posts at peak engagement times
- Handles timezone considerations

## Setup

### 1. Connect YouTube Accounts
1. Go to your dashboard
2. Click "Connect YouTube Account"
3. Authenticate each account you want to automate
4. Repeat for all accounts (up to 5 recommended)

### 2. Configure Topics
Edit `topics.txt` in the root directory:
```
# Quote Topics (one per line)
motivation
success
entrepreneurship
mindset
productivity
leadership
```

### 3. Start the Scheduler
The scheduler runs automatically and checks every minute for:
- Scheduled videos ready to upload
- Scheduled tweets ready to post

**To start the scheduler:**
```bash
npm run scheduler
```

Keep this running in the background (or use PM2/systemd for production).

## Usage

### One-Click Automated Posting

1. **Open the Dashboard**
   - Navigate to your AgentX dashboard
   - Find the "Automated Multi-Account Posting" section

2. **Configure Settings**
   - Set "Videos per Account" (default: 10)
   - This will schedule 10 videos for each connected account

3. **Click "Start Automated Posting"**
   - The system will:
     - Analyze your analytics for optimal times
     - Generate unique content for each account
     - Create videos in the browser
     - Save them with scheduling metadata
     - Queue them for automatic upload

4. **Monitor Progress**
   - Watch the progress bar as videos are generated
   - Each video takes ~10-15 seconds to create
   - All videos are saved locally with metadata

5. **Automatic Upload**
   - The scheduler (running in background) will:
     - Check every minute for scheduled videos
     - Upload videos at their scheduled time
     - Update analytics after upload
     - Track success/failure status

## How It Works

### Phase 1: Planning (API)
```
/api/youtube/schedule-bulk
```
- Loads all connected YouTube accounts
- Reads topics from topics.txt
- Analyzes analytics to find optimal upload hour
- Generates meme ideas using AI (Gemini)
- Creates schedule for 10 videos per account
- Saves to pending-batch.json

### Phase 2: Generation (Client)
```
BulkScheduler Component
```
- Fetches pending videos from API
- Renders each video using browser Canvas API
- Applies text overlays, animations, audio
- Converts to WebM format
- Uploads to server with metadata

### Phase 3: Storage (Server)
```
/api/youtube/save-scheduled
```
- Receives generated video blob
- Saves to `public/generated-videos/`
- Creates metadata JSON file
- Sets status to "SCHEDULED"

### Phase 4: Upload (Scheduler)
```
scripts/scheduler.ts
```
- Runs every minute via cron
- Checks for videos with scheduledFor <= now
- Authenticates with YouTube API
- Uploads video to correct account
- Updates status to "UPLOADED"
- Records YouTube video ID

## File Structure

```
agentx/
├── app/api/youtube/
│   ├── schedule-bulk/route.ts      # Plan content for all accounts
│   ├── process-pending/route.ts    # Get/update pending videos
│   └── save-scheduled/route.ts     # Save generated videos
├── components/
│   └── BulkScheduler.tsx           # UI for automation
├── lib/
│   ├── analytics-util.ts           # Optimal time calculation
│   ├── token-storage.ts            # Multi-account management
│   └── video-storage.ts            # Video file management
├── scripts/
│   ├── scheduler.ts                # Background upload scheduler
│   └── plan-content.ts             # CLI content planner
├── public/
│   ├── generated-videos/           # Stored video files
│   └── pending-batch.json          # Generation queue
└── topics.txt                      # Content topics
```

## Analytics-Based Timing

The system analyzes your `.video-analytics.json` file to determine:

1. **Upload Hour Distribution**
   - Groups videos by hour of upload
   - Calculates average views per hour
   - Identifies peak performance time

2. **Default Fallback**
   - If no analytics data: 6 PM (18:00)
   - This is generally a high-engagement time

3. **Per-Account Optimization**
   - Each account can have different optimal times
   - Based on that account's historical performance

## Monitoring

### Check Scheduled Videos
```bash
# View all scheduled videos
ls public/generated-videos/*.json
```

### Check Scheduler Logs
```bash
# If running with npm run scheduler
# Logs appear in console

# If running with PM2
pm2 logs scheduler
```

### Check Upload Status
Look at the `status` field in video metadata JSON files:
- `SCHEDULED` - Waiting for upload time
- `UPLOADED` - Successfully uploaded
- `FAILED` - Upload failed

## Troubleshooting

### Videos Not Uploading
1. Check scheduler is running: `npm run scheduler`
2. Verify YouTube tokens are valid
3. Check video metadata has correct `accountId`
4. Ensure `scheduledFor` time has passed

### Generation Fails
1. Check browser console for errors
2. Verify templates exist in `lib/video-templates.ts`
3. Ensure sufficient disk space
4. Check GOOGLE_API_KEY is valid

### Wrong Upload Time
1. Check `.video-analytics.json` has data
2. Verify timezone settings
3. Review `lib/analytics-util.ts` logic

## Best Practices

1. **Start Small**: Test with 2-3 videos per account first
2. **Monitor First Week**: Watch analytics to verify optimal times
3. **Diversify Topics**: Use varied topics across accounts
4. **Keep Scheduler Running**: Use PM2 or similar for reliability
5. **Regular Backups**: Backup `.youtube-accounts.json` regularly

## Production Deployment

### Using PM2
```bash
# Install PM2
npm install -g pm2

# Start scheduler
pm2 start npm --name "agentx-scheduler" -- run scheduler

# Auto-restart on reboot
pm2 startup
pm2 save
```

### Using systemd (Linux)
Create `/etc/systemd/system/agentx-scheduler.service`:
```ini
[Unit]
Description=AgentX Video Scheduler
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/agentx
ExecStart=/usr/bin/npm run scheduler
Restart=always

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable agentx-scheduler
sudo systemctl start agentx-scheduler
```

## Support

For issues or questions, check:
1. Console logs (browser and server)
2. Video metadata JSON files
3. `.video-analytics.json` for analytics data
4. `.youtube-accounts.json` for account status
