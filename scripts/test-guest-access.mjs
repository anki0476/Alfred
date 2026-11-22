import assert from 'node:assert/strict';
const origin=process.argv[2]||'http://127.0.0.1:5174';
if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(origin))throw new Error('Local preview only.');
async function visitor(cookie='') {const response=await fetch(origin+'/api/alfred',{headers:cookie?{Cookie:cookie}:{}});const body=await response.json();assert.equal(response.status,200,body.error);assert.equal(body.canPractice,true);return {body,cookie:response.headers.getSetCookie().map(v=>v.split(';')[0]).join('; '),headers:response.headers.getSetCookie()};}
const a=await visitor(),b=await visitor();assert.ok(a.cookie&&b.cookie);assert.notEqual(a.cookie,b.cookie);assert.ok(a.headers[0].includes('HttpOnly'));assert.ok(/SameSite=lax/i.test(a.headers[0]));
const started=await fetch(origin+'/api/alfred',{method:'POST',headers:{Cookie:a.cookie,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({operation:'start'})});const result=await started.json();assert.equal(started.status,200,result.error);assert.ok(result.session.id);
assert.equal((await visitor(a.cookie)).body.session.id,result.session.id);
assert.equal((await visitor(b.cookie)).body.session,null);
const other=await fetch(origin+'/api/alfred',{method:'POST',headers:{Cookie:b.cookie,Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({operation:'discard',sessionId:result.session.id,version:result.session.version})});assert.equal(other.status,404);
const malformed=await visitor('alfred-visitor=shared');assert.ok(malformed.cookie);assert.equal(malformed.body.session,null);
const voice=await fetch(origin+'/api/speech',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({text:''})});assert.equal(voice.status,400);
console.log('Guest creation, private cookies, session persistence, visitor isolation, invalid-cookie renewal and voice access checks passed.');
