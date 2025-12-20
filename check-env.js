#!/usr/bin/env node

// Quick script to check if .env is configured correctly
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  const envContent = readFileSync(join(__dirname, '.env'), 'utf8');
  const clientIdMatch = envContent.match(/VITE_SPOTIFY_CLIENT_ID=(.+)/);
  
  if (!clientIdMatch) {
    console.log('❌ VITE_SPOTIFY_CLIENT_ID not found in .env');
    process.exit(1);
  }
  
  const clientId = clientIdMatch[1].trim();
  
  if (clientId === 'your_spotify_client_id_here' || !clientId) {
    console.log('❌ .env file still has placeholder value!');
    console.log('   Please replace "your_spotify_client_id_here" with your actual Client ID');
    console.log('   Get it from: https://developer.spotify.com/dashboard');
    process.exit(1);
  }
  
  if (clientId.length < 20) {
    console.log('⚠️  Client ID seems too short. Spotify Client IDs are usually 32 characters.');
  }
  
  console.log('✓ .env file looks good!');
  console.log(`   Client ID: ${clientId.substring(0, 10)}...${clientId.substring(clientId.length - 4)}`);
  console.log('\n⚠️  Remember to RESTART your dev server after editing .env!');
  console.log('   Stop server (Ctrl+C) then run: npm run dev');
  
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('❌ .env file not found!');
    console.log('   Run: cp .env.example .env');
    console.log('   Then edit .env with your Client ID');
  } else {
    console.log('❌ Error reading .env:', error.message);
  }
  process.exit(1);
}

