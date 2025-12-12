# OAuth Setup Guide

## Problem: Can't Update App URL in Active Version

When an app version is active in Shopify Dev Dashboard, you cannot edit the App URL. Here are your options:

## Solution 1: Create a New Version (Recommended)

1. In Dev Dashboard → QSIM → Versions
2. Click **"New version"** button (top right)
3. In the new version, you can update:
   - **App URL**: Set to your callback URL (e.g., `http://localhost:3000/auth/callback`)
   - Or use a tunnel service URL (see Solution 2)
4. Save the new version
5. Make it active (if needed)

## Solution 2: Use ngrok for Local Development

If you can't create a new version or need to test locally:

1. **Install ngrok:**
   ```bash
   # macOS
   brew install ngrok
   
   # Or download from https://ngrok.com/download
   ```

2. **Start your server:**
   ```bash
   npm start
   ```

3. **Start ngrok tunnel:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)

5. **Update your .env:**
   ```
   OAUTH_REDIRECT_URI=https://abc123.ngrok.io/auth/callback
   ```

6. **Update App URL in Dev Dashboard** (if you create a new version):
   - Set App URL to: `https://abc123.ngrok.io`

7. **Test OAuth:**
   ```bash
   # Visit in browser
   https://abc123.ngrok.io/auth/install
   ```

## Solution 3: Use the Current App URL

If your app URL is set to `https://example.com`, you can:

1. **Point a domain/subdomain to your server** (if you have one)
2. **Or use the App URL field differently** - some Custom Apps allow the redirect URI to be passed in the OAuth request

## Quick Test (Without Changing App URL)

For testing purposes, you can try:

1. **Start server:**
   ```bash
   npm start
   ```

2. **Visit OAuth install URL directly** (this will show the redirect URI being used):
   ```
   http://localhost:3000/auth/install
   ```

3. **Check the console** - it will show the redirect URI being used

4. **If Shopify rejects the redirect URI**, you'll need to either:
   - Create a new version with the correct App URL
   - Use ngrok (Solution 2)

## Current Configuration

Your current setup:
- Shop: `test-quilt-shop`
- Client ID: `5917c80e8dfefcbc1d1830cc8de55126`
- Client Secret: Configured

The OAuth flow will use: `http://localhost:3000/auth/callback` by default (or `OAUTH_REDIRECT_URI` if set in .env).

