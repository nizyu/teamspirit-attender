const puppeteer = require('puppeteer');
const config = require('config');
const process = require('process');


(async () => {
  const browser = await puppeteer.launch({
    // ブラウザの動作を確認したいときはコメントアウト
    //headless: false,
    args: config.proxy ? [ '--proxy-server=' + config.proxy, '--no-sandbox' ] : [ '--no-sandbox' ]
  });

  try {
    const page = await browser.newPage();
    
    // ログイン
    await page.goto('https://teamspirit.cloudforce.com/');
    await page.type("input#username", config.id);
    await page.type("input#password", config.password);
    await page.click('input#Login');

    // 打刻ボタン表示
    await page.waitFor('a[title="勤怠打刻"]', {timeout: 10000});
    console.log("ログイン成功しました")
    // なぜかpuppeteerのclickが効かないのでDOMを掴んで直接クリック
    await page.waitFor(3000);
    await page.evaluate(() => {
      const a = document.querySelector('a[title="勤怠打刻"]');
      a.click();
    }, {});

    // iframe ロードまち
    await page.waitFor(5000);
    const frame = await page.$('iframe[title="Ts1PushTimeView"]');
    const frameContent = await frame.contentFrame();

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
        console.error('知らないコマンドです')
    }
    console.log('打刻しました(打刻結果確認中)');
    await frameContent
      .waitForSelector('#PushFinish', {timeout: 5000, visible: true})
      .then(
        () => console.log('打刻の成功を確認できました'),
        () => frameContent.$('#errorMsg')
          .then(element => frameContent.evaluate(elm => elm.textContent, element))
          .then(txt => console.log(txt))
      );
  } catch(error) {
    console.error('エラーが発生しました')
    console.error(error)
  } finally {
    await browser.close();
  }

})();
