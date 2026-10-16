import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { useRuntimeAssetFetch } from './browser-runtime.mjs';
import { unpackProject } from '../src/components/aura/project-archive.ts';
import { CAPTION_TEMPLATES } from '../src/components/aura/caption-templates.ts';
import { SIGNATURE_ANIMATIONS, CAPTION_FINISHES } from '../src/components/aura/caption-signatures.ts';
const url=process.argv[2]||'http://127.0.0.1:8080/',tag=url.includes('8082')?'android':url.includes('8081')?'built':'dev';
const presets=CAPTION_TEMPLATES.filter(p=>p.category==='İmza');
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{for(const size of (process.env.QA_SIZES||'390x844,1280x800,320x600').split(',')){
 const [width,height]=size.split('x').map(Number),p=await browser.newPage({viewport:{width,height},hasTouch:width<700,acceptDownloads:true});await useRuntimeAssetFetch(p);p.setDefaultTimeout(18000);
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const tool=async()=>{await p.getByRole('button',{name:'Araç bul',exact:true}).click();await p.locator('.studio-guide-dialog input').fill('Altyazı ekle ve düzenle');await p.keyboard.press('Enter');await p.waitForFunction(()=>document.querySelector('.aura-studio')?.dataset.tool==='captions');};
 const sections=()=>p.getByRole('group',{name:'Altyazı tasarım bölümleri',exact:true});
 const gallery=()=>p.getByRole('group',{name:'Altyazı şablonları',exact:true});
 const choose=async preset=>{await sections().getByRole('button',{name:'Şablonlar',exact:true}).click();await gallery().getByRole('button',{name:preset.name+' şablonu',exact:true}).click();assert.equal(await gallery().getByRole('button',{name:preset.name+' şablonu',exact:true}).getAttribute('aria-pressed'),'true');};
 try{
  await p.goto(url);await p.locator('.aura-studio[data-ready="true"]').waitFor();
  const chooser=p.waitForEvent('filechooser');await p.locator('[data-intent="video"]').click();await(await chooser).setFiles('/workspace/screenshots/aura-scenes-fixture.mp4');await p.waitForFunction(()=>document.querySelector('.aura-studio')?.dataset.tool==='cuts');await tool();
  await p.getByLabel('SRT altyazı dosyası',{exact:true}).setInputFiles({name:'imza.srt',mimeType:'application/x-subrip',buffer:Buffer.from('1\n00:00:00,000 --> 00:00:03,000\nMüziğin ışığını hisset\n\n2\n00:00:03,000 --> 00:00:06,000\nÖzgürce, birlikte, yeniden.\n')});
  await p.getByRole('group',{name:'Şablon kategorisi',exact:true}).getByRole('button',{name:'İmza',exact:true}).click();assert.equal(await gallery().getByRole('button').count(),10);
  if(width===390){const c=gallery().locator('canvas').first();const a=await c.evaluate(c=>c.toDataURL());await p.waitForTimeout(220);assert.notEqual(await c.evaluate(c=>c.toDataURL()),a);await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(150);const b=await c.evaluate(c=>c.toDataURL());await p.waitForTimeout(200);assert.equal(await c.evaluate(c=>c.toDataURL()),b);await p.emulateMedia({reducedMotion:'no-preference'});}
  for(const preset of presets){
   await choose(preset);
   await sections().getByRole('button',{name:'Animasyonlar',exact:true}).click();await p.getByRole('group',{name:'Animasyon türü',exact:true}).getByRole('button',{name:/^Kombo/}).click();
   const anim=p.getByRole('group',{name:'Altyazı animasyonları',exact:true}).locator('button[aria-pressed="true"]');assert.ok((await anim.innerText()).startsWith(SIGNATURE_ANIMATIONS.find(a=>a.id===preset.options.animation).label));
   await sections().getByRole('button',{name:'Özelleştir',exact:true}).click();await p.getByRole('group',{name:'Altyazı görünümü',exact:true}).getByRole('button',{name:'Efekt',exact:true}).click();
   const finish=p.getByRole('group',{name:'Altyazı yazı efekti',exact:true}).locator('button[aria-pressed="true"]');assert.equal(await finish.innerText(),CAPTION_FINISHES.find(f=>f.id===preset.options.textEffect).label);
  }
  await choose(presets[0]);await choose(presets[1]);await p.getByRole('button',{name:'Görünümü geri al',exact:true}).click();assert.equal(await gallery().getByRole('button',{name:presets[0].name+' şablonu',exact:true}).getAttribute('aria-pressed'),'true');
  await choose(presets[9]);
  await p.screenshot({path:`/workspace/screenshots/signature-135-${tag}-${size}-templates.png`});
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.ok(await p.locator('.inspector-scroll').evaluate(n=>n.scrollWidth<=n.clientWidth+2));
  const download=p.waitForEvent('download');await p.getByRole('button',{name:'Projeyi kaydet',exact:true}).click();const path=`/workspace/screenshots/signature-135-${tag}-${size}.aura.zip`;await(await download).saveAs(path);
  const archive=await unpackProject(new Blob([readFileSync(path)])),data=JSON.parse(await archive.get('project.json').text());assert.equal(data.settings.captions.animation,'laser-trace');assert.equal(data.settings.captions.textEffect,'laser');assert.equal(data.wordCues[0].text,'Müziğin ışığını hisset');assert.equal(data.wordCues[1].end,6);
  await choose(presets[0]);await p.getByLabel('Kurgu yedek dosyası',{exact:true}).setInputFiles(path);await p.waitForFunction(()=>document.querySelector('.aura-studio')?.dataset.tool==='none'&&JSON.parse(localStorage.getItem('aura-captions-options')||'{}').animation==='laser-trace');await tool();
  await sections().getByRole('button',{name:'Animasyonlar',exact:true}).click();await p.getByRole('group',{name:'Animasyon türü',exact:true}).getByRole('button',{name:/^Kombo/}).click();assert.ok((await p.getByRole('group',{name:'Altyazı animasyonları',exact:true}).locator('button[aria-pressed="true"]').innerText()).startsWith('Lazer taraması'));
  await sections().getByRole('button',{name:'Özelleştir',exact:true}).click();await p.getByRole('group',{name:'Altyazı görünümü',exact:true}).getByRole('button',{name:'Efekt',exact:true}).click();await p.getByRole('group',{name:'Altyazı yazı efekti',exact:true}).getByRole('button',{name:'Altın folyo',exact:true}).click();
  await p.screenshot({path:`/workspace/screenshots/signature-135-${tag}-${size}-effects.png`});
  if(process.env.QA_EXPORT==='1'){
   await p.getByRole('button',{name:'Dışa aktar',exact:true}).click();await p.getByLabel('Video kalitesi',{exact:true}).selectOption('720');await p.getByRole('group',{name:'Video boyutu',exact:true}).getByRole('button').filter({hasText:'9:16'}).click();
   const video=p.waitForEvent('download',{timeout:90000});await p.getByRole('button',{name:'Videoyu hazırla',exact:true}).click();await(await video).saveAs(`/workspace/screenshots/signature-135-${tag}-${size}.mp4`);
  }
  assert.deepEqual(errors,[]);console.log(JSON.stringify({tag,size,templates:10,motions:10,finishes:10,roundtrip:true,revert:true,errors}));
 }catch(e){await p.screenshot({path:`/workspace/screenshots/signature-135-${tag}-${size}-ERROR.png`});console.error(await p.locator('.inspector-scroll').innerText().catch(()=>'<closed>'));throw e;}finally{await p.close();}
}}finally{await browser.close();}
