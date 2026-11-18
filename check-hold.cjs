const { chromium } = require('playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({channel:'msedge',headless:true});
 try {
  const page = await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.TEST_URL||'http://127.0.0.1:8787'));
  await page.waitForFunction(()=>window.momongaDebug?.ready);await page.click('#start-game');await page.fill('#player-name','검증친구');await page.click('#join-game');await page.waitForFunction(()=>momongaDebug.started);
  const height=()=>page.evaluate(()=>momongaDebug.altitude);
  await page.keyboard.down('KeyQ');await page.waitForTimeout(1200);const first=await height();
  await page.waitForTimeout(1500);const held=await height();
  await page.keyboard.up('KeyQ');await page.waitForTimeout(700);const released=await height();
  assert(held>first+.7,'Holding Q must continue gaining height');
  assert(released<held-.3,'Releasing Q must descend');
  await page.waitForFunction(()=>momongaDebug.altitude===0,{timeout:15000});
  const rest=await page.evaluate(()=>momongaDebug.bones.left_arm.quaternion.toArray());
  await page.keyboard.down('KeyW');await page.waitForTimeout(250);
  const walk=await page.evaluate(()=>momongaDebug.bones.left_arm.quaternion.toArray());
  await page.keyboard.up('KeyW');assert(walk.some((v,i)=>Math.abs(v-rest[i])>.01),'Walking must swing arms');
  await page.keyboard.down('KeyQ');await page.waitForTimeout(1000);
  await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
  const blurred=await height();await page.waitForTimeout(600);assert(await height()<blurred,'Blur must release ascent');
  await page.keyboard.up('KeyQ');assert.deepEqual(errors,[]);
  console.log({first,held,released,armsAnimated:true,blurReleased:true});
 } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
