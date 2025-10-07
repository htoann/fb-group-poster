import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';

interface Group {
  id: string;
  name: string;
  url: string;
}

function waitForUserInput(promptText = '👉 Waiting for 2FA completion...'): Promise<void> {
  return new Promise((resolve) => {
    console.log(promptText);
    setTimeout(() => {
      console.log('⏰ Continuing after simulated delay...');
      resolve();
    }, 5000);
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser;
  const firstPage = true;
  try {
    const username = process.env.NEXT_PUBLIC_FB_EMAIL!;
    const password = process.env.FB_PASS!;
    const targetAccountName = process.env.TARGET_ACCOUNT_NAME;

    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized', '--disable-notifications'],
    });

    const page = await browser.newPage();

    console.log('➡️ Logging into Facebook...');
    await page.goto('https://www.facebook.com/login', { waitUntil: 'networkidle2' });
    await page.type('#email', username, { delay: 80 });
    await page.type('#pass', password, { delay: 80 });
    await page.click("button[name='login']");

    console.log('⚠️ Complete CAPTCHA or 2FA manually if prompted.');
    await waitForUserInput();
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await new Promise((r) => setTimeout(r, 4000));

    if (targetAccountName) {
      console.log(`➡️ Attempting to switch account to "${targetAccountName}"...`);
      try {
        const avatarBtn = await page.waitForSelector("div[aria-label='Account'], div[aria-label='Your profile']", {
          timeout: 1000,
        });
        await avatarBtn?.click();
        await new Promise((r) => setTimeout(r, 2000));

        const switchSelector = `*[aria-label="Switch to ${targetAccountName}"]`;
        const switchBtn = await page.$(switchSelector);

        let switched = false;
        if (switchBtn) {
          await switchBtn.click();
          switched = true;
        } else {
          switched = await page.evaluate((name) => {
            const el = Array.from(document.querySelectorAll('[aria-label]')).find((e) => {
              const v = e.getAttribute('aria-label') || '';
              return v.includes(name);
            });
            if (!el) return false;
            (el as HTMLElement).click();
            return true;
          }, targetAccountName);
        }

        if (switched) {
          console.log(`✅ Switched to ${targetAccountName}`);
          await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
          await new Promise((r) => setTimeout(r, 3000));
        } else {
          console.log(`⚠️ Could not find switch button for: ${targetAccountName}`);
        }
      } catch (err) {
        console.log('⚠️ Failed to switch account:', (err as Error).message);
      }
    }

    console.log('➡️ Fetching joined groups...');
    await page.goto('https://www.facebook.com/groups/joins/?nav_source=tab&ordering=viewer_added', {
      waitUntil: 'networkidle2',
    });
    await new Promise((r) => setTimeout(r, 3000));

    if (!firstPage) {
      console.log('🌀 Scrolling to load all groups...');
      let previousCount = 0;
      let sameCountTimes = 0;

      while (true) {
        const currentCount = await page.$$eval("a[href*='/groups/']", (els) => els.length);
        console.log(`📊 Currently loaded: ${currentCount} groups`);

        if (currentCount === previousCount) sameCountTimes++;
        else sameCountTimes = 0;

        if (sameCountTimes >= 3) break;
        previousCount = currentCount;

        await page.evaluate(() => window.scrollBy(0, window.innerHeight));
        await new Promise((r) => setTimeout(r, 1500));
      }
      console.log('✅ Finished scrolling.');
    } else {
      console.log('ℹ️ firstPage=true, skipping scrolling.');
    }

    console.log('🔍 Extracting group details...');
    const allGroups: Group[] = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll("a[href^='https://www.facebook.com/groups/']"));
      const groupMap = new Map<string, Group>();

      anchors.forEach((a) => {
        const href = a.getAttribute('href') || '';
        if (href.includes('?')) return;
        const url = href.split('?')[0];
        const groupIdMatch = url.match(/\/groups\/([^\/]+)/);
        if (!groupIdMatch) return;
        const groupId = groupIdMatch[1];

        let groupName = '';
        a.childNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
            groupName = node.textContent.trim();
          }
        });
        if (!groupName) return;

        if (!groupMap.has(url)) {
          groupMap.set(url, { id: groupId, name: groupName, url });
        }
      });

      return Array.from(groupMap.values());
    });

    console.log(`✅ Total groups found: ${allGroups.length}`);
    await browser.close();

    return res.status(200).json(allGroups);
  } catch (error: any) {
    console.error('❌ Script execution error:', error);
    if (browser) await browser.close();
    return res.status(500).json({ success: false, error: 'Failed to fetch groups', message: error.message });
  }
}
