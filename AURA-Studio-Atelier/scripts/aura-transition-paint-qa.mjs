import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{const p=await browser.newPage();await p.goto('http://127.0.0.1:8080/');
const result=await p.evaluate(async()=>{const {SCENE_TRANSITIONS,paintSceneTransition}=await import('/src/components/aura/scene-transitions.ts');
 const old=document.createElement('canvas'),next=document.createElement('canvas'),out=document.createElement('canvas');for(const c of [old,next,out]){c.width=100;c.height=60;}
 for(const [c,col]of[[old,'#ff0000'],[next,'#0000ff']]){const x=c.getContext('2d');x.fillStyle=col;x.fillRect(0,0,100,60);}
 const ctx=out.getContext('2d');return SCENE_TRANSITIONS.map(t=>{const samples=[0,.35,.5,1].map(v=>{ctx.clearRect(0,0,100,60);paintSceneTransition(ctx,old,next,t.id,v,100,60);return [...ctx.getImageData(50,30,1,1).data];});return {id:t.id,samples};});});
for(const r of result){assert.deepEqual(r.samples.at(-1),[0,0,255,255],r.id);if(r.id!=='none')assert.deepEqual(r.samples[0],[255,0,0,255],r.id);for(const s of r.samples)assert.equal(s[3],255,r.id);}
assert.notDeepEqual(result.find(r=>r.id==='flash').samples,result.find(r=>r.id==='fade-white').samples);
console.log(JSON.stringify({effects:result.length-1,endpoints:true,opaque:true,flashDistinct:true}));
}finally{await browser.close();}
