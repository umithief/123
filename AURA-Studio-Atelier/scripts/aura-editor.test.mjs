import assert from 'node:assert/strict';
import test from 'node:test';
import {audioForRecognition,normalizeTranscript,ownedTranscript,mergeTranscript,transcriptionWindows} from '../src/components/aura/transcription.ts';
import {emptyProject,makeClip,splitClip,projectDuration,locateTime,timelineTime,clipGain,parseEditorProject,frameAt} from '../src/components/aura/editor.ts';
import {lyricsToCues} from '../src/components/aura/captions.ts';
import {packProject,unpackProject,crc32} from '../src/components/aura/project-archive.ts';
test('ASR preserves words without timestamps and keeps boundary words once',()=>{
 const words=normalizeTranscript([{text:'Bir',timestamp:[0,1]},{text:'eksik',timestamp:[null,null]},{text:'cümle',timestamp:[3,4]}],4);
 assert.equal(words.length,3);assert.ok(words[1].timestamp[0]>=1&&words[1].timestamp[1]<=3);
 const windows=transcriptionWindows(40);
 const boundary={text:'sınır',timestamp:[19.8,20.6]};
 assert.equal(ownedTranscript([boundary],windows[0]).length,0);
 assert.equal(ownedTranscript([{...boundary,timestamp:[3.8,4.6]}],windows[1]).length,1);
});
test('same-time duplicate removal retains sung repetitions',()=>{
 assert.equal(mergeTranscript([{text:'gel',timestamp:[1,2]},{text:'gel',timestamp:[1.1,2]},{text:'gel',timestamp:[3,4]}]).length,2);
});
test('stereo cancellation and quiet input do not erase recognizable audio',()=>{
 const a=Float32Array.from([.1,-.2,.1,-.2]);const output=audioForRecognition([a,Float32Array.from(a,v=>-v)]);
 assert.ok(output.some(v=>Math.abs(v)>.5));assert.throws(()=>audioForRecognition([new Float32Array(4)]));
});
test('cuts, rate and reordered playback map source and output times',()=>{
 const clips=splitClip([makeClip(10)],4);assert.equal(clips.length,2);clips[1].rate=2;
 assert.equal(projectDuration({...emptyProject(),clips}),7);
 assert.equal(locateTime(clips,5).source,6);assert.equal(timelineTime(clips,1,6),5);
 assert.equal(splitClip(clips,0),clips);clips[0].fadeIn=2;assert.equal(clipGain(clips[0],1),.5);
});
test('supplied lyrics retain exact words, repeated lines and skipped text',()=>{
 const raw='Bir güzel gün\nHiç atlama bu cümleyi\nBir güzel gün';
 const cues=lyricsToCues(raw,[{id:'a',text:'Bir güzel gün',start:1,end:3},{id:'b',text:'Bir güzel gün',start:7,end:9}],10);
 assert.deepEqual(cues.map(c=>c.text),raw.split('\n'));assert.equal(cues.length,3);assert.ok(cues[1].end>cues[1].start);
});
test('keyframes interpolate and imported projects clamp unsafe values',()=>{
 const p=emptyProject();p.clips=[makeClip(10)];p.adjust.zoom=99;
 const parsed=parseEditorProject(JSON.stringify(p),10);assert.equal(parsed.adjust.zoom,3);
 const frame=frameAt({x:.5,y:.5,scale:1,rotation:0,opacity:1,keyframes:[{time:0,x:0,y:0,scale:1,rotation:0,opacity:1},{time:2,x:1,y:1,scale:2,rotation:90,opacity:0}]},1);
 assert.equal(frame.x,.5);assert.equal(frame.rotation,45);
});
test('media-inclusive ZIP round trips and detects corrupt data',async()=>{
 const archive=await packProject([{name:'project.json',blob:new Blob(['{"version":1}'])},{name:'source',blob:new Blob(['test audio'])}]);
 const entries=await unpackProject(archive);assert.equal(await entries.get('source').text(),'test audio');assert.equal(crc32(new TextEncoder().encode('123456789')),0xcbf43926);
 const bad=new Uint8Array(await archive.arrayBuffer());bad[42]^=1;await assert.rejects(unpackProject(new Blob([bad])),/hasarlı/);
});
test('premium settings survive archives and old projects acquire safe defaults',()=>{
 const raw={...emptyProject(),clips:[makeClip(4)],layers:[{kind:'text',text:'Çığlık',font:'caveat',weight:700,textEffect:'gold',animation:'elastic',start:0,end:4}],adjust:{effect:'prism',effectAmount:5}};
 const restored=parseEditorProject(JSON.stringify(raw),4);assert.equal(restored.layers[0].font,'caveat');assert.equal(restored.layers[0].textEffect,'gold');assert.equal(restored.layers[0].animation,'elastic');assert.equal(restored.adjust.effect,'prism');assert.equal(restored.adjust.effectAmount,1);
 delete raw.layers[0].font;delete raw.layers[0].textEffect;raw.layers[0].animation='bad';raw.adjust={};
 const old=parseEditorProject(JSON.stringify(raw),4);assert.equal(old.layers[0].font,'sans');assert.equal(old.layers[0].weight,700);assert.equal(old.layers[0].textEffect,'none');assert.equal(old.layers[0].animation,'none');assert.equal(old.adjust.effect,'none');
});
