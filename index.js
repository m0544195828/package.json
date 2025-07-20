const puppeteer = require('puppeteer');
const fs = require('fs');
const nodemailer = require('nodemailer');

// פרטי Gmail (זהירות: הסיסמה היא סיסמה לאפליקציה)
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
    subject: '📢 עדכון חדש',
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

const historyFile = 'sent-updates.txt';
let sentUpdates = fs.existsSync(historyFile)
  ? fs.readFileSync(historyFile, 'utf-8').split('\n').filter(Boolean)
  : [];

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  async function checkForUpdates() {
    const page = await browser.newPage();
    try {
      await page.goto('https://www.kore.co.il/mplus', { waitUntil: 'networkidle2' });
      await page.waitForSelector('div.post p', { timeout: 5000 });

      const updates = await page.$$eval('div.post p', elements =>
        elements.map(el => el.textContent.trim()).filter(Boolean)
      );

      for (const update of updates) {
        if (!sentUpdates.includes(update)) {
          const logEntry = `[${new Date().toLocaleString()}] ${update}`;
          console.log(logEntry);
          fs.appendFileSync('updates.txt', logEntry + '\n');
          fs.appendFileSync(historyFile, update + '\n');
          sendEmailAlert(update);
          sentUpdates.push(update);
        }
      }
    } catch (err) {
      console.error('שגיאה בשליפה:', err.message);
    } finally {
      await page.close();
    }
  }

  await checkForUpdates();
  setInterval(checkForUpdates, 10000); // כל 10 שניות
})();
