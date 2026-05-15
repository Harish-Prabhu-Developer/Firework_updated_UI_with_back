import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    console.log('Puppeteer launched successfully!');
    console.log('Executable path:', puppeteer.executablePath());
    await browser.close();
  } catch (error) {
    console.error('Launch failed:', error.message);
  }
})();
