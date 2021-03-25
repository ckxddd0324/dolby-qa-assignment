const { expect } = require('chai');
const puppeteer = require('puppeteer');
const fs = require('fs');

describe('login to dolby.io, create app, get media key @ui-test', function() {
  let browser;
  let page;
  const appName = `app_test_${new Date().getTime()}`;

  before(async () => {
    browser = await puppeteer.launch({ slowMo: 100 });
    page = await browser.newPage();
    page.setViewport({
      width: 1200,
      height: 1080
      // deviceScaleFactor: 1
    });
    await page.goto('https://dolby.io/');
  });

  after(async () => {
    await browser.close();
  });

  it('navigate to dolby.io', async function() {
    expect(await page.url()).eql('https://dolby.io/', 'url is not match');
    expect(await page.title()).eql(
      'Dolby.io - Voice, Audio, and Video APIs for Communications and Media Transformation'
    );
  });

  it('login as an user', async function() {
    const loginLogoutBtnSelector = 'a[class="a-tag t-eyebrow"]';
    const usernameSelector = '#username';
    const passwordSelector = '#password';
    const submitBtn = '#kc-login';

    expect(await page.$(loginLogoutBtnSelector)).not.to.be.null;
    await page.click(loginLogoutBtnSelector);
    const username = await page.$(usernameSelector);
    const password = await page.$(passwordSelector);
    await page.type(usernameSelector, 'gn018681442@gmail.com');
    await password.type('Ck@20021991');
    expect(await page.evaluate(x => x.value, username)).to.be.eql(
      'gn018681442@gmail.com'
    );
    expect(await page.evaluate(x => x.value, password)).to.be.eql(
      'Ck@20021991'
    );
    await page.click(submitBtn);
    expect(page.$(loginLogoutBtnSelector)).not.to.be.null;
  });

  it('user should able see create new app modal and able to create new app', async () => {
    const newAppBtnSelector = 'div > div > div.box > button';
    const newAppModalSelector = '[class="box-create-app"]';
    const appNameInputSelector = '[id="Application Name: "]';
    const submitBtn = '[class="box-create-app-container-button"] button';
    expect(await page.url()).to.includes('dashboard');
    await page.waitForSelector(newAppBtnSelector);
    await page.click(newAppBtnSelector);
    await page.waitForSelector(newAppModalSelector);
    await page.type(appNameInputSelector, appName);
    await page.click(submitBtn);
  });

  it('click to view created app and redirect to app page', async () => {
    const newAppModalSelector = '[class="box-create-app"]';
    const getLatestCreatedAppNameSelector =
      'div.box > table > tbody > tr:last-child a';
    await page.waitForSelector(newAppModalSelector, { hidden: true });
    const latestApp = await page.waitForSelector(
      getLatestCreatedAppNameSelector
    );

    expect(await page.evaluate(x => x.textContent, latestApp)).to.be.eql(
      appName
    );
    const lastAppUrl = await page.$(getLatestCreatedAppNameSelector);
    await lastAppUrl.click();
    const keyElement = await page.$('#media-consumer-key');
    const key = await (await keyElement.getProperty('value')).jsonValue();
    console.log(await key);
    fs.writeFile(
      'mediaKey.json',
      JSON.stringify({ apiKey: key }),
      'utf8',
      err => {
        if (err) {
          return console.log(err);
        }
      }
    );
  });
});
