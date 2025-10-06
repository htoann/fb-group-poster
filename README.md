This project automates logging into Facebook and fetching the list of groups you have joined using Puppeteer inside a Next.js API route.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Variables

Create a `.env.local` file with the following variables:

```
NEXT_PUBLIC_FB_EMAIL=your_facebook_email_or_phone
FB_PASS=your_facebook_password
# Optional: if you need to switch to a business / page account inside FB after login
TARGET_NAME=Display Name Of Account To Switch
```

`TARGET_NAME` is optional. If set, the script will attempt to open the account/profile menu and click the "Switch to ..." entry.

## API Route

The main scraping route is at:

```
GET /api/get-groups
```

It launches a (non-headless) Chromium instance, logs in, optionally switches account, scrolls until all groups are loaded, and returns JSON:

```
{
	"success": true,
	"groups": [ { id, name, url } ],
	"totalCount": 123
}
```

## Handling Notification Popups

Sometimes Chrome / Facebook shows a notification permission popup ("Enable notifications?"). This blocks interaction and prevents the script from scrolling groups. The script now:

1. Passes `--disable-notifications` to Chromium launch args.
2. Tries to detect and auto-click buttons like "Not now", "Cancel", or close icons inside Facebook dialogs.

If a native browser (outside-DOM) permission bubble appears, it cannot be programmatically closed; manually dismiss it the first time. Subsequent runs usually won't show it again for that profile.

## 2FA / CAPTCHA

After clicking Login the script waits ~5 seconds (`waitForUserInput` simulation). If you have 2FA or CAPTCHA, complete it in the opened browser window quickly; the script will continue afterward.

## Notes

- Headless mode is disabled intentionally to allow solving interactive challenges.
- Avoid running multiple instances concurrently; Facebook may flag unusual activity.
- Use responsibly and comply with Facebook's Terms of Service.

## Future Improvements

- Persistent session storage to avoid repeated logins.
- Configurable scrolling timeout.
- Better structured group metadata (member counts, categories).
