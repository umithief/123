import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { useRuntimeAssetFetch } from './browser-runtime.mjs';
import { unpackProject } from '../src/components/aura/project-archive.ts';
const url=process.argv[2]||'http://127.0.0.1:8080/',tag=url.includes('8082')?'android':url.includes('8081')?'built':'dev';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{for(const width of (process.env.QA_WIDTHS||'390,1280,320').split(',').map(Number)){
 const p=await browser.newPage({viewport:{width,height:width===320?600:844},hasTouch:width<700,acceptDownloads:true});p.setDefaultTimeout(20000);await useRuntimeAssetFetch(p);
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(url);await p.locator('.aura-studio[data-ready="true"]').waitFor();
 const chooser=p.waitForEvent('filechooser');await p.locator('[data-intent="video"]').click();await(await chooser).setFiles('/workspace/screenshots/aura-scenes-fixture.mp4');await p.waitForFunction(()=>document.querySelector('.aura-studio')?.dataset.tool==='cuts');
 if(await p.locator('.timeline-toggle').getAttribute('aria-expanded')==='false')await p.locator('.timeline-toggle').click();
 const tl=p.locator('.focused-timeline');assert.equal(await tl.getAttribute('data-controls'),'clip');assert.equal(await p.locator('.timeline-range').isVisible(),false);
 await p.screenshot({path:`/workspace/screenshots/usability-133-${tag}-${width}-01-edit.png`});
 if(await p.locator('.editor-tool-heading .editor-done').isVisible())await p.locator('.editor-tool-heading .editor-done').click();if(await p.locator('.timeline-toggle').getAttribute('aria-expanded')==='false')await p.locator('.timeline-toggle').click();
 await p.locator('.source-clip-button').first().click();assert.equal(await p.locator('.aura-studio').getAttribute('data-tool'),'none');assert.equal(await p.locator('.timeline-toggle').getAttribute('aria-expanded'),'true');
 await tl.getByRole('button',{name:'Klip ayarları',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.aura-studio')?.dataset.tool==='cuts');await p.locator('.editor-tool-heading .editor-done').click();assert.equal(await p.locator('.timeline-toggle').getAttribute('aria-expanded'),'true');
 if(width<700){assert.equal(await p.locator('.studio-inspector').isVisible(),false);const height=await p.locator('.canvas-frame').evaluate(n=>n.getBoundingClientRect().height);assert.ok(height>(width===320?110:320),String(height));}
 const ruler=p.getByRole('slider',{name:'Zaman çizelgesinde gezin',exact:true});
 const seek=async n=>{await ruler.focus();await p.keyboard.press('Home');for(let i=0;i<n;i++)await p.keyboard.press('Shift+ArrowRight');};
 await seek(3);await tl.getByRole('button',{name:'Böl',exact:true}).click();assert.equal(await p.locator('.timeline-clip').count(),2);
 await p.getByRole('button',{name:'Son düzenlemeyi geri al',exact:true}).click();assert.equal(await p.locator('.timeline-clip').count(),1);await p.getByRole('button',{name:'Son düzenlemeyi yinele',exact:true}).click();assert.equal(await p.locator('.timeline-clip').count(),2);
 await tl.getByRole('button',{name:'Aralık',exact:true}).click();await seek(1);await tl.getByRole('button',{name:'Giriş',exact:true}).click();await seek(2);await tl.getByRole('button',{name:'Çıkış',exact:true}).click();assert.match(await p.locator('.timeline-range-info').innerText(),/1.0 sn/);
 assert.equal(await p.locator('.timeline-range').evaluate(n=>getComputedStyle(n).flexWrap),'nowrap');
 await p.screenshot({path:`/workspace/screenshots/usability-133-${tag}-${width}-02-range.png`});
 await tl.getByRole('button',{name:'Aralığı tut',exact:true}).click();
 const dl=p.waitForEvent('download');await p.getByRole('button',{name:'Projeyi kaydet',exact:true}).click();const path=`/workspace/screenshots/usability-133-${tag}-${width}.aura.zip`;await(await dl).saveAs(path);const archive=await unpackProject(new Blob([readFileSync(path)]));const data=JSON.parse(await archive.get('project.json').text());assert.ok(Math.abs(data.editor.clips.reduce((n,c)=>n+(c.out-c.in)/c.rate,0)-1)<.01);
 await p.getByRole('button',{name:'Son düzenlemeyi geri al',exact:true}).click();
 await tl.getByRole('button',{name:'Görünüm',exact:true}).click();await p.getByRole('button',{name:'Zaman çizelgesini yakınlaştır',exact:true}).click();assert.match(await p.locator('.timeline-zoom').innerText(),/1.5/);await p.getByRole('button',{name:'Tümünü göster',exact:true}).click();assert.match(await p.locator('.timeline-zoom').innerText(),/1.0/);
 await p.getByRole('button',{name:'Araç bul',exact:true}).click();const dialog=p.locator('.studio-guide-dialog');await dialog.waitFor();await p.getByLabel('Araç ara',{exact:true}).fill('altyazi');await p.keyboard.press('Enter');await dialog.waitFor({state:'hidden'});assert.equal(await p.locator('.aura-studio').getAttribute('data-tool'),'captions');
 await p.keyboard.press('Control+k');await dialog.waitFor();await dialog.getByText('Son kullanılanlar',{exact:true}).waitFor();await p.getByLabel('Araç ara',{exact:true}).fill('olmayan123');await dialog.getByRole('status').waitFor();await p.keyboard.press('Escape');assert.equal(await p.getByRole('button',{name:'Araç bul',exact:true}).evaluate(n=>n===document.activeElement),true);
 await p.keyboard.press('Control+k');await dialog.waitFor();await p.getByLabel('Araç ara',{exact:true}).fill('sablon');await p.screenshot({path:`/workspace/screenshots/usability-133-${tag}-${width}-03-search.png`});await p.keyboard.press('Enter');await p.locator('.video-templates-dialog').waitFor();await p.keyboard.press('Escape');
 await p.getByRole('button',{name:'Araç bul',exact:true}).click();await p.getByLabel('Araç ara',{exact:true}).fill('hazir arac');await p.keyboard.press('Enter');await p.locator('.quick-tools-dialog').waitFor();await p.keyboard.press('Escape');
 if(width===1280){await p.getByRole('button',{name:'Switch to English',exact:true}).click();await p.keyboard.press('Control+k');await p.locator('.studio-guide-dialog input').fill('equalizer');await p.keyboard.press('Enter');await p.waitForFunction(()=>document.querySelector('.aura-studio')?.dataset.tool==='sound');}
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const header=await p.locator('.studio-header').evaluate(n=>[...n.querySelectorAll('button')].filter(b=>b.getClientRects().length).every(b=>b.getBoundingClientRect().right<=innerWidth+1));assert.ok(header,'header controls must fit');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({tag,width,groups:true,horizontalRange:true,stableSelection:true,rangeDuration:1,undoRedo:true,search:true,shortcuts:true,recent:true,templates:true,quickTools:true,errors}));await p.close();
}}finally{await browser.close();}
