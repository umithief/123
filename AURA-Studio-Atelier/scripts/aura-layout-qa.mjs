import assert from "node:assert/strict";
import { chromium } from "playwright";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";
const url = process.argv[2] || "http://127.0.0.1:8080/";
const tag = url.includes("8082") ? "android" : url.includes("8081") ? "built" : "dev";
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
try {
 for (const [width,height] of [[390,844],[320,600],[1280,800]]) {
  const p=await browser.newPage({viewport:{width,height}}); await useRuntimeAssetFetch(p);
  const errors=[];p.on("pageerror",e=>errors.push(e.message));
  await p.goto(url);await p.locator('.aura-studio[data-ready="true"]').waitFor();
  const chooser=p.waitForEvent("filechooser");await p.locator('[data-intent="video"]').click();await(await chooser).setFiles('/workspace/screenshots/aura-scenes-fixture.mp4');
  await p.waitForFunction(()=>document.querySelector('.aura-studio')?.dataset.format==='portrait');
  await p.waitForTimeout(300);
  const bounds=await p.evaluate(()=>{
   const r=document.querySelector('.aura-studio').getBoundingClientRect(),n=document.querySelector('.atelier-navigation').getBoundingClientRect(),f=document.querySelector('.canvas-frame').getBoundingClientRect(),c=document.querySelector('.canvas-frame canvas'),fit=document.querySelector('.preview-fit').getBoundingClientRect();
   return {navGap:r.bottom-n.bottom,navHeight:n.height,frameWidth:f.width,frameHeight:f.height,ratio:f.width/f.height,canvasRatio:c.width/c.height,inside:f.top>=fit.top-1&&f.bottom<=fit.bottom+1,overflow:document.documentElement.scrollWidth>innerWidth,expanded:document.querySelector('.timeline-toggle').getAttribute('aria-expanded')};
  });
  assert.ok(Math.abs(bounds.ratio-9/16)<.01,JSON.stringify(bounds));assert.ok(Math.abs(bounds.canvasRatio-bounds.ratio)<.01);assert.ok(bounds.inside);assert.equal(bounds.overflow,false);
  if(width<700){assert.ok(Math.abs(bounds.navGap)<1);assert.ok(bounds.navHeight<=46);assert.equal(bounds.expanded,'false');assert.ok(bounds.frameHeight>(height===844?280:140),JSON.stringify(bounds));}
  await p.screenshot({path:`/workspace/screenshots/layout-${tag}-${width}.png`});
  await p.getByRole('button',{name:'Tamam',exact:true}).click();
  await p.screenshot({path:`/workspace/screenshots/layout-${tag}-${width}-library.png`});
  if(width<700){await p.locator('.timeline-toggle').click();assert.equal(await p.locator('.timeline-toggle').getAttribute('aria-expanded'),'true');await p.locator('.timeline-toggle').click();}
  assert.deepEqual(errors,[]);console.log(JSON.stringify({tag,width,height,...bounds,errors}));await p.close();
 }
}finally{await browser.close();}
