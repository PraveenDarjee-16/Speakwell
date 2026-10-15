-- ==============================================================================
-- SpeakWell Migration 002: Live AI Interview Extensions & Performance Indexes
-- ==============================================================================

-- 1. Ensure metadata JSONB column exists on practice_sessions for rich dialogue turns
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
      and table_name = 'practice_sessions' 
      and column_name = 'metadata'
  ) then
    alter table public.practice_sessions 
    add column metadata jsonb not null default '{}'::jsonb;
  end if;
end $$;

-- 2. Add composite index for rapid filtering of user sessions by session_type and date
create index if not exists idx_practice_sessions_user_type_date 
on public.practice_sessions (user_id, session_type, created_at desc);

-- 3. Confirm RLS is enabled on practice_sessions
alter table public.practice_sessions enable row level security;

-- 4. Confirm select policy exists for user-isolated queries
do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
      and tablename = 'practice_sessions' 
      and policyname = 'Users can view their own practice sessions'
  ) then
    create policy "Users can view their own practice sessions"
      on public.practice_sessions for select
      using (auth.uid() = user_id);
  end if;
end $$;
