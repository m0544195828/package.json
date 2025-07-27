const puppeteer = require('puppeteer');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const emailUser = 'mf0583275242@gmail.com';
const emailPass = 'gjzrznpbzvzfsmzw';
const emailTo   = 'm0544195828@gmail.com';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: emailUser, pass: emailPass }
});

function hash(text) {
  return crypto.createHash('md5').update(text).digest('hex').slice(0, 10);
}

function sendEmailAlert(text) {
  const mailOptions = {
    from: emailUser,
    to: emailTo,
    subject: '📢 מבזק חדש ',
    text: text
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.error('❌ שגיאה בשליחת מייל:', err.message);
    else console.log('✉️ נשלח מייל:', info.response);
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

  const page = await browser.newPage();
  try {
    await page.goto('https://www.kore.co.il/newsflash', { waitUntil: 'networkidle2' });
    await page.waitForSelector('p.text', { timeout: 8000 });

    const updates = await page.$$eval('p.text', els =>
      els.map(el => el.textContent.trim()).filter(Boolean)
    );

    let newSent = false;

    for (const update of updates) {
      const updateId = hash(update);
      if (!history.sent.includes(updateId)) {
        const logEntry = `[${new Date().toLocaleString()}] ${update}`;
        console.log(logEntry);
        sendEmailAlert(update);
        history.sent.push(updateId);
        newSent = true;
      }
    }

    if (newSent) {
      fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
    } else {
      console.log('✅ אין עדכונים חדשים.');
    }
  } catch (err) {
    console.error('❌ שגיאה בשליפה:', err.message);
  } finally {
    await browser.close();
  }
})();
