-- =========================================================
-- 1. TABLES & INDEXES (Section 5)
-- =========================================================
create table public.match_sessions (
  id                 uuid primary key,
  umpire_id          uuid not null default auth.uid() references public.profiles(id) on delete restrict,
  format             text not null default 'doubles' check (format in ('singles','doubles')),
  target_score       smallint not null default 11 check (target_score between 1 and 99),
  win_by             smallint not null default 2  check (win_by between 1 and 10),
  status             text not null default 'in_progress' check (status in ('in_progress','completed','abandoned')),

  team_keys          jsonb not null default '["omega","alpha"]'::jsonb,
  team_names         jsonb not null default '["Team Omega","Team Alpha"]'::jsonb,
  team_palettes      jsonb not null default '["omega","alpha"]'::jsonb,
  player_names       jsonb not null default '{"team0":["Player 1","Player 2"],"team1":["Player 3","Player 4"]}'::jsonb,
  initial_state      jsonb not null,

  -- head-state cache
  score_team0        smallint not null default 0 check (score_team0 between 0 and 99),
  score_team1        smallint not null default 0 check (score_team1 between 0 and 99),
  serving_team       smallint not null default 0 check (serving_team in (0,1)),
  server_number      smallint not null default 2 check (server_number in (1,2)),
  server_court       text not null default 'right' check (server_court in ('right','left')),
  court_positions    jsonb not null,
  winner_team        smallint check (winner_team in (0,1)),

  -- concurrency
  head_sequence      integer not null default 0,
  version            integer not null default 0,

  -- timer
  timer_status       text not null default 'idle' check (timer_status in ('idle','running','paused','expired')),
  timer_duration_ms  integer not null default 1800000 check (timer_duration_ms > 0),
  timer_remaining_ms integer not null default 1800000 check (timer_remaining_ms >= 0),
  timer_ends_at      timestamptz,
  timer_updated_at   timestamptz not null default now(),

  legacy_log         jsonb,
  completed_at       timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_match_sessions_umpire_status on public.match_sessions (umpire_id, status, updated_at desc);

create table public.match_events (
  id                uuid primary key,
  session_id        uuid not null references public.match_sessions(id) on delete cascade,
  sequence          integer not null check (sequence > 0),
  status            text not null default 'active' check (status in ('active','undone','discarded')),
  event_type        text not null check (event_type in ('point','secondServer','sideOut','gameWon')),
  elapsed_seconds   integer not null default 0 check (elapsed_seconds >= 0),
  state_after       jsonb not null check (
                      jsonb_typeof(state_after->'scores') = 'array'
                      and (state_after->'scores'->>0)::int between 0 and 99
                      and (state_after->'scores'->>1)::int between 0 and 99
                      and (state_after->>'servingTeam')::int in (0,1)
                      and (state_after->>'serverNumber')::int in (1,2)
                      and state_after->>'serverCourt' in ('right','left')
                    ),
  call_string       text not null,
  message           text not null,
  created_by        uuid not null default auth.uid(),
  created_at        timestamptz not null default now(),
  status_changed_at timestamptz not null default now(),
  unique (session_id, sequence)
);

create index idx_match_events_session_status_seq on public.match_events (session_id, status, sequence);

-- =========================================================
-- 2. ATOMIC RPCs (Section 6 + Team Metadata Update)
-- =========================================================
create or replace function public._apply_head_state(p_session_id uuid, p_state jsonb)
returns public.match_sessions
language sql
set search_path = public
as $$
  update public.match_sessions set
    score_team0     = (p_state->'scores'->>0)::smallint,
    score_team1     = (p_state->'scores'->>1)::smallint,
    serving_team    = (p_state->>'servingTeam')::smallint,
    server_number   = (p_state->>'serverNumber')::smallint,
    server_court    = p_state->>'serverCourt',
    court_positions = p_state->'courtPositions',
    winner_team     = case when coalesce((p_state->>'gameOver')::boolean, false)
                           then (p_state->>'winner')::smallint end,
    version         = version + 1,
    updated_at      = now()
  where id = p_session_id
  returning *;
$$;

create or replace function public._lock_session(p_session_id uuid, p_expected_version int)
returns public.match_sessions
language plpgsql
set search_path = public
as $$
declare s public.match_sessions;
begin
  select * into s from public.match_sessions where id = p_session_id for update;
  if not found or s.umpire_id <> auth.uid() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if s.status <> 'in_progress' then
    raise exception 'session_closed' using errcode = 'P0001';
  end if;
  if p_expected_version is not null and s.version <> p_expected_version then
    raise exception 'version_conflict' using errcode = '40001';
  end if;
  return s;
end $$;

create or replace function public.fn_create_session(
  p_session_id uuid,
  p_format text,
  p_team_keys jsonb,
  p_team_names jsonb,
  p_team_palettes jsonb,
  p_player_names jsonb,
  p_initial_state jsonb,
  p_timer_duration_ms int default 1800000,
  p_legacy_log jsonb default null
) returns public.match_sessions
language plpgsql security definer
set search_path = public
as $$
declare s public.match_sessions;
begin
  if auth.uid() is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  insert into public.match_sessions (
    id, umpire_id, format, team_keys, team_names, team_palettes, player_names,
    initial_state, court_positions, timer_duration_ms, timer_remaining_ms, legacy_log
  ) values (
    p_session_id, auth.uid(), p_format, p_team_keys, p_team_names, p_team_palettes, p_player_names,
    p_initial_state, p_initial_state->'courtPositions', p_timer_duration_ms, p_timer_duration_ms, p_legacy_log
  )
  on conflict (id) do nothing;

  select * into s from public.match_sessions where id = p_session_id;
  if s.umpire_id <> auth.uid() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if s.version = 0 then
    s := public._apply_head_state(p_session_id, p_initial_state);
  end if;
  return s;
end $$;

create or replace function public.fn_record_rally(
  p_session_id uuid,
  p_event_id uuid,
  p_expected_version int,
  p_event_type text,
  p_elapsed_seconds int,
  p_state_after jsonb,
  p_call_string text,
  p_message text
) returns public.match_sessions
language plpgsql security definer
set search_path = public
as $$
declare s public.match_sessions;
begin
  s := public._lock_session(p_session_id, null);

  if exists (select 1 from public.match_events where id = p_event_id) then
    return s;
  end if;

  if s.version <> p_expected_version then
    raise exception 'version_conflict' using errcode = '40001';
  end if;

  update public.match_events
     set status = 'discarded', status_changed_at = now()
   where session_id = p_session_id and status = 'undone';

  insert into public.match_events (
    id, session_id, sequence, event_type, elapsed_seconds, state_after, call_string, message
  ) values (
    p_event_id, p_session_id, s.head_sequence + 1, p_event_type,
    greatest(0, p_elapsed_seconds), p_state_after, p_call_string, p_message
  );

  update public.match_sessions set head_sequence = head_sequence + 1 where id = p_session_id;
  return public._apply_head_state(p_session_id, p_state_after);
end $$;

create or replace function public.fn_undo_rally(p_session_id uuid, p_expected_version int)
returns public.match_sessions
language plpgsql security definer
set search_path = public
as $$
declare
  s public.match_sessions;
  v_target_id uuid;
  v_head jsonb;
begin
  s := public._lock_session(p_session_id, p_expected_version);

  select id into v_target_id from public.match_events
   where session_id = p_session_id and status = 'active'
   order by sequence desc limit 1;

  if v_target_id is null then
    raise exception 'nothing_to_undo' using errcode = 'P0002';
  end if;

  update public.match_events
     set status = 'undone', status_changed_at = now()
   where id = v_target_id;

  select state_after into v_head from public.match_events
   where session_id = p_session_id and status = 'active'
   order by sequence desc limit 1;

  return public._apply_head_state(p_session_id, coalesce(v_head, s.initial_state));
end $$;

create or replace function public.fn_redo_rally(p_session_id uuid, p_expected_version int)
returns public.match_sessions
language plpgsql security definer
set search_path = public
as $$
declare
  s public.match_sessions;
  v_target_id uuid;
  v_head jsonb;
begin
  s := public._lock_session(p_session_id, p_expected_version);

  select id, state_after into v_target_id, v_head from public.match_events
   where session_id = p_session_id and status = 'undone'
   order by sequence asc limit 1;

  if v_target_id is null then
    raise exception 'nothing_to_redo' using errcode = 'P0002';
  end if;

  update public.match_events
     set status = 'active', status_changed_at = now()
   where id = v_target_id;

  return public._apply_head_state(p_session_id, v_head);
end $$;

create or replace function public.fn_set_timer(
  p_session_id uuid,
  p_status text,
  p_remaining_ms int,
  p_ends_at timestamptz,
  p_client_ts timestamptz
) returns public.match_sessions
language plpgsql security definer
set search_path = public
as $$
declare s public.match_sessions;
begin
  s := public._lock_session(p_session_id, null);
  if p_client_ts <= s.timer_updated_at then
    return s;
  end if;

  update public.match_sessions set
    timer_status       = p_status,
    timer_remaining_ms = greatest(0, p_remaining_ms),
    timer_ends_at      = p_ends_at,
    timer_updated_at   = p_client_ts,
    updated_at         = now()
  where id = p_session_id
  returning * into s;
  return s;
end $$;

create or replace function public.fn_update_session_meta(
  p_session_id uuid,
  p_team_names jsonb default null,
  p_team_palettes jsonb default null,
  p_team_keys jsonb default null
) returns public.match_sessions
language plpgsql security definer
set search_path = public
as $$
declare s public.match_sessions;
begin
  s := public._lock_session(p_session_id, null);

  update public.match_sessions set
    team_names    = coalesce(p_team_names, team_names),
    team_palettes = coalesce(p_team_palettes, team_palettes),
    team_keys     = coalesce(p_team_keys, team_keys),
    updated_at    = now()
  where id = p_session_id
  returning * into s;
  return s;
end $$;

create or replace function public.fn_close_session(p_session_id uuid, p_status text)
returns public.match_sessions
language plpgsql security definer
set search_path = public
as $$
declare s public.match_sessions;
begin
  if p_status not in ('completed','abandoned') then
    raise exception 'invalid_status' using errcode = '22023';
  end if;
  s := public._lock_session(p_session_id, null);

  update public.match_sessions set
    status       = case when s.winner_team is not null then 'completed' else p_status end,
    completed_at = now(),
    timer_status = case when timer_status = 'running' then 'paused' else timer_status end,
    updated_at   = now()
  where id = p_session_id
  returning * into s;
  return s;
end $$;

-- =========================================================
-- 3. PERMISSIONS & RLS (Sections 6.8 & 7.7)
-- =========================================================
revoke all on function public._apply_head_state(uuid, jsonb) from public, anon, authenticated;
revoke all on function public._lock_session(uuid, int)       from public, anon, authenticated;

revoke all on function public.fn_create_session(uuid, text, jsonb, jsonb, jsonb, jsonb, jsonb, int, jsonb) from public, anon;
revoke all on function public.fn_record_rally(uuid, uuid, int, text, int, jsonb, text, text)            from public, anon;
revoke all on function public.fn_undo_rally(uuid, int)                                                  from public, anon;
revoke all on function public.fn_redo_rally(uuid, int)                                                  from public, anon;
revoke all on function public.fn_set_timer(uuid, text, int, timestamptz, timestamptz)                   from public, anon;
revoke all on function public.fn_update_session_meta(uuid, jsonb, jsonb, jsonb)                         from public, anon;
revoke all on function public.fn_close_session(uuid, text)                                              from public, anon;

grant execute on function public.fn_create_session(uuid, text, jsonb, jsonb, jsonb, jsonb, jsonb, int, jsonb) to authenticated;
grant execute on function public.fn_record_rally(uuid, uuid, int, text, int, jsonb, text, text)            to authenticated;
grant execute on function public.fn_undo_rally(uuid, int)                                                  to authenticated;
grant execute on function public.fn_redo_rally(uuid, int)                                                  to authenticated;
grant execute on function public.fn_set_timer(uuid, text, int, timestamptz, timestamptz)                   to authenticated;
grant execute on function public.fn_update_session_meta(uuid, jsonb, jsonb, jsonb)                         to authenticated;
grant execute on function public.fn_close_session(uuid, text)                                              to authenticated;

alter table public.match_sessions enable row level security;
alter table public.match_events   enable row level security;

create policy "umpire_select_own_sessions" on public.match_sessions
  for select to authenticated
  using (umpire_id = auth.uid());

create policy "spectator_select_public_sessions" on public.match_sessions
  for select to anon, authenticated
  using (status in ('in_progress','completed'));

create policy "select_events_of_visible_sessions" on public.match_events
  for select to anon, authenticated
  using (exists (
    select 1 from public.match_sessions s
     where s.id = match_events.session_id
       and (s.umpire_id = auth.uid() or s.status in ('in_progress','completed'))
  ));

-- =========================================================
-- 4. REALTIME PUBLICATION (Section 7.9)
-- =========================================================
alter publication supabase_realtime add table public.match_sessions;