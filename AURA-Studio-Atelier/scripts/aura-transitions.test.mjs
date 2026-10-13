import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeSceneTransition, parseSceneTransition, sceneTransitionDuration } from '../src/components/aura/scene-transitions.ts';
import { makeClip, emptyProject, splitClip, parseEditorProject, projectDuration } from '../src/components/aura/editor.ts';
const clips = () => [{...makeClip(2), id:'a'}, {...makeClip(6), in:2,out:6,id:'b',rate:2,transition:{id:'dissolve',duration:.8}}];
test('transitions run only on incoming boundaries and preserve the audio timeline',()=>{
 const c=clips();assert.equal(projectDuration({...emptyProject(),clips:c}),4);
 assert.equal(activeSceneTransition(c,1.99),null);
 assert.equal(activeSceneTransition(c,2).progress,0);
 assert.ok(Math.abs(activeSceneTransition(c,2.4).progress-.5)<1e-10);
 assert.equal(activeSceneTransition(c,2.81),null);
 c[0].transition={id:'flash',duration:1};assert.equal(activeSceneTransition(c,0),null);
});
test('short clips and playback rates limit the duration to half of each neighbour',()=>{
 const c=clips();c[0].out=.2;assert.equal(sceneTransitionDuration(...c),.1);
 c[0].out=2;c[1].rate=10;assert.equal(sceneTransitionDuration(...c),.2);
});
test('splitting an incoming clip retains its boundary once and archives restore it',()=>{
 const c=clips(), split=splitClip(c,3);
 assert.equal(split.length,3);assert.equal(split[1].transition.id,'dissolve');assert.equal(split[2].transition,undefined);
 const restored=parseEditorProject(JSON.stringify({...emptyProject(),clips:split}),6);
 assert.equal(restored.clips[1].transition.id,'dissolve');assert.equal(restored.clips[1].transition.duration,.8);
 assert.equal(restored.clips[2].transition.id,'none');
});
test('invalid imported effects and non-finite durations have safe defaults',()=>{
 assert.deepEqual(parseSceneTransition({id:'bad',duration:Infinity}),{id:'none',duration:.6});
 assert.equal(parseSceneTransition({id:'iris',duration:99}).duration,2);
 assert.equal(parseSceneTransition({id:'iris',duration:-1}).duration,.1);
});
