import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

test.use({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36' });

const result = {
  version: null,
  device: null,
  playerId: null,
  sessionId: null
}

test('Get Lust Goddess Credentials',  async ({page}) => {

    // Go to game page
    await page.goto('https://www.nutaku.net/fr/', {waitUntil: "domcontentloaded"});

    // Open login (header "Connexion")
    await page.locator('text=Connexion').first().click();

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
    
    // Go to game page
    console.log('Navigating to play page...');
    
    await page.goto('https://www.nutaku.net/fr/games/lust-goddess/play/', {waitUntil: "domcontentloaded"});
    await page.waitForTimeout(5000); // attend x secondes


    const req = await page.waitForRequest(r => r.url().includes('/gs_api/profile/nop'), { timeout: 120000 });
    result.device = await req.headerValue("pnk-device-id")
    result.version = await req.headerValue("pnk-version")
    expect(req).toBeTruthy();

    await page.waitForTimeout(5000); // wait for 3 seconds
    await page.mouse.click(640, 610);

    console.log('Loading the game...');
    const req2 = await page.waitForResponse(r => r.url().includes('get_parent_profile_id'), { timeout: 120000 });
    const body = await req2.json()
    result.sessionId = body.result.session_id
    result.playerId = body.result.profile_id
    result.updateTime = new Date().toISOString().slice(0, 16); 

    console.log(result)

    const outputFolder = path.resolve(process.cwd(), 'dist', 'data');
    const outputPath = path.join(outputFolder, 'credentials.json');

    await fs.mkdir(outputFolder, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf8');

    // expect result to have no null value
    expect(result.version).not.toBeNull();
    expect(result.device).not.toBeNull();
    expect(result.playerId).not.toBeNull();
    expect(result.sessionId).not.toBeNull();  
  
});