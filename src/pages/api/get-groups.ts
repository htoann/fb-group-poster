import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer, { Page } from 'puppeteer';

interface Group {
  id: string;
  name: string;
  url: string;
  memberCount?: string;
}

// Try to dismiss browser/Facebook notification permission prompts that block UI interaction
async function dismissNotificationPopups(page: Page) {
  try {
    // 1. Browser level permission bubble is outside DOM (can't be controlled), but Facebook often shows its own in-DOM prompt
    // We attempt several selectors heuristically.
    const selectors = [
      // Facebook in-app notification opt-in dialog buttons
      'div[role="dialog"] [aria-label="Not now"]',
      'div[role="dialog"] [aria-label="Cancel"]',
      'div[role="dialog"] [data-testid="cancel_button"]',
      'div[role="dialog"] [data-testid="decline_notifications"]',
      'div[role="dialog"] [data-testid="notifications_inline_cancel"]',
      // Generic buttons containing text
      'div[role="dialog"] button',
    ];

    for (const sel of selectors) {
      const btns = await page.$$(sel);
      for (const b of btns) {
        const text: string = await page.evaluate((el) => (el.textContent || '').trim().toLowerCase(), b as any);
        if (['not now', 'cancel', 'close', 'deny', 'no thanks'].some((t) => text === t || text.includes(t))) {
          await b.click().catch(() => {});
          console.log('🛑 Dismissed notification prompt via selector:', sel, 'text:', text);
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    }

    // Remove any overlay that might block clicks
    await page.evaluate(() => {
      const blockers = Array.from(document.querySelectorAll('[role="dialog"]'));
      // If dialog has only notification content and no decline button found, attempt to close by finding X button
      blockers.forEach((d) => {
        const closeBtn = d.querySelector('[aria-label="Close"], [aria-label="Đóng"], [aria-label="Close dialog"]');
        if (closeBtn) (closeBtn as HTMLElement).click();
      });
    });
  } catch (e) {
    console.log('⚠️ Could not auto-dismiss notification popups:', (e as Error).message);
  }
}

// Pause function for API route (simulated delay instead of user input)
function waitForUserInput(promptText = '👉 Waiting for 2FA completion...'): Promise<void> {
  console.log(promptText);
  // In API route, we'll simulate a delay instead of waiting for user input
  // In a real scenario, you might want to implement a different flow
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log('⏰ Continuing after simulated delay...');
      resolve();
    }, 5000); // 5 second delay to simulate user completing 2FA
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let browser;

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

    // === LOGIN ===
    console.log('➡️ Logging into Facebook...');
    await page.goto('https://www.facebook.com/login', {
      waitUntil: 'networkidle2',
    });
    await page.type('#email', username, { delay: 80 });
    await page.type('#pass', password, { delay: 80 });
    await page.click("button[name='login']");

    console.log('⚠️ If Facebook asks for CAPTCHA or 2FA, do it manually in the browser.');
    await waitForUserInput();
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await new Promise((r) => setTimeout(r, 4000));
    await dismissNotificationPopups(page);

    if (targetAccountName) {
      // === SWITCH ACCOUNT ===
      console.log('➡️ Opening account menu...');
      try {
        const avatarBtn = await page.waitForSelector("div[aria-label='Account'], div[aria-label='Your profile']", {
          timeout: 1000,
        });
        await avatarBtn?.click();
        await new Promise((r) => setTimeout(r, 2000));

        const switchSelector = `*[aria-label="Switch to ${targetAccountName}"]`;
        let switched = false;

        const switchBtn = await page.$(switchSelector);
        if (switchBtn) {
          await switchBtn.click();
          switched = true;
        } else {
          switched = await page.evaluate((name) => {
            const el = Array.from(document.querySelectorAll('[aria-label]')).find((e) => {
              const v = e.getAttribute('aria-label') || '';
              return v === `Switch to ${name}` || v.includes(`Switch to ${name}`);
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
          await dismissNotificationPopups(page);
        } else {
          console.log(`⚠️ Could not find switch button for: ${targetAccountName}`);
        }
      } catch (err) {
        console.log('⚠️ Failed to open menu or switch account:', (err as Error).message);
      }
    }

    // === GET GROUPS ===
    console.log('➡️ Fetching joined groups...');
    await page.goto('https://www.facebook.com/groups/joins/?nav_source=tab&ordering=viewer_added', {
      waitUntil: 'networkidle2',
    });
    await new Promise((r) => setTimeout(r, 3000));

    // Scroll until all groups are loaded
    let previousCount = 0;
    let sameCountTimes = 0;

    while (true) {
      const currentCount = await page.$$eval("a[href*='/groups/']", (els) => els.length);
      console.log(`📊 Currently loaded: ${currentCount} groups...`);

      if (currentCount === previousCount) sameCountTimes++;
      else sameCountTimes = 0;

      if (sameCountTimes >= 3) break;
      previousCount = currentCount;

      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Extract group details with names and URLs
    const allGroups: Group[] = await page.evaluate(() => {
      const groupElements = document.querySelectorAll("a[href*='/groups/']");
      const groupMap = new Map<string, Group>();

      Array.from(groupElements).forEach((element) => {
        const anchor = element as HTMLAnchorElement;
        const href = anchor.href;

        // Filter valid group URLs
        if (!/\/groups\/[^\/]+\/?$/.test(href)) return;

        // Extract group ID from URL
        const groupId = href.match(/\/groups\/([^\/]+)/)?.[1];
        if (!groupId) return;

        // Skip navigation items that are not actual groups
        const navigationItems = ['feed', 'discover', '?category=create'];
        if (navigationItems.includes(groupId)) return;

        // Try to find group name from various possible selectors
        let groupName = '';

        // Look for text content in the anchor itself
        const textContent = anchor.textContent?.trim();
        if (textContent && textContent.length > 0) {
          groupName = textContent;
        }

        // Look for span or div children with text
        if (!groupName) {
          const childWithText = anchor.querySelector('span, div');
          if (childWithText?.textContent?.trim()) {
            groupName = childWithText.textContent.trim();
          }
        }

        // Fallback to group ID if no name found
        if (!groupName) {
          groupName = groupId;
        }

        // Store unique groups
        if (!groupMap.has(href)) {
          groupMap.set(href, {
            id: groupId,
            name: groupName,
            url: href,
          });
        }
      });

      return Array.from(groupMap.values());
    });

    // Filter out any remaining navigation items by checking group names
    const groups = allGroups.filter((group) => {
      const navigationNames = ['Your feed', 'Discover', 'Create new group', 'feed', 'discover'];
      return !navigationNames.some(
        (navName) => group.name.toLowerCase().includes(navName.toLowerCase()) || group.id === navName,
      );
    });

    console.log(`✅ Fully loaded ${groups.length} groups.`);

    await browser.close();

    return res.status(200).json({
      success: true,
      groups: groups,
      totalCount: groups.length,
    });
  } catch (error: any) {
    console.error('❌ Script execution error:', error);

    if (browser) {
      await browser.close();
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to fetch groups',
      message: error.message,
    });
  }
}
