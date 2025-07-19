const puppeteer = require('puppeteer');
const fs = require('fs');
const nodemailer = require('nodemailer');

// פרטי Gmail ישירות בקוד:
const emailUser = 'mf0583275242@gmail.com'; // כתובת שולח
const emailPass = 'gjzrznpbzvzfsmzw';       // סיסמת אפליקציה מגוגל
const emailTo   = 'm0544195828@gmail.com,another@example.com'; // נמענים

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

let lastUpdate = null;

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  async function checkForUpdate() {
    const page = await browser.newPage();
    try {
      await page.goto('https://www.kore.co.il/mplus', { waitUntil: 'networkidle2' });
      await page.waitForSelector('div.post p', { timeout: 5000 });
      const update = await page.$eval('div.post p', el => el.textContent.trim());

      if (update && update !== lastUpdate) {
        const logEntry = `[${new Date().toLocaleString()}] ${update}`;
        console.log(logEntry);
        fs.appendFileSync('updates.txt', logEntry + '\n');
        sendEmailAlert(update);
        lastUpdate = update;
      }
    } catch (err) {
      console.error('שגיאה בשליפה:', err.message);
    } finally {
      await page.close();
    }
  }

  await checkForUpdate();
  setInterval(checkForUpdate, 10000);
})();
