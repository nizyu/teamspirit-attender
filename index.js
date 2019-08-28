const puppeteer = require('puppeteer');
const config = require('config');
const process = require('process');


(async () => {
  const browser = await puppeteer.launch({
    args: config.proxy ? [ '--proxy-server=' + config.proxy ] : []
  });

  try {
    const page = await browser.newPage();
    
    // ログイン
    await page.goto('https://teamspirit.cloudforce.com/');
    await page.type("input#username", config.id);
    await page.type("input#password", config.password);
    await page.screenshot({path: '1.png'});
    await page.click('input#Login');

    // 打刻ボタン表示
    await page.waitFor('a[title="勤怠打刻"]', {timeout: 10000});
    await page.screenshot({path: '2.png'});
    // なぜかpuppeteerのclickが効かないのでDOMを掴んで直接クリック
    await page.evaluate(() => {
      const a = document.querySelector('a[title="勤怠打刻"]');
      a.click();
    });

    // iframe で埋め込まれるので...
    //await page.waitFor('iframe[title="Ts1PushTimeView"]', {timeout: 10000});
    await page.waitFor(5000);
    await page.screenshot({path: '3.png'});
    const frame = await page.$('iframe[title="Ts1PushTimeView"]');
    const frameContent = await eh.contentFrame();

    switch(process.argv[2]) {
      case 'attend':
        const attendButton = await frameContent.$('button#pushStart')
        await attendButton.click();
        break;
      case 'leave':
        const leaveButton = await frameContent.$('button#pushEnd')
        await leaveButton.click();
        break;
      default:
        console.error('知らないコマンド')
    }
    await page.waitFor(5000);
    await page.screenshot({path: '4.png'});
    console.log('ミッションコンプリート.')
  } catch(error) {
    console.error('エラーが発生しました')
    console.error(error)
  } finally {
    await browser.close();
  }

})();
