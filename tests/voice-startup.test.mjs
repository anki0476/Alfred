import test from 'node:test';
import assert from 'node:assert/strict';
import { recordVoice } from '../lib/voice.ts';

test('first press resumes audio before waiting for permission; subsequent captures also clean up', async (t) => {
  const events = [];
  let permit;
  let stopped = 0;
  const track = { stop() { stopped++; }, addEventListener() {} };
  const stream = { getTracks: () => [track], getAudioTracks: () => [track] };
  const node = () => ({ connect() {}, disconnect() {} });
  class Context {
    sampleRate = 16000;
    audioWorklet = { addModule: async () => {} };
    resume() { events.push('resume'); return Promise.resolve(); }
    createMediaStreamSource() { return node(); }
    createGain() { return { ...node(), gain: { value: 0 } }; }
    createAnalyser() { return { ...node(), fftSize: 256, getFloatTimeDomainData() {} }; }
    async close() { events.push('close'); }
  }
  class Worklet {
    port = { onmessage: null, postMessage: () => this.port.onmessage?.({ data: 'flushed' }) };
    connect() {}
    disconnect() {}
  }
  const original = Object.getOwnPropertyDescriptors(globalThis);
  t.after(() => { for (const key of ['AudioContext', 'AudioWorkletNode', 'navigator']) {
    if (original[key]) Object.defineProperty(globalThis, key, original[key]); else delete globalThis[key];
  } });
  const replace = (key, value) => Object.defineProperty(globalThis, key, {value, configurable:true});
  replace('AudioContext', Context);
  replace('AudioWorkletNode', Worklet);
  replace('navigator', { mediaDevices: { getUserMedia() {
    events.push('permission'); return new Promise(resolve => { permit = () => resolve(stream); });
  } } });
  for (let attempt = 0; attempt < 2; attempt++) {
    const pending = recordVoice(() => {});
    assert.deepEqual(events.slice(-2), ['resume', 'permission']);
    permit();
    const stop = await pending;
    await stop(); await stop();
    assert.equal(stopped, attempt + 1);
  }
});
