import { Page } from 'puppeteer';

export interface Group {
  id: string;
  name: string;
  url: string;
  memberCount?: string;
}

export async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function waitForUserInput() {
  console.log('👉 Waiting 2FA (5s delay)...');
  await delay(5000);
  console.log('⏰ Continuing...');
}

export async function scrollUntilLoaded(page: Page, selector: string, maxIdleRounds = 3) {
  let prevCount = 0;
  let idleRounds = 0;

  while (true) {
    const count = await page.$$eval(selector, (els) => els.length);
    if (count === prevCount) idleRounds++;
    else idleRounds = 0;

    if (idleRounds >= maxIdleRounds) break;
    prevCount = count;

    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await delay(1500);
  }
}

export async function extractGroups(page: Page): Promise<Group[]> {
  return await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll("a[href*='/groups/']"));
    const map = new Map<string, Group>();

    anchors.forEach((a) => {
      const href = (a as HTMLAnchorElement).href;
      const match = href.match(/\/groups\/([^\/]+)/);
      if (!match) return;

      const id = match[1];
      const skipIds = ['feed', 'discover', '?category=create'];
      if (skipIds.includes(id)) return;

      let name = a.textContent?.trim() || a.querySelector('span,div')?.textContent?.trim() || id;

      if (!map.has(href)) map.set(href, { id, name, url: href });
    });

    const navNames = ['feed', 'discover', 'create'];
    return Array.from(map.values()).filter((g) => !navNames.some((n) => g.name.toLowerCase().includes(n)));
  });
}
