import { NextApiRequest, NextApiResponse } from 'next';
import puppeteer from 'puppeteer';

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const NEXT_PUBLIC_FB_EMAIL = process.env.NEXT_PUBLIC_FB_EMAIL;
    const FB_PASS = process.env.FB_PASS;
    const TARGET_ACCOUNT_NAME = process.env.TARGET_ACCOUNT_NAME;
    const FB_MESSAGE = 'Hello everyone! This is a test auto post 😎';

    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized'],
    });

    const page = await browser.newPage();

    // === LOGIN ===
    console.log('➡️ Logging into Facebook...');
    await page.goto('https://www.facebook.com/login', {
      waitUntil: 'networkidle2',
    });
    await page.type('#email', NEXT_PUBLIC_FB_EMAIL, { delay: 80 });
    await page.type('#pass', FB_PASS, { delay: 80 });
    await page.click("button[name='login']");

    console.log('⚠️ If Facebook asks for CAPTCHA or 2FA, do it manually in the browser.');
    await waitForUserInput();
    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    await new Promise((r) => setTimeout(r, 4000));

    // === SWITCH ACCOUNT ===
    console.log('➡️ Opening account menu...');
    try {
      const avatarBtn = await page.waitForSelector("div[aria-label='Account'], div[aria-label='Your profile']", {
        timeout: 1000,
      });
      await avatarBtn?.click();
      await new Promise((r) => setTimeout(r, 2000));

      const switchSelector = `*[aria-label="Switch to ${TARGET_ACCOUNT_NAME}"]`;
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
        }, TARGET_ACCOUNT_NAME);
      }

      if (switched) {
        console.log(`✅ Switched to ${TARGET_ACCOUNT_NAME}`);
        await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
        await new Promise((r) => setTimeout(r, 3000));
      } else {
        console.log(`⚠️ Could not find switch button for: ${TARGET_ACCOUNT_NAME}`);
      }
    } catch (err) {
      console.log('⚠️ Failed to open menu or switch account:', (err as Error).message);
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

    const groupLinks = await page.$$eval("a[href*='/groups/']", (els) =>
      Array.from(new Set(els.map((a) => (a as HTMLAnchorElement).href))).filter((u) => /\/groups\/[^\/]+\/?$/.test(u)),
    );

    console.log(`✅ Fully loaded ${groupLinks.length} groups.`);

    // === (Optional) POST TEST ===
    // for (const link of groupLinks.slice(0, 2)) {
    //   console.log(`📝 Posting to: ${link}`);
    //   try {
    //     await page.goto(link, { waitUntil: "networkidle2" });
    //     await new Promise((r) => setTimeout(r, 4000));

    //     const postBox = await page.$("div[role='textbox']");
    //     if (postBox) {
    //       await postBox.click();
    //       await page.keyboard.type(FB_MESSAGE, { delay: 50 });

    //       const [postBtn] = await page.$x("//span[contains(text(), 'Post')]");
    //       if (postBtn) {
    //         await postBtn.click();
    //         console.log("✅ Post successful!");
    //         await new Promise((r) => setTimeout(r, 5000));
    //       } else {
    //         console.log("⚠️ Post button not found.");
    //       }
    //     } else {
    //       console.log("⚠️ Post box not found.");
    //     }
    //   } catch (err) {
    //     console.log(`❌ Error posting to: ${link}`);
    //   }
    // }

    console.log('🎯 Done!');
    await browser.close();

    return res.status(200).json({
      success: true,
      message: `Facebook group posting script completed successfully. Processed ${groupLinks?.length || 0} groups.`,
    });
  } catch (error: any) {
    console.error('❌ Script execution error:', error);
    return res.status(500).json({
      success: false,
      error: 'Script execution failed',
      message: error.message,
    });
  }
}
