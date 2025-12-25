# TuneBloom
Discover new tunes with personalized music recommendations powered by Spotify.

![Homepage](TBHomejpeg)
![Song Card](TBCardDiscovery.jpeg)
![Playlist Feature](TBPlaylists.jpeg)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Spotify OAuth

1. **Create a Spotify App** at [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. **Add Redirect URI** in Spotify app settings:
   - `http://127.0.0.1:5173/callback` (for local development - Spotify requires explicit IP, not localhost)
   - `https://your-domain.com/callback` (for production)
3. **Copy your Client ID** from the Spotify dashboard

### 3. Configure Environment Variables

Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit `.env` and add your Spotify Client ID:
```env
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id_here
VITE_REDIRECT_URI=http://127.0.0.1:5173/callback
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Deployment

See [SPOTIFY_SETUP.md](./SPOTIFY_SETUP.md) for detailed deployment instructions.

**Quick deployment steps:**
1. Set environment variables in your hosting platform
2. Add production redirect URI in Spotify dashboard
3. Deploy!

## Features

- 🎵 Personalized music recommendations
- ❤️ Swipe to like/dislike tracks
- 📊 Music analytics and insights
- 🎧 30-second preview auto-play
- 📱 Beautiful, modern UI

## Tech Stack

- React + Vite
- Tailwind CSS
- Framer Motion
- Spotify Web API
- Javascript
- PostgreSQL
