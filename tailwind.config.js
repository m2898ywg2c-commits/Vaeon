# Workout Tracker

A standalone six week strength and conditioning tracker. No Claude account needed, no login, everything saves to your phone's own local storage.

## What's in here

- `src/App.jsx` — the whole app, unchanged from the Claude version except the storage calls
- `src/storage.js` — a drop-in replacement for the storage the Claude artifact used, backed by your browser's localStorage instead
- `public/manifest.json` and `public/sw.js` — what let this install as a proper standalone app on your phone
- Everything else is standard Vite/React/Tailwind scaffolding

## One thing worth knowing

Since this now saves to localStorage rather than a Claude account, your data lives on whichever specific device and browser you're using it in. It won't sync across your phone and a laptop, for instance. For a single person tracking their own training on their own phone, that's exactly what you want, just worth knowing it's a different model to before.

## Getting it live (about 10 minutes)

You need two free accounts:

1. **GitHub** — https://github.com/signup, this is where the code lives
2. **Vercel** — https://vercel.com/signup, this is what hosts it and gives you a live URL. Sign up using your GitHub account, it's a single click and links the two automatically.

Then:

1. Create a new empty repository on GitHub: https://github.com/new
2. Upload every file from this folder into that repository (GitHub's web upload works fine for this, drag the whole folder in, no command line needed)
3. Go to https://vercel.com/new
4. Choose "Import" next to the repository you just created
5. Leave every setting as default, Vercel automatically detects this is a Vite project
6. Click Deploy

Two or three minutes later you'll have a live URL like `workout-tracker-yourname.vercel.app`. That's your permanent address, open it in Safari, tap the Share icon, Add to Home Screen, exactly as before. This time there's no Claude universal link fighting you, no republishing, no version mix ups.

## Making changes later

Any time you want something changed, come back to Claude, describe what you want, and ask for the updated `App.jsx`. Replace the file in your GitHub repository with the new version (GitHub's web interface lets you edit or replace a file directly). Vercel notices the change and redeploys automatically within a minute or two, no further steps needed on your end.
