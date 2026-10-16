import {chromium} from 'playwright';import {useRuntimeAssetFetch} from './browser-runtime.mjs';
const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{for(const width of [390,1280,320]){
 const p=await b.newPage({viewport:{width,height:width===320?600:844}});await useRuntimeAssetFetch(p);await p.goto('http://127.0.0.1:8080');await p.locator('.aura-studio[data-ready="true"]').waitFor();
 await p.screenshot({path:`/workspace/screenshots/atelier-home-${width}.png`});
 await p.getByLabel('Müzik dosyası',{exact:true}).setInputFiles('/workspace/screenshots/aura-portrait-fixture.mp4');
 await p.waitForFunction(()=>!document.querySelector('.aura-studio').classList.contains('at-home'));
 await p.screenshot({path:`/workspace/screenshots/atelier-editor-${width}.png`});
 await p.locator('.aura-toolbar [data-tool="scenes"]').click();
 await p.screenshot({path:`/workspace/screenshots/atelier-scenes-${width}.png`});
 await p.locator('.atelier-navigation [data-workspace="text"]').click();await p.getByRole('button',{name:'Yazı ekle',exact:true}).click();
 await p.getByLabel('Katman metni',{exact:true}).fill('Kendi ritmini yarat');await p.getByLabel('Katman metni',{exact:true}).press('Tab');
 await p.screenshot({path:`/workspace/screenshots/atelier-text-${width}.png`});
 console.log(width,await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,canvas:document.querySelector('.canvas-frame').getBoundingClientRect().height})));await p.close();
}}finally{await b.close();}
