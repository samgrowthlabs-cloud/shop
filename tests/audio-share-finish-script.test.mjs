import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const recorder=read('assets/js/audio-recorder.js');
const prompter=read('assets/js/recorder-teleprompter.js');
const mixer=read('assets/js/audio-mixer.js');
const files=read('assets/js/admin-v2.js');
const worker=read('cloudflare-dashboard/worker.js');

test('recorder keeps the selected script with the recorded file',()=>{
  assert.match(prompter,/selectedScript = item/);
  assert.match(recorder,/recordedScript = recordingScript/);
  assert.match(recorder,/recording-to-share-finish/);
  assert.match(recorder,/finishScript,/);
});

test('mixer keeps a single recording script and offers the finish action',()=>{
  assert.match(mixer,/function mixScript\(\)/);
  assert.match(mixer,/id="msharefinish"/);
  assert.match(mixer,/finishScript:true/);
});

test('shared file upload finishes the linked script only with the explicit action',()=>{
  assert.match(files,/form\.append\('finishScript','1'\)/);
  assert.match(files,/form\.append\('scriptId',sharedTransfer\.script\.id\)/);
  assert.match(worker,/if\(finishScript\)/);
  assert.match(worker,/UPDATE admin_media_scripts SET status='used'/);
  assert.match(worker,/scriptFinished:Boolean\(scriptToFinish\)/);
});