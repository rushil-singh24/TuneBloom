# Spotify OAuth Setup Guide

This guide will help you set up Spotify OAuth authentication for TuneBloom, both for local development and production deployment.

## Step 1: Create a Spotify App

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click **"Create app"**
4. Fill in the app details:
   - **App name**: TuneBloom (or any name you prefer)
   - **App description**: Music discovery app
   - **Website**: Your website URL (or `http://localhost:5173` for testing)
   - **Redirect URI**: We'll add this in the next step
   - **Developer Terms**: Accept the terms
5. Click **"Save"**

## Step 2: Configure Redirect URIs

In your Spotify app settings, you need to add **Redirect URIs** for both development and production:

### For Local Development:
```
http://127.0.0.1:5173/callback
```
**Note:** Spotify no longer allows `localhost` - you must use the explicit IP address `127.0.0.1`

### For Production (after deployment):
```
https://your-domain.com/callback
```

**How to add:**
1. In your Spotify app dashboard, click **"Edit Settings"**
2. Scroll to **"Redirect URIs"**
3. Click **"Add URI"** and add both:
   - `http://127.0.0.1:5173/callback` (for local - Spotify requires explicit IP, not localhost)
   - `https://your-domain.com/callback` (for production - add this when you deploy)
4. Click **"Add"** after each URI
5. Click **"Save"** at the bottom

## Step 3: Get Your Client ID

1. In your Spotify app dashboard, you'll see your **Client ID**
2. Copy this value (you'll need it for the `.env` file)

**Note:** For this app, we're using the **Implicit Grant Flow** (no Client Secret needed), which is perfect for frontend-only applications.

## Step 4: Set Up Environment Variables

### For Local Development:

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and add your Client ID:
   ```env
   VITE_SPOTIFY_CLIENT_ID=your_actual_client_id_here
   VITE_REDIRECT_URI=http://127.0.0.1:5173/callback
   ```
   **Important:** Spotify requires `127.0.0.1` instead of `localhost`

3. Save the file

### For Production Deployment:

When deploying to platforms like Vercel, Netlify, or any other hosting service:

1. **Set Environment Variables** in your hosting platform:
   - `VITE_SPOTIFY_CLIENT_ID`: Your Spotify Client ID
   - `VITE_REDIRECT_URI`: `https://your-domain.com/callback`
   - `VITE_APP_URL`: `https://your-domain.com` (optional, for auto-detection)

2. **Make sure to add the production redirect URI** in your Spotify app settings (Step 2)

## Step 5: Test Locally

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open `http://localhost:5173` in your browser

3. Click "Continue with Spotify"

4. You should be redirected to Spotify's authorization page

5. After authorizing, you'll be redirected back to the app

## Deployment Platforms

### Vercel
1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `VITE_SPOTIFY_CLIENT_ID`
   - `VITE_REDIRECT_URI` (e.g., `https://your-app.vercel.app/callback`)
4. Add the production redirect URI in Spotify dashboard
5. Deploy!

### Netlify
1. Push your code to GitHub
2. Import project in Netlify
3. Add environment variables in Netlify dashboard:
   - `VITE_SPOTIFY_CLIENT_ID`
   - `VITE_REDIRECT_URI` (e.g., `https://your-app.netlify.app/callback`)
4. Add the production redirect URI in Spotify dashboard
5. Deploy!

### Other Platforms
- Set environment variables as shown above
- Make sure to add the production redirect URI in Spotify dashboard
- The redirect URI must match exactly (including `http://` vs `https://`)

## Troubleshooting

### "Invalid redirect URI" error
- Make sure the redirect URI in your `.env` file **exactly matches** one of the URIs in your Spotify app settings
- Check for typos, trailing slashes, or `http://` vs `https://` mismatches

### "Invalid client" error
- Verify your `VITE_SPOTIFY_CLIENT_ID` is correct
- Make sure there are no extra spaces in the `.env` file

### Token not being saved
- Check browser console for errors
- Make sure `sessionStorage` is enabled in your browser
- Try clearing browser cache and cookies

## Security Notes

- ⚠️ **Never commit your `.env` file** - it's already in `.gitignore`
- ⚠️ The Client ID is safe to expose in frontend code (it's public)
- ⚠️ We're using Implicit Grant Flow, which doesn't require a Client Secret
- ⚠️ Tokens expire after 1 hour and are stored in `sessionStorage`

## Need Help?

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [Spotify Authorization Guide](https://developer.spotify.com/documentation/general/guides/authorization/implicit-grant/)

