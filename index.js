const puppeteer = require('puppeteer');
const config = require('config');
const process = require('process');

const attendBtnSelector = 'div#btnStInput.pw_btnnst';
const leaveBtnSelector = 'div#btnEtInput.pw_btnnet';
const stampingframeName = '06628000000tIES';

(async () => {
  const browser = await puppeteer.launch({
    // ブラウザの動作を確認したいときはコメントアウト
    // headless: false,
    args: config.proxy ? [ '--proxy-server=' + config.proxy, '--no-sandbox' ] : [ '--no-sandbox' ]
  });

  try {
    const page = await browser.newPage();
    // 打刻ボタンのiframeが描画領域に入ってないとロードされないようなので描画領域を広くとっておく
    await page.setViewport({ width: 1920, height: 1080 });

    
    // ログイン
    await page.goto('https://teamspirit.cloudforce.com/')
      .then(() => page.type("input#username", config.id))
      .then(() => page.type("input#password", config.password))
      .then(() => page.click('input#Login'))
      .then(() => page.waitForNavigation());

    // ログイン正鵠確認兼打刻ボタンのiframe取得
    const frame = await await page.frames().find(f => f.name() === stampingframeName);
    console.log('ログインしました');

    // 打刻
    switch(process.argv[2]) {
      case 'attend':
        await frame.waitForSelector(attendBtnSelector, {timeout: 10000, visible: true})
          .catch(() => {
            console.log('出勤ボタン押せません(打刻済み？)')
            throw Error('打刻済み？')
          });
        await frame.click(attendBtnSelector);
        console.log('出勤しました');
        break;

      case 'leave':
        await frame.waitForSelector(leaveBtnSelector, {timeout: 10000, visible: true})
          .catch(() => {
            console.log('退勤ボタン押せません(打刻済み？)')
            throw Error('打刻済み？')
          });
        await frame.click(leaveBtnSelector);
        console.log('退勤しました');
        break;

      default:
        console.error('知らないコマンドです')
    }

    // 打刻成功したら反映されるのを少し待つ
    await page.waitFor(3000);
  } catch(error) {
    console.error('エラーが発生しました')
    console.error(error)
  } finally {
    await browser.close();
  }
})();
