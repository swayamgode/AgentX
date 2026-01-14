# Copyright-Free Music Setup Guide

## 🎵 Adding Royalty-Free Music Files

To avoid YouTube copyright claims, you need to add actual audio files to the music library. The UI is already set up - you just need to add the MP3 files!

## Quick Setup (Recommended)

### Step 1: Download Music from YouTube Audio Library

1. Go to [YouTube Audio Library](https://studio.youtube.com/channel/UC/music)
2. Filter by:
   - **Genre**: Based on mood categories
   - **Attribution**: "No attribution required" (recommended)
3. Download 10 tracks matching these moods:
   - **Upbeat** (2 tracks): Energetic, cheerful music
   - **Chill** (2 tracks): Relaxing, lofi beats
   - **Motivational** (2 tracks): Inspiring, uplifting tracks
   - **Ambient** (2 tracks): Soft, peaceful background music
   - **Trending** (2 tracks): Modern, viral-style beats

### Step 2: Rename and Place Files

Rename the downloaded files to match the metadata and place them in:
```
public/music/royalty-free/
```

**Expected filenames:**
- `energetic-vibes.mp3`
- `summer-dreams.mp3`
- `peaceful-mind.mp3`
- `lofi-sunset.mp3`
- `rise-up.mp3`
- `success-journey.mp3`
- `soft-clouds.mp3`
- `meditation-flow.mp3`
- `viral-energy.mp3`
- `tiktok-vibes.mp3`

### Step 3: Test

1. Restart your dev server: `npm run dev`
2. Go to Quotes Studio
3. Click "Library" in the Music section
4. Select a mood and track
5. Click the play button to preview
6. Generate a quote video - it will use the selected track!

## Alternative: Use Different Tracks

If you want to use different tracks:

1. Download your preferred royalty-free music
2. Update `public/music/royalty-free/metadata.json` with new track info:
   ```json
   {
     "id": "your-track-id",
     "name": "Your Track Name",
     "artist": "Royalty Free Music",
     "mood": "upbeat",
     "duration": 180,
     "filename": "your-track.mp3",
     "description": "Your track description"
   }
   ```
3. Place the MP3 file in `public/music/royalty-free/`

## Recommended Free Music Sources

### 1. YouTube Audio Library (Best Option)
- **URL**: https://studio.youtube.com/channel/UC/music
- **License**: Free to use, many require no attribution
- **Quality**: High-quality, professionally produced
- **Variety**: Huge selection across all genres

### 2. Free Music Archive
- **URL**: https://freemusicarchive.org/
- **License**: Various Creative Commons licenses
- **Note**: Check individual track licenses

### 3. Incompetech (Kevin MacLeod)
- **URL**: https://incompetech.com/music/
- **License**: Free with attribution
- **Quality**: Professional, widely used

### 4. Bensound
- **URL**: https://www.bensound.com/
- **License**: Free with attribution
- **Quality**: High-quality, modern tracks

### 5. Purple Planet
- **URL**: https://www.purple-planet.com/
- **License**: Free for commercial use with attribution
- **Quality**: Great variety

## Important Notes

⚠️ **Copyright Safety**:
- Only use tracks from YouTube Audio Library marked "No attribution required" for maximum safety
- Always verify the license before using any track
- Test uploads as "Unlisted" first to check for copyright claims

✅ **Best Practices**:
- Use tracks under 3 minutes for better performance
- MP3 format recommended (128-320 kbps)
- Keep total library size reasonable (<50MB for 10 tracks)

🎯 **For YouTube Shorts**:
- Trending/upbeat music works best for engagement
- Keep videos under 60 seconds
- Use music that matches your quote style

## Testing for Copyright Claims

After adding music and uploading a test video:

1. Upload as "Unlisted" first
2. Wait 24-48 hours
3. Check YouTube Studio > Content > Copyright
4. If no claims appear, the track is safe!

## Need Help?

If you encounter issues:
1. Check file paths are correct
2. Verify MP3 files are valid
3. Check browser console for errors
4. Ensure metadata.json is valid JSON
