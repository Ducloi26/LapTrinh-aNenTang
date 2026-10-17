const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadModule } = require('./test-support.cjs');

function fixture(session = null) {
  let current=session;let failure=null;let signups=0;
  const guest={user:{id:'guest-id',is_anonymous:true}};
  const module=loadModule('services/guest-session.ts',{'../lib/supabase':{supabase:{auth:{
    async getSession(){return {data:{session:current},error:null};},
    async signInAnonymously(){signups++;if(failure)return {data:{session:null},error:failure};current=guest;return {data:{session:guest},error:null};},
  }}}});
  return {...module,get signups(){return signups;},setFailure(error){failure=error;}};
}

test('explicit guest action creates a session without email or password',async()=>{
  const f=fixture();const session=await f.ensureGuestSession();assert.equal(session.user.is_anonymous,true);assert.equal(f.signups,1);
});
test('existing real account is preserved, not replaced by a guest',async()=>{
  const account={user:{id:'real-id',is_anonymous:false}};const f=fixture(account);
  assert.equal(await f.ensureGuestSession(),account);assert.equal(f.signups,0);
});
test('double taps share one request, and persisted guest is reused',async()=>{
  const f=fixture();const [a,b]=await Promise.all([f.ensureGuestSession(),f.ensureGuestSession()]);
  assert.equal(a,b);assert.equal(f.signups,1);await f.ensureGuestSession();assert.equal(f.signups,1);
});
test('disabled anonymous sign-in is clear and can be retried after enabling',async()=>{
  const f=fixture();f.setFailure({code:'anonymous_provider_disabled'});
  await assert.rejects(f.ensureGuestSession());assert.match(f.guestSessionErrorMessage({code:'anonymous_provider_disabled'}),/chưa được bật/);
  f.setFailure(null);assert.equal((await f.ensureGuestSession()).user.id,'guest-id');
});
