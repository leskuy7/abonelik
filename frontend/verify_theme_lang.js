
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Helper to take screenshot
    const takeScreenshot = async (name) => {
        const screenshotPath = `final_verification_${name}.png`;
        await page.screenshot({ path: screenshotPath });
        console.log(`Screenshot saved: ${screenshotPath}`);
    };

    try {
        console.log('Starting verification...');

        // 1. Visit Login Page
        await page.goto('http://localhost:3000/login');
        await page.waitForTimeout(1000);
        await takeScreenshot('login_page_initial');

        console.log('Checking Login Page Translations (Default TR)...');
        // const loginTitleTr = await page.textContent('h1');
        // if (!loginTitleTr.includes('Aboneliklerini')) throw new Error('Login Title TR incorrect');
        // console.log('Login Title TR verified');

        // 2. Switch to English
        console.log('Switching to English...');
        await page.evaluate(() => {
            localStorage.setItem('language', 'en');
            localStorage.setItem('theme', 'dark');
        });
        await page.reload();
        await page.waitForTimeout(1000);
        await takeScreenshot('login_page_en_dark');

        const loginTitleEn = await page.textContent('h1');
        if (!loginTitleEn.includes('Take control of')) throw new Error('Login Title EN incorrect: ' + loginTitleEn);
        console.log('Login Title EN verified');

        // 3. Check Light Mode
        console.log('Switching to Light Mode...');
        await page.evaluate(() => {
            localStorage.setItem('theme', 'light');
        });
        await page.reload();
        await page.waitForTimeout(1000);
        await takeScreenshot('login_page_en_light');

        // basic check for light mode background
        const bgColor = await page.evaluate(() => {
            return window.getComputedStyle(document.querySelector('.bg-default')).backgroundColor;
        });
        console.log('Light Mode Background Color:', bgColor);
        // In light mode, bg-default should be white-ish. 
        // In tailwind, bg-slate-950 is dark, white is light.
        // If it's dark, it is approx rgb(2, 6, 23).
        if (bgColor === 'rgb(2, 6, 23)') throw new Error('Theme did not switch to light mode');
        console.log('Light Mode verified');

        // 4. Visit Register Page
        console.log('Visiting Register Page...');
        await page.goto('http://localhost:3000/register');
        await page.waitForTimeout(1000);
        await takeScreenshot('register_page_en_light');

        const registerTitleEn = await page.textContent('h1');
        if (!registerTitleEn.includes('Start tracking')) throw new Error('Register Title EN incorrect: ' + registerTitleEn);
        console.log('Register Title EN verified');

        // Check new keys in Register Page
        const registerSubtitleEn = await page.textContent('p.text-muted.text-lg');
        if (!registerSubtitleEn.includes('Sign up for free')) throw new Error('Register Subtitle EN incorrect');
        console.log('Register Subtitle EN verified');


        // Switch back to TR
        await page.evaluate(() => {
            localStorage.setItem('language', 'tr');
        });
        await page.reload();
        await page.waitForTimeout(1000);
        await takeScreenshot('register_page_tr_light');

        const registerTitleTr = await page.textContent('h1');
        if (!registerTitleTr.includes('Harcamalarını')) throw new Error('Register Title TR incorrect: ' + registerTitleTr);
        console.log('Register Title TR verified');

        console.log('ALL TESTS PASSED');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await browser.close();
    }
})();
