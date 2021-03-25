const puppeteer = require('puppeteer');
const { expect } = require('chai');
require('dotenv').config();

const getApiKey = async function() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const appName = `app_test_${new Date().getTime()}`;
  let mediaAPIKey;
  page.setViewport({
    width: 1200,
    height: 1080,
    deviceScaleFactor: 1
  });
  await page.goto('https://dolby.io/');
  // check url
  expect(await page.url()).eql('https://dolby.io/', 'url is not match');
  expect(
    await page.title(),
    'Dolby.io - Voice, Audio, and Video APIs for Communications and Media Transformation'
  );
  await page.click('a[class="a-tag t-eyebrow"]');
  await page.type('#username', process.env.username);
  await page.type('#password', process.env.password);
  await page.click('#kc-login');
  try {
    await page.waitForSelector('a[class="a-tag t-eyebrow"]');
  } catch {
    console.error('unable to see the login status');
  }

  expect(await page.url()).to.includes('dashboard');
  try {
    await page.waitForSelector('div > div > div.box > button');
    await page.click('div > div > div.box > button');
  } catch {
    console.error('unable to find add new app');
  }

  await page.waitForSelector('[class="box-create-app"]');
  await page.type('[id="Application Name: "]', appName);
  await page.click('[class="box-create-app-container-button"] button');

  try {
    await page.waitForSelector('[class="box-create-app"]', { hidden: true });

    await page.waitForSelector('div.box > table > tbody > tr:last-child a');
    await page.click('div.box > table > tbody > tr:last-child a');
  } catch {
    console.error('unable to find new create app');
  }

  try {
    const element = await page.$('#media-consumer-key');
    mediaAPIKey = await (await element.getProperty('value')).jsonValue();
    console.log(mediaAPIKey, ' mediaAPIKey');
  } catch {
    console.error('unable to find mediaAPIKey');
  }

  await browser.close();
  return mediaAPIKey;
};

module.exports = {
  getApiKey
};
