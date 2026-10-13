import assert from "node:assert/strict";
import { chromium } from "playwright";
import { useRuntimeAssetFetch } from "./browser-runtime.mjs";
const browser = await chromium.launch({ executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] });
try {
  const p = await browser.newPage({ viewport: { width: 1120, height: 760 } });
  await useRuntimeAssetFetch(p);
  await p.goto("http://127.0.0.1:8080");
  await p.locator('.aura-studio[data-ready="true"]').waitFor();
  const result = await p.evaluate(async () => {
    const { VIDEO_MOTIONS, motionDefaults } = await import("/src/components/aura/video-motion.ts");
    const { emptyProject, makeClip } = await import("/src/components/aura/editor.ts");
    const { paintEditorBase, paintEditorLayers } = await import("/src/components/aura/editor-paint.ts");
    const gallery = document.createElement("canvas"); gallery.width = 1120; gallery.height = 720;
    const sheet = gallery.getContext("2d"); sheet.fillStyle = "#08090b"; sheet.fillRect(0,0,1120,720);
    function base(w,h) {
      const c = document.createElement("canvas"); c.width=w; c.height=h; const x=c.getContext("2d");
      x.fillStyle="#18324c"; x.fillRect(0,0,w,h);
      for(let row=0;row<6;row++) for(let col=0;col<8;col++) if((row+col)%2) { x.fillStyle="#25445d"; x.fillRect(col*w/8,row*h/6,w/8,h/6); }
      x.fillStyle="#efb76c"; x.fillRect(w*.05,h*.1,w*.22,h*.15);
      x.fillStyle="#f4f5f6"; x.beginPath(); x.arc(w*.5,h*.45,Math.min(w,h)*.17,0,Math.PI*2); x.fill();
      return c;
    }
    const issues=[]; let checked=0;
    for(const [w,h] of [[320,180],[180,320],[240,240],[240,300]]) {
      const source=base(w,h), output=document.createElement("canvas"); output.width=w; output.height=h;
      const ctx=output.getContext("2d",{willReadFrequently:true});
      const project=emptyProject(); project.clips=[makeClip(3)];
      project.layers=[{id:"text",kind:"text",text:"SABİT YAZI",color:"#00ff00",start:0,end:3,x:.5,y:.83,scale:1,rotation:0,opacity:1,keyframes:[],animation:"none",font:"sans",weight:600,textEffect:"none",background:false,blend:"source-over"}];
      paintEditorBase(ctx,source,project,new Map(),.2,w,h); paintEditorLayers(ctx,project,new Map(),.2,w,h);
      const original=ctx.getImageData(0,0,w,h).data;
      // Fully opaque glyph pixels are independent of the animated backdrop.
      // Antialiased edges blend with that backdrop, so threshold counts vary.
      const glyph=[];
      for(let i=0;i<original.length;i+=4) if(original[i]===0&&original[i+1]===255&&original[i+2]===0) glyph.push(i);
      if(glyph.length<50) throw Error("Text fixture not drawn");
      for(const [index, preset] of VIDEO_MOTIONS.entries()) for(const section of ["in","out","combo"]) {
        const motion=motionDefaults(); motion[section]={id:preset.id,duration:1}; project.clips[0].motion=motion;
        const time=section==="out"?2.8:section==="combo"?.35:.2;
        paintEditorBase(ctx,source,project,new Map(),time,w,h); paintEditorLayers(ctx,project,new Map(),time,w,h);
        const actual=ctx.getImageData(0,0,w,h).data;
        if(glyph.some(i=>actual[i]!==0||actual[i+1]!==255||actual[i+2]!==0)) issues.push(`${preset.id}/${section}/${w}: fixed text moved or changed color`);
        let changed=0; for(let i=0;i<actual.length;i+=4) if(Math.abs(actual[i]-original[i])+Math.abs(actual[i+1]-original[i+1])+Math.abs(actual[i+2]-original[i+2])>8) changed++;
        if(preset.id!=="none"&&changed<20) issues.push(`${preset.id}/${section}/${w}: motion not visible`);
        if(preset.id==="none"&&changed>0) issues.push(`none/${section}/${w}: frame changed`);
        if(w===320&&h===180&&section==="in") {
          const col=index%7,row=Math.floor(index/7); sheet.drawImage(output,col*160,row*144,160,104);
          sheet.fillStyle="#edf3f7"; sheet.font="13px Arial"; sheet.textAlign="center"; sheet.fillText(preset.label,col*160+80,row*144+126);
        }
        checked++;
      }
      project.clips[0].motion={...motionDefaults(),in:{id:"impact",duration:1}};
      paintEditorBase(ctx,source,project,new Map(),.2,w,h,true); paintEditorLayers(ctx,project,new Map(),.2,w,h,true);
      const reduced=ctx.getImageData(0,0,w,h).data;
      for(let i=0;i<reduced.length;i++) if(reduced[i]!==original[i]) { issues.push(`Reduced motion changed ${w} frame`); break; }
    }
    document.body.replaceChildren(gallery);
    return { presets: VIDEO_MOTIONS.length-1, combinations: checked, issues };
  });
  await p.screenshot({path:"/workspace/screenshots/aura-motion-contact-sheet.png"});
  console.log(JSON.stringify(result));
  assert.deepEqual(result.issues,[]);
} finally { await browser.close(); }
