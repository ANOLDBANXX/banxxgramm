# BANXXGRAM — Complete Static Website

## Project files

- `index.html` — website structure
- `style.css` — blue / black / orange responsive design
- `app.js` — navigation, feed, likes, comments, search, post creation and local storage
- `assets/logo.svg` — Banxxgram website logo
- `assets/favicon.svg` — browser icon
- `manifest.webmanifest` — installable web-app metadata
- `robots.txt` — search-engine crawling instructions

## Free hosting with GitHub Pages

1. Create a free account at https://github.com/
2. Create a new repository named `banxxgram`.
3. Upload every file and the `assets` folder.
4. Open **Settings → Pages**.
5. Select **Deploy from a branch**.
6. Select `main` and `/ (root)`.
7. Save. GitHub will publish your website.

Your address will normally look like:
`https://YOUR-USERNAME.github.io/banxxgram/`

## Other free/static hosts

- Netlify — drag and drop the project folder or connect GitHub.
- Vercel — import the GitHub repository.
- Cloudflare Pages — connect the repository and deploy it as a static site.

## Current limitation

This is a frontend/static version. Posts and uploaded images are stored in the visitor's browser with localStorage. Therefore, two different visitors do not share the same account or feed.

## To turn it into a real social network

Add a backend such as Supabase or Firebase for:
- user registration/login
- profiles
- shared posts
- cloud image storage
- followers/following
- comments and likes shared between users
- notifications
- moderation and security rules

The existing frontend can then be connected to that backend.
