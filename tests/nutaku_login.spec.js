import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const currentTime = Date.now();
const outputFolder = path.resolve(process.cwd(), 'dist', 'data');
const outputPath = path.join(outputFolder, 'credentials.json');

// await fs.mkdir(outputFolder, { recursive: true });


const credentials = {
  version: null,
  deviceId: null,
  playerId: null,
  sessionId: null,
  stillValid: null,
  updateTime: null
}

test.use({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:155.0) Gecko/20100101 Firefox/155.0 Banzai' });

test('Check credentials validity', async ({page}) => {

  const oldCredentials = JSON.parse(await fs.readFile(outputPath, 'utf8').catch(() => null));
  console.log({oldCredentials})
  
  const url = 'https://ga.chickgoddess.com/gs_api/guilds/get_members';
  const options = {
    method: 'POST',
    headers: {
      'pnk-device-id': oldCredentials.deviceId,
      'pnk-env': 'WebGLPlayer',
      'pnk-player-id': oldCredentials.playerId,
      'pnk-platform': 'NUTAKU',
      'pnk-request-client-start-time': new Date().toISOString(),
      'pnk-session-id': oldCredentials.sessionId,
      'pnk-version': oldCredentials.version,
      'content-type': 'application/json'
    },
    body: '{"guild_id":"4380","members":false,"recruits":false,"requests":false,"invites":false}'
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    console.log({data, options});
    credentials.stillValid = !!data.result.guild
    credentials.deviceId = oldCredentials.deviceId
    credentials.playerId = oldCredentials.playerId
    credentials.sessionId = oldCredentials.sessionId
    credentials.version = oldCredentials.version
    credentials.updateTime = oldCredentials.updateTime
  } catch (error) {
    console.error(error);
    credentials.stillValid = false
  }
  console.log("stillValid :", credentials.stillValid)
})

test('Get Lust Goddess Credentials',  async ({page}) => {

    test.skip(credentials.stillValid, 'Credentials are still valid, no need to reconnect');

    // Go to game page
    console.log('Open Nutaku...');
    await page.goto('https://www.nutaku.net/fr/', {waitUntil: "domcontentloaded"});
    await page.waitForTimeout(2000); // wait for 1 seconds

    // If already logged in, skip the login flow
    const alreadyLogged = await page.locator('.user.logged-in').count();
    if (!alreadyLogged) {

      // Close geoguard modal if any
      await page.evaluate(() => {
        if(document.querySelector('.overlay')) {
          document.querySelector('.overlay').style.display = "none"
        }
        if(document.querySelector('.js-disclaimer-geoguard')) {
          document.querySelector('.js-disclaimer-geoguard').style.display = "none"
        }
      })

      // Open login (header "Connexion")
      await page.locator('header .js-login').first().click({timeout: 3000});

      // Fill credentials
      await page.fill('input[name="email"]', 'banzaichoupi1@yopmail.com');
      await page.locator('input[name="password"]').nth(1).fill('123456');

      // Submit the form 
      const submit = page.locator('.js-btn-submit').nth(1);
      if (await submit.count()) {
        await submit.first().click();
      } else {
        await page.keyboard.press('Enter');
      }
      console.log('Connected to Nutaku...');
      await page.waitForLoadState('networkidle');
    }
    else {
      console.log('Already connected to Nutaku...');
    }
    
    // Go to game page
    console.log('Navigating to play page...');
    await page.waitForTimeout(2000); // attend x secondes
    await page.goto('https://www.nutaku.net/fr/games/lust-goddess/play/', {waitUntil: "domcontentloaded"});

    await page.waitForTimeout(5000); // attend x secondes
    console.log('Wait for game loading...');



    const req = await page.waitForRequest(r => r.url().includes('/gs_api/profile/nop'), { timeout: 120000 });
    credentials.deviceId = await req.headerValue("pnk-device-id")
    credentials.version = await req.headerValue("pnk-version")
    expect(req).toBeTruthy();

    await page.waitForTimeout(5000); // wait for 3 seconds
    await page.mouse.click(640, 610);

    console.log('Loading the game...');
    const req2 = await page.waitForResponse(r => r.url().includes('get_parent_profile_id'), { timeout: 120000 });
    const body = await req2.json()
    credentials.sessionId = body.result.session_id
    credentials.playerId = body.result.profile_id
    credentials.updateTime = new Date().toISOString().slice(0, 16); 
    credentials.stillValid = true; 

    console.log(credentials)

    const outputFolder = path.resolve(process.cwd(), 'dist', 'data');
    const outputPath = path.join(outputFolder, 'credentials.json');

    // await fs.mkdir(outputFolder, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(credentials, null, 2), 'utf8');

    // expect result to have no null value
    expect(credentials.version).not.toBeNull();
    expect(credentials.deviceId).not.toBeNull();
    expect(credentials.playerId).not.toBeNull();
    expect(credentials.sessionId).not.toBeNull();  
  
});

test('Screenshot Leaderboard', async ({page}) => {

  test.skip(!credentials.stillValid, 'Credentials are not valid, useless to try updating leaderboard');

  await page.goto(`https://fumicon-war-tools.netlify.app/leaderboard.html?PNK-Player-ID=${credentials.playerId}&PNK-Session-Id=${credentials.sessionId}&PNK-Version=${credentials.version}`)
  
  // Prépare l'attente de l'événement dans le navigateur
  const waitForCustomEvent = page.waitForFunction(() => {
    return new Promise((resolve) => {
      window.addEventListener('leaderboardUpdated', () => resolve(true), { once: true });
    });
  });

  // page.on('request', async data => {
  //     console.log(await data.postData(), await data.url())
  // });
  await page.addStyleTag({
    content: `
      .result tr:nth-of-type(n+32) {
        display: none;
      }
    `
  });

  await page.locator('#updateLeaderBoard').first().click();
  await waitForCustomEvent;
  await page.locator('.result').screenshot({ path: 'dist/data/latest_leaderboard_POWER.png' });

  await page.locator('select#sort_by').selectOption('MAX_POWER');
  await waitForCustomEvent;
  await page.locator('.result').screenshot({ path: 'dist/data/latest_leaderboard_MAX_POWER.png' });


})