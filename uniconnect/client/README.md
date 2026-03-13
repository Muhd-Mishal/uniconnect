# UniConnect Client

Frontend for UniConnect, built with React and Vite.

## Run locally

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Environment

The client reads the following optional environment variables:

- `VITE_API_URL`: API base URL. Default: `http://localhost:3000/api`
- `VITE_API_ORIGIN`: Origin used for uploaded images/files. Default: `http://localhost:3000`
- `VITE_SOCKET_URL`: Socket server URL. Default: `http://localhost:3000`

## PWA support

The app is configured as a Progressive Web App using:

- `public/manifest.webmanifest`
- `public/sw.js`
- `public/icons/icon.svg`
- `public/icons/icon-maskable.svg`
- service worker registration in `src/main.jsx`

### What it does

- makes the app installable on supported browsers
- provides app name, theme color, and icons
- caches the basic app shell and static assets
- allows limited offline loading for previously cached frontend files

### Important deployment requirement

PWA installability requires:

- `HTTPS` in production
- a valid manifest
- a registered service worker

`localhost` works for local testing, but real install prompts on deployed environments should be tested over `https://`.

### How to test PWA locally

1. Run a production build:

```bash
npm run build
```

2. Start the preview server:

```bash
npm run preview
```

3. Open the preview URL in Chrome or Edge.

4. Open DevTools:

- `Application` -> `Manifest`
- `Application` -> `Service Workers`

5. Confirm:

- the manifest is loaded
- the service worker is registered
- the install button appears in the browser UI if supported

### How to install as an app

Desktop Chrome/Edge:

1. Open the deployed app.
2. Look for the install icon in the address bar.
3. Click `Install`.

Android Chrome:

1. Open the deployed app.
2. Tap the browser menu.
3. Tap `Install app` or `Add to Home screen`.

iPhone/iPad Safari:

1. Open the deployed app in Safari.
2. Tap the share icon.
3. Tap `Add to Home Screen`.

Note: iOS supports home-screen installation, but service worker/PWA behavior is more limited than Chrome/Edge.

### Current cache behavior

The service worker currently:

- caches the app shell
- caches fetched static assets at runtime
- does not cache API responses
- falls back to `/` for navigation requests when offline

If you want stronger offline behavior later, extend `public/sw.js` with more explicit asset and API caching rules.
