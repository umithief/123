import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { useRuntimeAssetFetch } from './browser-runtime.mjs';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const p=await browser.newPage();await useRuntimeAssetFetch(p);await p.goto('http://127.0.0.1:8080/');await p.locator('.aura-studio[data-ready="true"]').waitFor();
 const result=await p.evaluate(async()=>{
  const {paintCaptions}=await import('/src/components/aura/caption-paint.ts');
  const {CAPTION_TEMPLATES}=await import('/src/components/aura/caption-templates.ts');
  const {DEFAULT_CAPTIONS,loadCaptionFont}=await import('/src/components/aura/captions.ts');
  const presets=CAPTION_TEMPLATES.filter(p=>p.category==='İmza');
  await Promise.all(presets.map(p=>loadCaptionFont(p.options.font,p.options.weight,p.options.italic)));
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.width=720;canvas.height=1280;
  const cue=[{id:'sample',start:0,end:3,text:'Müziğin ışığını hisset'}];
  const pixels=()=>ctx.getImageData(0,0,canvas.width,canvas.height).data;
  const hash=()=>{let h=2166136261;for(const n of pixels())h=Math.imul(h^n,16777619);return h>>>0;};
  const render=(preset,t,patch={},reduce=false,cues=cue)=>{
   ctx.clearRect(0,0,canvas.width,canvas.height);
   const o={...DEFAULT_CAPTIONS,...preset.options,place:'center',...patch};
   paintCaptions(ctx,canvas.width,canvas.height,0,cues,o,t,'#dfb76a',reduce);
   return hash();
  };
  const sheet=document.createElement('canvas');sheet.width=1080;sheet.height=1050;const sc=sheet.getContext('2d');
  const rows=presets.map((preset,i)=>{
   const mid=render(preset,1.2),early=render(preset,.06),later=render(preset,.27);
   const material=render(preset,1.2,{animation:'none'}),plain=render(preset,1.2,{animation:'none',textEffect:'none'});
   const move=render(preset,.06,{textEffect:'none'}),staticMotion=render(preset,.06,{textEffect:'none',animation:'none'});
   const reduced=render(preset,.06,{},true),reduceStatic=render(preset,.06,{animation:'none'},true);
   const zero=render(preset,0),empty=(()=>{ctx.clearRect(0,0,canvas.width,canvas.height);return hash();})();
   const tail=render(preset,3.01);
   const alpha=(()=>{render(preset,.00001);let a=0;for(let j=3,d=pixels();j<d.length;j+=4)a=Math.max(a,d[j]);return a;})();
   const bounds=[];
   for(const [w,h] of [[320,568],[720,1280],[1280,720]])for(const sampleTime of [.06,.25,1.25]){
    canvas.width=w;canvas.height=h;
    render(preset,sampleTime,{size:48},false,[{id:'long',start:0,end:4,text:'Çığlık, özgürlük, şarkılar ve içimizdeki bütün güzel duyguların ışığı'}]);
    let minX=w,maxX=-1,minY=h,maxY=-1;const d=pixels();
    for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>24){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
    bounds.push({w,h,sampleTime,minX,maxX,minY,maxY,safe:minX>0&&maxX<w-1&&minY>0&&maxY<h-1});
   }
   canvas.width=540;canvas.height=160;
   const tileX=i%2*540,tileY=Math.floor(i/2)*210;
   sc.fillStyle='#13151a';sc.fillRect(tileX,tileY,540,210);
   ctx.fillStyle='#13151a';ctx.fillRect(0,0,540,160);
   paintCaptions(ctx,540,160,0,cue,{...DEFAULT_CAPTIONS,...preset.options,place:'center'},.75,'#dfb76a',false,1.4);
   sc.drawImage(canvas,tileX,tileY+40);sc.fillStyle='#b8bdc8';sc.font='500 16px Outfit';sc.fillText(`${String(i+1).padStart(2,'0')}  ${preset.name}`,tileX+24,tileY+30);
   canvas.width=720;canvas.height=1280;
   return {id:preset.id,mid,animated:early!==later,independentMotion:move!==staticMotion,independentFinish:material!==plain,reduced:reduced===reduceStatic,noResidual:zero===empty&&tail===empty,lowAlpha:alpha<3,bounds};
  });
  ctx.globalAlpha=.37;ctx.translate(3,7);ctx.lineWidth=5;ctx.setLineDash([2,3]);
  const before={alpha:ctx.globalAlpha,matrix:Array.from(ctx.getTransform().toFloat32Array()),lineWidth:ctx.lineWidth,dash:ctx.getLineDash()};
  for(const preset of presets)paintCaptions(ctx,720,1280,0,cue,{...DEFAULT_CAPTIONS,...preset.options},1.2,'#dfb76a');
  const after={alpha:ctx.globalAlpha,matrix:Array.from(ctx.getTransform().toFloat32Array()),lineWidth:ctx.lineWidth,dash:ctx.getLineDash()};
  return {rows,before,after,sheet:sheet.toDataURL()};
 });
 writeFileSync('/workspace/screenshots/aura-signature-135-collection.png',Buffer.from(result.sheet.split(',')[1],'base64'));delete result.sheet;
 writeFileSync('/workspace/screenshots/aura-signature-135-paint.json',JSON.stringify(result,null,2));
 for(const row of result.rows){for(const k of ['animated','independentMotion','independentFinish','reduced','noResidual','lowAlpha'])assert.ok(row[k],`${row.id}/${k}`);for(const bound of row.bounds)assert.ok(bound.safe,`${row.id}/safe ${JSON.stringify(bound)}`);}
 assert.equal(new Set(result.rows.map(r=>r.mid)).size,10);assert.deepEqual(result.after,result.before);console.log(JSON.stringify(result));
}finally{await browser.close();}
