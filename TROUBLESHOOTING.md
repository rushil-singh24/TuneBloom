# Troubleshooting INVALID_CLIENT Error

If you're getting `INVALID_CLIENT: Invalid client` error, follow these steps:

## Step 1: Verify .env File Exists

Make sure you have a `.env` file (not just `.env.example`) in the root directory:

```bash
ls -la | grep .env
```

You should see both `.env` and `.env.example`

## Step 2: Check .env File Format

Your `.env` file should look exactly like this (no quotes, no spaces around =):

```env
VITE_SPOTIFY_CLIENT_ID=your_actual_client_id_here
VITE_REDIRECT_URI=http://localhost:5173/callback
```

**Common mistakes:**
- ❌ `VITE_SPOTIFY_CLIENT_ID = abc123` (spaces around =)
- ❌ `VITE_SPOTIFY_CLIENT_ID="abc123"` (quotes)
- ❌ `VITE_SPOTIFY_CLIENT_ID= abc123` (space after =)
- ✅ `VITE_SPOTIFY_CLIENT_ID=abc123` (correct)

## Step 3: Restart Dev Server

**IMPORTANT:** After creating or modifying `.env`, you MUST restart the dev server:

1. Stop the current server (Ctrl+C in terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

Vite only reads `.env` files when the server starts!

## Step 4: Verify Client ID

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click on your app
3. Copy the **Client ID** (it's a long string of letters and numbers)
4. Make sure it matches exactly what's in your `.env` file

## Step 5: Check Redirect URI in Spotify

1. In Spotify Dashboard, click **"Edit Settings"**
2. Scroll to **"Redirect URIs"**
3. Make sure you have added:
   ```
   http://localhost:5173/callback
   ```
4. Click **"Save"** at the bottom

The redirect URI must match EXACTLY (including `http://` not `https://` for local)

## Step 6: Check Browser Console

Open browser DevTools (F12) and check the Console tab. You should see:
```
Spotify OAuth Config: { clientId: "abc123...", redirectUri: "http://localhost:5173/callback", hasClientId: true }
```

If you see `hasClientId: false` or `clientId: "MISSING"`, the environment variable isn't loading.

## Step 7: Verify the URL Being Generated

In the browser console, before clicking login, you can check what URL is being generated:

```javascript
// In browser console:
import.meta.env.VITE_SPOTIFY_CLIENT_ID
```

This should show your client ID. If it's `undefined`, the .env file isn't being read.

## Still Not Working?

1. **Double-check Client ID** - Make sure you copied the entire Client ID (it's usually 32 characters)
2. **Check for hidden characters** - Sometimes copying can add invisible characters
3. **Try recreating the .env file** - Delete it and create a fresh one
4. **Verify Spotify app is active** - Make sure your app isn't in "Development Mode" restrictions
5. **Check browser cache** - Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

## Quick Test

Run this in your terminal to verify the .env file:

```bash
cat .env
```

You should see your actual Client ID (not "your_spotify_client_id_here")

