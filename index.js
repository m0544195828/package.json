const puppeteer = require('puppeteer');
const fs = require('fs');
const nodemailer = require('nodemailer');

const emailUser = 'mf0583275242@gmail.com';
const emailPass = 'gjzrznpbzvzfsmzw';
const emailTo   = 'm0544195828@gmail.com';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass
  }
});

function sendEmailAlert(text) {
  const mailOptions = {
    from: emailUser,
    to: emailTo,
    subject: '📢 עדכון חדש מהאתר',
    text: text
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('שגיאה בשליחת מייל:', err.message);
    } else {
      console.log('✉️ נשלח מייל:', info.response);
    }
  });
}

const historyFile = 'history.json';
let history = fs.existsSync(historyFile)
  ? JSON.parse(fs.readFileSync(historyFile))
  : { sent: [] };

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  async function checkForUpdates() {
    const page = await browser.newPage();
    try {
      await page.goto('https://www.kore.co.il/mplus', { waitUntil: 'networkidle2' });
      await page.waitForSelector('p[data-v-3339d2fa]', { timeout: 8000 });

      const updates = await page.$$eval('p[data-v-3339d2fa]', elements =>
        elements.map(el => el.textContent.trim()).filter(Boolean)
      );

      let newSent = false;

      for (const update of updates) {
        if (!history.sent.includes(update)) {
          const logEntry = `[${new Date().toLocaleString()}] ${update}`;
          console.log(logEntry);
          sendEmailAlert(update);
          history.sent.push(update);
          newSent = true;
        }
      }

      if (newSent) {
        fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
      }
    } catch (err) {
      console.error('שגיאה בשליפה:', err.message);
    } finally {
      await page.close();
      await browser.close();
    }
  }

  await checkForUpdates();
})();
