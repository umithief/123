import assert from "node:assert/strict";
import { chromium } from "playwright";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";
const url=process.argv[2]||"http://127.0.0.1:8080";
const built=url.includes("8081");
const browser=await chromium.launch({executablePath:"/usr/bin/chromium",args:["--no-sandbox"]});
try {
 for(const width of [390,1280]){
  const page=await browser.newPage({viewport:{width,height:844},acceptDownloads:true});await useRuntimeAssetFetch(page);
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(url);await page.locator('.aura-studio[data-ready="true"]').waitFor();
  await page.getByRole('button',{name:'Müzik seç ve başla',exact:true}).waitFor();
  assert.equal(await page.getByRole('tablist').isVisible(),false);
  await page.screenshot({path:`/workspace/screenshots/aura-easy-start-${built?'built':'dev'}-${width}.png`});
  const picker=page.waitForEvent('filechooser');await page.getByRole('button',{name:'Müzik seç ve başla',exact:true}).click();
  await (await picker).setFiles('/workspace/screenshots/aura-easy-track.mp3');
  await page.getByRole('button',{name:'Duraklat',exact:true}).click();
  assert.equal(await page.getByRole('tab',{name:'Görsel',exact:true}).getAttribute('aria-selected'),'true');
  assert.equal(await page.getByRole('group',{name:'Görselleştirmeler',exact:true}).getByRole('button').count(),6);
  if(width===390){const box=await page.getByRole('tablist').boundingBox();assert.ok(box.y>700&&box.y+box.height<=845,JSON.stringify(box));}
  await page.getByRole('button',{name:'DNA',exact:true}).click();
  await page.getByRole('tab',{name:'Kapak',exact:true}).click();
  await page.getByLabel('Kapak fotoğrafı dosyası',{exact:true}).setInputFiles('/workspace/project/public/og.jpg');
  await page.getByRole('img',{name:'Yüklenen kapak',exact:true}).waitFor();
  await page.getByRole('tab',{name:'Altyazı',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Altyazı oluştur',exact:true}).isVisible(),true);
  assert.equal(await page.getByRole('group',{name:'Altyazı şablonları',exact:true}).isVisible(),false);
  await page.getByLabel('SRT altyazı dosyası',{exact:true}).setInputFiles({name:'easy.srt',mimeType:'application/x-subrip',buffer:Buffer.from('1\n00:00:00,000 --> 00:00:04,000\nMüziğini seç videonu yarat\n')});
  await page.getByRole('group',{name:'Altyazı şablonları',exact:true}).waitFor();
  await page.getByRole('button',{name:'Viral Sarı şablonu',exact:true}).click();
  await page.getByRole('button',{name:'Metni düzenle',exact:true}).click();
  await page.getByLabel('1. altyazı metni',{exact:true}).fill('Kolayca kendi videonu oluştur');
  await page.getByRole('button',{name:'Görünüm',exact:true}).click();
  await page.getByRole('button',{name:'Kaydet',exact:true}).click();
  await page.getByRole('button',{name:'9:16 Reels / Story',exact:true}).click();
  await page.screenshot({path:`/workspace/screenshots/aura-easy-export-${built?'built':'dev'}-${width}.png`});
  assert.equal(await page.getByRole('button',{name:'Videoyu hazırla',exact:true}).isEnabled(),true);
  // Cancellation must release the recorder, close its modal and permit retry.
  await page.getByRole('button',{name:'Videoyu hazırla',exact:true}).click();
  await page.getByRole('dialog').waitFor();
  await page.getByRole('button',{name:'Hazırlamayı iptal et',exact:true}).click();
  await page.getByRole('dialog').waitFor({state:'hidden'});
  const download=page.waitForEvent('download',{timeout:30000});
  await page.getByRole('button',{name:'Videoyu hazırla',exact:true}).click();
  const file=await download;await file.saveAs(`/workspace/screenshots/aura-easy-${built?'built':'dev'}-${width}.mp4`);
  await page.getByRole('dialog').waitFor({state:'hidden'});
  assert.equal(await page.locator('audio').evaluate(audio=>audio.paused),true);
  await page.getByRole('button',{name:'Tekrar indir',exact:true}).waitFor();
  await page.getByRole('tab',{name:'Görsel',exact:true}).click();
  await page.screenshot({path:`/workspace/screenshots/aura-easy-editor-${built?'built':'dev'}-${width}.png`});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await page.getByRole('button',{name:'Tüm araçlar',exact:true}).click();
  await page.getByRole('button',{name:'MP4 kaydet',exact:true}).waitFor();
  await page.reload();await page.locator('.aura-studio[data-ready="true"]').waitFor();
  assert.equal(await page.getByRole('button',{name:'Kolay düzenle',exact:true}).isVisible(),true);
  await page.getByRole('button',{name:'Kolay düzenle',exact:true}).click();
  await page.getByRole('button',{name:'Müzik seç ve başla',exact:true}).waitFor();
  assert.deepEqual(errors,[]);console.log(JSON.stringify({url,width,onboarding:true,bottomTools:true,cover:true,captions:true,automaticVideo:true,cancelRetry:true,modePersistence:true,errors}));await page.close();
 }
}finally{await browser.close();}
