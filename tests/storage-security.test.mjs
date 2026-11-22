import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { registerHooks } from 'node:module';
import { readFileSync } from 'node:fs';

// Exercise the real storage functions with isolated dummy users and in-memory SQL.
const sqlite=new DatabaseSync(':memory:');
sqlite.exec(readFileSync(new URL('../drizzle/0000_cool_ultimatum.sql',import.meta.url),'utf8'));
globalThis.__alfredSecurityDB={prepare(sql){return {bind(...args){return {
  async first(){return sqlite.prepare(sql).get(...args)??null;},
  async run(){return {meta:{changes:sqlite.prepare(sql).run(...args).changes}};},
};}};}};
registerHooks({resolve(specifier,context,nextResolve){
  if(specifier==='cloudflare:workers')return {url:'data:text/javascript,export const env = {DB:globalThis.__alfredSecurityDB}',shortCircuit:true};
  return nextResolve(specifier,context);
}});
const {createSession,loadSession,saveSession}=await import('../lib/storage.ts');

test('sessions cannot be read or overwritten by a different learner',async()=>{
  try {
    const alice=await createSession('dummy-alice');
    const bob=await createSession('dummy-bob');
    assert.equal(await loadSession('dummy-bob',alice.id),null);
    assert.equal((await loadSession('dummy-bob')).id,bob.id);
    await assert.rejects(saveSession('dummy-bob',alice,{...alice.state,phase:'complete'}),{status:409});
    assert.equal((await loadSession('dummy-alice',alice.id)).state.phase,'explain');
    await saveSession('dummy-alice',alice,{...alice.state,phase:'complete'});
    await assert.rejects(saveSession('dummy-alice',alice,alice.state),{status:409});
  } finally {sqlite.close();delete globalThis.__alfredSecurityDB;}
});
