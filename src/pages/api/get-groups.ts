import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer, { Browser, Page } from 'puppeteer';
import { delay, extractGroups, scrollUntilLoaded, waitForUserInput } from '../../lib/fbGroupHelpers';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  let browser: Browser | null = null;

  try {
    const username = process.env.NEXT_PUBLIC_FB_EMAIL!;
    const password = process.env.FB_PASS!;
    const targetAccount = process.env.TARGET_ACCOUNT_NAME;

    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized', '--disable-notifications'],
    });

    const page = await browser.newPage();
    await page.goto('https://www.facebook.com/login', { waitUntil: 'networkidle2' });

    console.log('➡️ Logging in...');
    await login(page, username, password);

    if (targetAccount) await switchAccount(page, targetAccount);

    console.log('➡️ Fetching joined groups...');
    const groups = await fetchGroups(page);

    console.log(`✅ Loaded ${groups.length} groups.`);
    return res.status(200).json(groups.map((g) => g.name));
  } catch (err: any) {
    console.error('❌ Error:', err);
    return res.status(500).json({ success: false, message: err.message });
  } finally {
    await closeBrowser(browser);
  }
}

/* ---------- Helpers ---------- */

async function login(page: Page, username: string, password: string) {
  await page.type('#email', username, { delay: 70 });
  await page.type('#pass', password, { delay: 70 });
  await page.click("button[name='login']");
  await waitForUserInput();
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
  await delay(2000);
}

async function switchAccount(page: Page, accountName: string) {
  console.log(`➡️ Switching to account: ${accountName}`);
  try {
    const btn = await page.waitForSelector("div[aria-label='Account'], div[aria-label='Your profile']", {
      timeout: 3000,
    });
    await btn?.click();
    await delay(1200);

    const switched = await page.evaluate((name) => {
      const el = Array.from(document.querySelectorAll('[aria-label]')).find((e) => {
        const label = e.getAttribute('aria-label') || '';
        return label.includes(`Switch to ${name}`);
      });
      if (el) (el as HTMLElement).click();
      return !!el;
    }, accountName);

    if (switched) {
      console.log(`✅ Switched to ${accountName}`);
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
      await delay(2000);
    } else {
      console.log(`⚠️ Switch option not found.`);
    }
  } catch (err: any) {
    console.log(`⚠️ Account switch failed: ${err.message}`);
  }
}

async function fetchGroups(page: Page) {
  await page.goto('https://www.facebook.com/groups/joins/?nav_source=tab&ordering=viewer_added', {
    waitUntil: 'networkidle2',
  });
  await delay(2000);
  await scrollUntilLoaded(page, "a[href*='/groups/']");
  return extractGroups(page);
}

async function closeBrowser(browser: Browser | null) {
  if (!browser) return;
  const pages = await browser.pages();
  await Promise.all(pages.map((p) => p.close().catch(() => {})));
  await browser.close();
}
