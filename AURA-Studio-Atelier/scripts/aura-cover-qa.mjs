import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { useRuntimeAssetFetch } from './browser-runtime.mjs';
const url=process.argv[2] || 'http://127.0.0.1:8080/';
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
const select=async(page,name)=>{
 await page.getByRole('button',{name,exact:true}).click();
 await page.waitForFunction(label=>[...document.querySelectorAll('button')].some(b=>b.textContent.trim()===label && b.getAttribute('aria-pressed')==='true'),name);
};
try {
 for(const viewport of [{width:1280,height:800},{width:390,height:844}]) {
  const page=await browser.newPage({viewport,acceptDownloads:true});
  await useRuntimeAssetFetch(page);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error')console.log('browser:',msg.text());});
  await page.goto(url);await page.waitForTimeout(1200);
  await page.getByRole('button',{name:'Örnek',exact:true}).click();
  await page.getByText('Kapak fotoğrafı',{exact:true}).click();
  const upload=page.getByLabel('Kapak fotoğrafı dosyası');
  await upload.setInputFiles({name:'invalid.png',mimeType:'image/png',buffer:Buffer.from('invalid image')});
  await page.getByRole('status').filter({hasText:'Fotoğraf açılamadı'}).waitFor();
  await upload.setInputFiles('public/og.jpg');
  await page.getByAltText('Yüklenen kapak').waitFor();
  await select(page,'İkisi');await select(page,'Kare');
  await page.getByLabel('Kapak boyutu',{exact:true}).focus();
  await page.keyboard.press('Home');
  for(let i=0;i<30;i++) await page.keyboard.press('ArrowRight');
  await page.getByLabel('Arka plan görünürlüğü',{exact:true}).focus();
  await page.keyboard.press('Home');
  for(let i=0;i<30;i++) await page.keyboard.press('ArrowRight');
  await page.getByLabel('Basla hareket et',{exact:true}).uncheck();
  await page.getByText('Kapak fotoğrafı',{exact:true}).click();
  await select(page,'Tünel');
  await page.getByRole('radio',{name:'Altın',exact:true}).click();
  await page.waitForTimeout(3500);
  await page.screenshot({path:`/workspace/screenshots/aura-cover-${viewport.width}.png`});
  assert.ok(await page.evaluate(()=>document.querySelector('canvas').toDataURL().startsWith('data:image/png')),'recording canvas must stay origin-clean');
  await page.reload();await page.waitForTimeout(1200);
  await page.getByText('Kapak fotoğrafı',{exact:true}).click();
  await page.getByAltText('Yüklenen kapak').waitFor();
  assert.equal(await page.getByRole('button',{name:'İkisi',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(await page.getByRole('button',{name:'Kare',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(await page.getByLabel('Kapak boyutu',{exact:true}).inputValue(),'0.5');
  await page.getByRole('button',{name:'Örnek',exact:true}).click();
  await select(page,'Merkez');await select(page,'Daire');
  await page.getByText('Kapak fotoğrafı',{exact:true}).click();
  if(viewport.width===1280) {
   // Record a short real clip and save it for ffprobe / frame inspection.
   await page.getByRole('button',{name:'MP4 olarak indir',exact:true}).click();
   await page.getByRole('button',{name:'Kaydı durdur',exact:true}).waitFor();
   await page.waitForTimeout(3500);
   try {
    const [download] = await Promise.all([
     page.waitForEvent('download',{timeout:20000}),
     page.getByRole('button',{name:'Durdur',exact:true}).click(),
    ]);
    await download.saveAs('/workspace/screenshots/aura-cover-recording.mp4');
   } catch(error) {
    console.log(await page.locator('body').innerText());
    await page.screenshot({path:'/workspace/screenshots/aura-record-error.png'});
    throw error;
   }
  }
  await page.getByText('Kapak fotoğrafı',{exact:true}).click();
  await page.getByRole('button',{name:'Kapağı kaldır',exact:true}).click();
  await page.getByAltText('Yüklenen kapak').waitFor({state:'hidden'});
  assert.equal(await page.getByAltText('Yüklenen kapak').count(),0);
  await page.waitForTimeout(500);await page.reload();await page.waitForTimeout(1200);
  await page.getByText('Kapak fotoğrafı',{exact:true}).click();
  assert.equal(await page.getByAltText('Yüklenen kapak').count(),0);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.getByRole('button',{name:'Örnek',exact:true}).click();
  await select(page,'Akış');await select(page,'Dalga Ağı');
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({url,viewport,coverUpload:true,invalidImage:true,restored:true,removed:true,originClean:true,errors}));
  await page.close();
 }
} finally {await browser.close();}
