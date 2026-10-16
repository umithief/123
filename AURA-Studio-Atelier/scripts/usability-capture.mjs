import { chromium } from 'playwright';
import { useRuntimeAssetFetch } from './browser-runtime.mjs';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try {for(const width of [390,1280]){
 const p=await browser.newPage({viewport:{width,height:844}});await useRuntimeAssetFetch(p);await p.goto('http://127.0.0.1:8080/');await p.locator('.aura-studio[data-ready="true"]').waitFor();
 console.log('start',width,(await p.locator('button').allTextContents()).slice(0,12));
 const chooser=p.waitForEvent('filechooser');await p.locator('[data-intent="video"]').click();await(await chooser).setFiles('/workspace/screenshots/aura-scenes-fixture.mp4');
 await p.waitForFunction(()=>document.querySelector('.aura-studio')?.dataset.tool==='cuts');
 if(await p.locator('.timeline-toggle').getAttribute('aria-expanded')==='false')await p.locator('.timeline-toggle').click();
 await p.screenshot({path:`/workspace/screenshots/usability-01-before-edit-${width}.png`});
 console.log('edit',width,await p.locator('.timeline-actions, .timeline-range').allTextContents());
 await p.locator('.editor-tool-heading .editor-done').click();await p.screenshot({path:`/workspace/screenshots/usability-02-before-tools-${width}.png`});
 console.log('tools',width,await p.locator('.atelier-library').innerText());await p.close();
}}finally{await browser.close();}
