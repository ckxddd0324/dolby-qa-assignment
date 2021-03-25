const { expect } = require('chai');
const fs = require('fs');
const fetch = require('node-fetch');
require('dotenv').config();

const { getApiKey } = require('../helper');

const file_path = 'test_audio.wav';
const readStream = fs.createReadStream(file_path);

describe('analyze sound @api-test', () => {
  let apiKey;
  let uploadUrl;

  const dolbySoundUrl = `dlb://in/example${new Date().getTime()}.wav`;
  const dolbySoundOutput = `dlb://out/example${new Date().getTime()}.analysis.json`;
  before(async () => {
    apiKey = await getApiKey();
    // comment the line above and add your api key below
    // this will not run the login helper
    apiKey = 'keyyyyyy';
  });

  it('create /media/input', async () => {
    const response = await fetch('https://api.dolby.com/media/input', {
      method: 'POST',
      body: JSON.stringify({
        url: dolbySoundUrl
      }),
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      }
    }).then(res => {
      expect(res.status).to.be.eql(200, 'response is not 200');
      return res.json();
    });
    expect(response).to.have.property('url');
    expect(response.url).to.be.a('string');
    uploadUrl = await response.url;
  });

  it('upload the media to dlb with the created Url', async () => {
    await fetch(uploadUrl, {
      method: 'PUT',
      body: readStream,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': fs.statSync(file_path).size
      }
    }).then(res => {
      expect(res.status).to.be.eql(200, 'response is not 200');
    });
  });

  it('send to analyze api', async () => {
    const response = await fetch('https://api.dolby.com/media/analyze', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        input: dolbySoundUrl,
        output: dolbySoundOutput
      })
    }).then(res => {
      expect(res.status).to.be.eql(200, 'response is not 200');
      return res.json();
    });
    expect(response).to.have.property('job_id');
    expect(response.job_id).to.be.a('string');
    jobId = await response.job_id;
  });

  it('fetch till progress is 100', async () => {
    let isProgressDone = false;
    let repsonse;
    while (!isProgressDone) {
      await delay(1500);
      response = await fetch(
        `https://api.dolby.com/media/analyze?job_id=${jobId}`,
        {
          method: 'GET',
          headers: {
            'x-api-key': apiKey,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          }
        }
      ).then(res => {
        expect(res.status).to.be.eql(200, 'response is not 200');
        return res.json();
      });
      if (response.status === 'Success' && response.progress === 100) {
        isProgressDone = true;
      }
    }
    expect(response.status).to.be.eql('Success');
    expect(response.progress).to.be.eql(100);
    expect(response.path).to.be.eql('/media/analyze');
    expect(response.api_version).to.be.eql('b1.4');
    expect(response.result).to.be.eql({});
  });

  it('get download output', async () => {
    const response = await fetch(
      `https://api.dolby.com/media/output?url=${dolbySoundOutput}`,
      {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json'
        }
      }
    ).then(res => {
      expect(res.status).to.be.eql(200, 'response is not 200');
      return res;
    });
    const fileStream = fs.createWriteStream('output.json');
    await new Promise((resolve, reject) => {
      response.body.pipe(fileStream);
      response.body.on('error', reject);
      fileStream.on('finish', resolve);
    });
  });

  it('check if downloaded output matched with expected result', async () => {
    const outputRawData = fs.readFileSync('output.json');
    const outputObj = JSON.parse(outputRawData);
    expect(outputObj).to.have.property('processed_region');
    expect(outputObj.processed_region.audio).to.have.property('bandwidth');
    expect(outputObj.processed_region.audio.bandwidth).to.be.eql(4651);
    expect(outputObj.processed_region.audio).to.have.property('silence');
    expect(outputObj.processed_region.audio.silence).to.have.property(
      'percentage'
    );
    expect(outputObj.processed_region.audio.silence.percentage).to.be.eql(33.2);
    expect(outputObj.processed_region.audio.silence).to.have.property(
      'sections'
    );
    expect(outputObj.processed_region.audio.silence.sections).to.have.length(1);
    expect(
      outputObj.processed_region.audio.silence.sections[0].duration
    ).to.eql(4.98);
  });
});

const delay = ms => new Promise(res => setTimeout(res, ms));
