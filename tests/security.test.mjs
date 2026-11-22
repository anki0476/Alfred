import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { readLimitedBody, readJson, readForm, assertSameOrigin } from '../lib/request-security.ts';
import { consumeBudget, enforceRequestBudget } from '../lib/request-budget.ts';

const origin = 'https://alfred.example';
const request = (body, headers={}) => new Request(origin+'/api/learning', {method:'POST', body, headers, duplex:'half'});
function database() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(readFileSync(new URL('../drizzle/0003_calm_mercury.sql', import.meta.url),'utf8'));
  const db = {prepare(sql) { return {bind(...args) { return {
    async first() { return sqlite.prepare(sql).get(...args) ?? null; },
    async run() { return sqlite.prepare(sql).run(...args); },
  }; }}; }};
  return {sqlite, db};
}
test('actual bytes are limited with missing or misleading Content-Length', async () => {
  for(const headers of [{}, {'content-length':'1'}]) {
    let cancelled=false;
    const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(9));},cancel(){cancelled=true;}});
    await assert.rejects(readLimitedBody(request(stream,headers),8),{status:413});
    assert.ok(cancelled);
  }
  assert.equal((await readLimitedBody(request('12345678'),8)).byteLength,8);
  await assert.rejects(readLimitedBody(request('ééé'),5),{status:413});
});
test('JSON rejects cross-site/simple forms and accepts same-origin JSON', async () => {
  await assert.rejects(readJson(request('{}',{'content-type':'text/plain'}),100),{status:415});
  await assert.rejects(readJson(request('{}',{'content-type':'application/json',origin:'https://attacker.example'}),100),{status:403});
  assert.throws(()=>assertSameOrigin(request('',{'sec-fetch-site':'cross-site'})),{status:403});
  assert.deepEqual(await readJson(request('{"ok":true}',{'content-type':'application/json',origin}),100),{ok:true});
  await assert.rejects(readJson(request('{invalid',{'content-type':'application/json'}),100),SyntaxError);
});
test('multipart is bounded before parsing and valid upload still parses', async () => {
  const form=new FormData();form.set('file',new File(['dummy notes'],'notes.txt',{type:'text/plain'}));
  await assert.rejects(readForm(request(form),10),{status:413});
  const parsed=await readForm(request(form),4096);
  assert.equal(await parsed.get('file').text(),'dummy notes');
});
test('atomic SQL quota permits exactly the budget and resets at the next window', async () => {
  const {sqlite,db}=database();
  try {
    const results=await Promise.all(Array.from({length:20},()=>consumeBudget(db,'dummy',3,60,1000)));
    assert.equal(results.filter(Boolean).length,3);
    assert.equal(await consumeBudget(db,'dummy',3,60,60000),true);
    assert.equal(await consumeBudget(db,'dummy',3,60,1000),false);
    assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM request_budgets').get().n,1);
  } finally {sqlite.close();}
});
test('IP limit survives rotated visitor cookies; budgets never store raw IP', async () => {
  const {sqlite,db}=database();
  try {
    const req=i=>new Request(origin+'/api/material-practice',{method:'POST',headers:{'cf-connecting-ip':'192.0.2.10',cookie:`alfred-visitor=${i}`}});
    for(let i=0;i<6;i++)assert.equal(await enforceRequestBudget(req(i),db),null);
    assert.equal((await enforceRequestBudget(req(7),db)).status,429);
    assert.equal(sqlite.prepare("SELECT used FROM request_budgets WHERE id='materials:hour'").get().used,6);
    assert.ok(!JSON.stringify(sqlite.prepare('SELECT * FROM request_budgets').all()).includes('192.0.2.10'));
  } finally {sqlite.close();}
});
test('security migrations preserve existing learner records', () => {
  const sqlite=new DatabaseSync(':memory:');
  try {
    for(const file of ['0000_cool_ultimatum.sql','0001_glossy_nebula.sql','0002_rich_onslaught.sql']) {
      sqlite.exec(readFileSync(new URL(`../drizzle/${file}`,import.meta.url),'utf8'));
    }
    sqlite.prepare('INSERT INTO adaptive_learners VALUES (?,?,?)').run('dummy-learner',3,'{"attempts":[]}');
    for(const file of ['0003_calm_mercury.sql','0004_noisy_timeslip.sql']) sqlite.exec(readFileSync(new URL(`../drizzle/${file}`,import.meta.url),'utf8'));
    assert.equal(sqlite.prepare('SELECT version FROM adaptive_learners WHERE user_id=?').get('dummy-learner').version,3);
  } finally {sqlite.close();}
});
test('aggregate cap still applies when visitor network identifiers rotate', async () => {
  const {sqlite,db}=database();
  try {
    const window=Math.floor(Date.now()/3600000);
    sqlite.prepare('INSERT INTO request_budgets VALUES (?,?,?,?)').run('materials:hour',window,100,(window+1)*3600);
    const denied=await enforceRequestBudget(new Request(origin+'/api/material-practice',{method:'POST',headers:{'cf-connecting-ip':'192.0.2.99'}}),db);
    assert.equal(denied.status,429);
    assert.equal(denied.headers.get('cache-control'),'no-store');
    assert.equal(denied.headers.get('retry-after'),'60');
  } finally {sqlite.close();}
});
test('quota storage failure fails closed instead of invoking paid services', async () => {
  assert.equal((await enforceRequestBudget(request('{}'))).status,503);
  const broken={prepare(){throw Error('dummy storage failure');}};
  assert.equal((await enforceRequestBudget(request('{}'),broken)).status,503);
});
test('every POST handler uses a bounded parser', () => {
  for(const name of ['alfred','learning','classroom','speech','material-practice']) {
    const source=readFileSync(new URL(`../app/api/${name}/route.ts`,import.meta.url),'utf8');
    assert.match(source,/readJson\(request,|readForm\(request,/);
    assert.doesNotMatch(source,/await request\.(json|text|formData)\(/);
  }
});
