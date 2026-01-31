# Quick Start Guide - Automated Posting

## 🚀 3-Step Setup

### 1. Edit Topics
```bash
# Edit topics.txt in your project root
notepad topics.txt
```

Add your topics (one per line):
```
motivation quotes
success mindset
productivity tips
leadership wisdom
entrepreneurship
```

### 2. Start the App
```bash
npm run dev
```

Visit: `http://localhost:3000/automate`

### 3. Run Scheduler (New Terminal)
```bash
npm run scheduler
```

## ✨ Usage

1. **Click** "Start Automated Posting"
2. **Wait** for videos to generate (~5-10 min for 50 videos)
3. **Done!** Videos will upload automatically

## 📊 What Happens

- ✅ Analyzes your analytics for best posting times
- ✅ Generates 10 unique videos per account
- ✅ Schedules 1 video/day for 10 days
- ✅ Uploads automatically at peak hours
- ✅ Different content for each account

## 🎯 Expected Results

**If you have 5 accounts:**
- 50 videos generated total
- 5 videos upload per day
- 10 days of automated content
- Posted at optimal engagement times

## 📁 Where to Find Things

- **Automation Page**: `/automate`
- **Generated Videos**: `public/generated-videos/`
- **Topics File**: `topics.txt`
- **Scheduler**: `npm run scheduler`

## ⚠️ Important

- Keep scheduler running in background
- Don't close the scheduler terminal
- Videos upload only when scheduler is running
- Check `.video-analytics.json` for timing data

## 🔍 Monitor Progress

### Check Pending Videos
```bash
# View pending queue
cat public/pending-batch.json
```

### Check Generated Videos
```bash
# List all generated videos
dir public\generated-videos\*.json
```

### Check Scheduler Status
Look at the scheduler terminal for logs like:
```
[2026-01-31T21:43:00.000Z] Checking for scheduled YouTube videos...
Found 5 YouTube videos to post.
Uploading video_2026-01-31.webm to PaperPoet...
Uploaded! ID: abc123xyz
```

## 🎨 Quote Style

The system uses your existing templates from `lib/video-templates.ts`. No style changes are made - it keeps the default quote/meme format.

## ⏰ Timing

Videos are scheduled based on YOUR analytics:
- System analyzes when your videos get most views
- Schedules uploads at that hour
- Default: 6 PM if no analytics data

## 💡 Tips

1. **Start Small**: Test with 2-3 videos first
2. **Monitor**: Watch first few uploads
3. **Adjust**: Update topics based on performance
4. **Scale**: Increase count after testing

## 🆘 Quick Fixes

**Videos not generating?**
- Check browser console
- Verify GOOGLE_API_KEY in .env

**Videos not uploading?**
- Is scheduler running?
- Check YouTube tokens in settings

**Wrong times?**
- Check .video-analytics.json
- Verify timezone

---

**Ready?** Go to `/automate` and click the button! 🚀
