const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
// Install only for this integration suite, keeping the app dependency graph unchanged.
const { PGlite } = require('../.expo/history-db-test/node_modules/@electric-sql/pglite');
const migration = fs.readFileSync(path.join(__dirname, '../supabase/migrations/202610170001_record_listening_history.sql'), 'utf8');
const userA = '00000000-0000-4000-8000-000000000001';
const userB = '00000000-0000-4000-8000-000000000002';
const track = '00000000-0000-4000-8000-000000000003';
const journey = '00000000-0000-4000-8000-000000000004';

test('PostgreSQL migration and transactional listening history', async (suite) => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create table public.tracks (id uuid primary key, play_count bigint default 0);
      create table public.journeys (id uuid primary key, user_id uuid references auth.users(id));
      create table public.listening_history (
        id bigserial primary key, user_id uuid references auth.users(id),
        track_id uuid references public.tracks(id), journey_id uuid references public.journeys(id),
        listened_sec int, completed boolean, skipped boolean, played_at timestamptz default now()
      );
      insert into auth.users values ('${userA}'), ('${userB}');
      insert into public.tracks values ('${track}', 0);
      insert into public.journeys values ('${journey}', '${userA}');
    `);
    await db.exec(migration);
    await db.exec(migration); // Safe to rerun against an existing table.
    let nextId = 0;
    const call = async (options = {}) => {
      const values = [options.id || `playback-${++nextId}`, options.user || userA, options.track || track,
        options.seconds ?? 10, options.duration ?? 100, options.reason || 'changed',
        options.at || new Date().toISOString(), options.journey || null, options.mood || null, options.stage || null];
      const result = await db.query('select public.record_listening_history($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) as result', values);
      return result.rows[0].result;
    };
    const count = async () => Number((await db.query('select count(*) as n from public.listening_history')).rows[0].n);
    const playCount = async () => Number((await db.query('select play_count from public.tracks where id=$1',[track])).rows[0].play_count);
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userA]);

    await suite.test('ignores <5 seconds without incrementing play_count', async () => {
      const before = await count(); const plays = await playCount();
      assert.equal((await call({seconds:4})).recorded, false);
      assert.equal(await count(), before); assert.equal(await playCount(), plays);
    });

    await suite.test('records 5 seconds, stage/mood/journey and increments exactly once', async () => {
      const before = await count(); const plays = await playCount();
      assert.equal((await call({id:'unique-listen',seconds:5,journey,mood:'focus',stage:'deepfocus'})).recorded, true);
      assert.equal((await call({id:'unique-listen',seconds:5,journey,mood:'focus',stage:'deepfocus'})).reason, 'already_recorded');
      assert.equal(await count(), before+1); assert.equal(await playCount(),plays+1);
      const row=(await db.query("select * from public.listening_history where playback_id='unique-listen'")).rows[0];
      assert.equal(row.mood_id,'focus'); assert.equal(row.stage,'deepfocus'); assert.equal(row.skipped,true);
    });

    await suite.test('80% completion threshold and skip under 30s are calculated in the backend', async () => {
      await call({id:'threshold-79',seconds:79}); await call({id:'threshold-80',seconds:80});
      await call({id:'skip-029',seconds:29}); await call({id:'skip-030',seconds:30});
      await call({id:'short-ended',seconds:10,duration:10,reason:'ended'});
      const rows=Object.fromEntries((await db.query('select playback_id,completed,skipped from public.listening_history')).rows.map(r=>[r.playback_id,r]));
      assert.equal(rows['threshold-79'].completed,false); assert.equal(rows['threshold-80'].completed,true);
      assert.equal(rows['skip-029'].skipped,true); assert.equal(rows['skip-030'].skipped,false);
      assert.equal(rows['short-ended'].completed,true); assert.equal(rows['short-ended'].skipped,false);
    });

    await suite.test('concurrent retry of one event cannot double-count', async () => {
      const before=await count(); const plays=await playCount();
      await Promise.all(Array.from({length:8},()=>call({id:'retried-listen'})));
      assert.equal(await count(),before+1); assert.equal(await playCount(),plays+1);
    });

    await suite.test('different listening events each increment the shared counter', async () => {
      const before=await count(); const plays=await playCount();
      await Promise.all(Array.from({length:8},(_,i)=>call({id:`distinct-${i}`})));
      assert.equal(await count(),before+8); assert.equal(await playCount(),plays+8);
    });

    await suite.test('rejects forged user, unowned journey, invalid duration and missing track', async () => {
      const before=await count(); const plays=await playCount();
      await assert.rejects(call({user:userB}), /Authentication/);
      await db.query("select set_config('request.jwt.claim.sub', $1, false)",[userB]);
      await assert.rejects(call({user:userB,journey}), /Journey/);
      await db.query("select set_config('request.jwt.claim.sub', $1, false)",[userA]);
      await assert.rejects(call({duration:0}), /Invalid playback/);
      await assert.rejects(call({track:'00000000-0000-4000-8000-000000000099'}));
      assert.equal(await count(),before); assert.equal(await playCount(),plays);
    });

    await suite.test('failed counter update rolls back the history insert', async () => {
      const before=await count(); const plays=await playCount();
      await db.exec(`create function public.reject_counter() returns trigger language plpgsql as $$ begin raise exception 'Counter failure'; end; $$;
        create trigger test_counter_failure before update on public.tracks for each row execute function public.reject_counter();`);
      await assert.rejects(call({id:'rollback-event'}), /Counter failure/);
      assert.equal(await count(),before); assert.equal(await playCount(),plays);
      await db.exec('drop trigger test_counter_failure on public.tracks; drop function public.reject_counter();');
      assert.equal((await call({id:'rollback-event'})).recorded,true);
    });

    await suite.test('only authenticated role can execute; user identity is still enforced', async () => {
      await db.exec('set role anon;');
      await assert.rejects(call(), /permission denied/);
      await db.exec('reset role; set role authenticated;');
      assert.equal((await call({id:'authenticated-listen'})).recorded,true);
      await assert.rejects(call({user:userB}), /Authentication/);
      await db.exec('reset role;');
    });
  } finally {
    await db.close();
  }
});
