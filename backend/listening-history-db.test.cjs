const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {PGlite}=require('../supabase/node_modules/@electric-sql/pglite');
test('backend adapter uses app_users, preserves transaction and blocks browser execution',async()=>{
  const db=new PGlite();
  const user='00000000-0000-4000-8000-000000000001',track='00000000-0000-4000-8000-000000000002';
  try {
    await db.exec(`create role anon;create role authenticated;create role service_role;
      create schema auth;
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
      create table public.app_users(id uuid primary key);
      create table public.tracks(id uuid primary key,play_count int default 0);
      create table public.journeys(id uuid primary key,user_id uuid references public.app_users);
      create table public.listening_history(id bigserial primary key,user_id uuid references public.app_users,
        track_id uuid references public.tracks,journey_id uuid references public.journeys,
        listened_sec int,completed boolean,skipped boolean,played_at timestamptz,playback_id text);
      insert into public.app_users values('${user}');insert into public.tracks values('${track}',0);`);
    const sql=fs.readFileSync(path.join(__dirname,'sql/listening-history-backend.sql'),'utf8');
    await db.exec(sql);await db.exec(sql);
    const call=async(id,t=track)=>(await db.query(`select public.record_backend_listening_history($1,$2,$3,8,10,'ended',now()) as result`,[id,user,t])).rows[0].result;
    assert.equal((await call('playback-001')).recorded,true);
    assert.equal((await call('playback-001')).reason,'already_recorded');
    assert.equal((await db.query('select play_count from public.tracks')).rows[0].play_count,1);
    assert.equal((await db.query('select user_id from public.listening_history')).rows[0].user_id,user);
    await assert.rejects(call('playback-002','00000000-0000-4000-8000-000000000099'));
    assert.equal((await db.query('select count(*)::int as n from public.listening_history')).rows[0].n,1);
    await db.exec('set role authenticated');
    await assert.rejects(call('playback-003'),/permission denied/);
    await db.exec('reset role;set role service_role');
    assert.equal((await call('playback-004')).recorded,true);
  }finally{await db.close();}
});
