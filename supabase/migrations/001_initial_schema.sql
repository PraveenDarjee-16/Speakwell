-- ==============================================================================
-- SpeakWell Supabase Database Schema Migration
-- Tagline: Speak Better. Think Clearly. Grow Confidently.
-- Author: Senior Full-Stack & Database Architect
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (Linked with auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null default 'Learner',
  avatar_url text,
  proficiency_level text not null default 'Intermediate' check (proficiency_level in ('Beginner', 'Intermediate', 'Advanced')),
  primary_goal text not null default 'Everyday Fluency & Confidence',
  target_role text,
  daily_target_minutes integer not null default 15 check (daily_target_minutes > 0),
  streak_days integer not null default 1 check (streak_days >= 0),
  total_speaking_minutes numeric not null default 0 check (total_speaking_minutes >= 0),
  total_sessions integer not null default 0 check (total_sessions >= 0),
  average_score numeric not null default 0 check (average_score >= 0 and average_score <= 100),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. USER PREFERENCES TABLE
create table if not exists public.user_preferences (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  theme text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  enable_live_feedback boolean not null default true,
  audio_recording_consent boolean not null default true,
  data_retention_days integer not null default 365,
  default_speaking_duration integer not null default 120, -- seconds
  default_prep_time integer not null default 30, -- seconds
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. EXTEMPORE TOPICS (Publicly readable topic bank)
create table if not exists public.topics (
  id text primary key,
  title text not null,
  category text not null,
  difficulty text not null check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  background text not null,
  why_it_matters text not null,
  talking_points jsonb not null default '[]'::jsonb,
  vocabulary jsonb not null default '[]'::jsonb,
  useful_phrases jsonb not null default '[]'::jsonb,
  possible_openings jsonb not null default '[]'::jsonb,
  suggested_structure jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. PRACTICE SESSIONS (Extempore, Interviews, Conversations, etc.)
create table if not exists public.practice_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  topic_id text,
  topic_title text not null,
  session_type text not null default 'extempore' check (session_type in ('extempore', 'interview', 'conversation', 'pronunciation', 'storytelling', 'grammar')),
  duration_seconds integer not null default 0,
  word_count integer not null default 0,
  words_per_minute numeric not null default 0,
  overall_score numeric not null check (overall_score >= 0 and overall_score <= 100),
  criteria_scores jsonb not null default '[]'::jsonb,
  strengths jsonb not null default '[]'::jsonb,
  areas_for_improvement jsonb not null default '[]'::jsonb,
  priority_improvements jsonb not null default '[]'::jsonb,
  strongest_part text,
  filler_words jsonb not null default '[]'::jsonb,
  filler_percentage numeric not null default 0,
  repeated_phrases jsonb not null default '[]'::jsonb,
  transcript text not null,
  sentence_corrections jsonb not null default '[]'::jsonb,
  vocabulary_upgrades jsonb not null default '[]'::jsonb,
  recommended_next_exercise jsonb not null default '{}'::jsonb,
  recording_storage_path text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. MISTAKE RECORDS (Mistake Notebook)
create table if not exists public.mistake_records (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  session_id uuid references public.practice_sessions(id) on delete cascade not null,
  category text not null check (category in ('Verb Tense', 'Subject-Verb Agreement', 'Articles', 'Prepositions', 'Sentence Structure', 'Vocabulary Misuse', 'Pronunciation', 'Filler Words')),
  original_sentence text not null,
  corrected_sentence text not null,
  rule_explanation text not null,
  reviewed boolean not null default false,
  improved_in_subsequent_attempt boolean not null default false,
  occurred_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. VOCABULARY PROGRESS (Spaced Repetition & Bookmarks)
create table if not exists public.vocabulary_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  word_id text not null,
  status text not null default 'learning' check (status in ('new', 'learning', 'mastered')),
  bookmarked boolean not null default false,
  times_practiced integer not null default 1,
  last_reviewed timestamp with time zone default timezone('utc'::text, now()) not null,
  next_review_date timestamp with time zone default timezone('utc'::text, now() + interval '1 day') not null,
  unique(user_id, word_id)
);

-- 7. INTERVIEW SESSIONS
create table if not exists public.interview_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  target_role text not null,
  industry text not null,
  experience_level text not null,
  overall_score numeric not null check (overall_score >= 0 and overall_score <= 100),
  answers jsonb not null default '[]'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. INDEXES FOR PERFORMANCE
create index if not exists idx_practice_sessions_user on public.practice_sessions(user_id, created_at desc);
create index if not exists idx_mistake_records_user on public.mistake_records(user_id, category);
create index if not exists idx_vocab_progress_user on public.vocabulary_progress(user_id, next_review_date);
create index if not exists idx_topics_category on public.topics(category, difficulty);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: Authenticated users can only read & write their OWN data
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.topics enable row level security;
alter table public.practice_sessions enable row level security;
alter table public.mistake_records enable row level security;
alter table public.vocabulary_progress enable row level security;
alter table public.interview_sessions enable row level security;

-- Topics: Public can read all topics
create policy "Topics are readable by everyone" on public.topics
  for select using (true);

-- Profiles: Users can view and update their own profile
create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Preferences: Users can manage their own preferences
create policy "Users can manage their own preferences" on public.user_preferences
  for all using (auth.uid() = user_id);

-- Practice Sessions: Isolated by user_id
create policy "Users can read own practice sessions" on public.practice_sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert own practice sessions" on public.practice_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can delete own practice sessions" on public.practice_sessions
  for delete using (auth.uid() = user_id);

-- Mistake Records: Isolated by user_id
create policy "Users can read own mistakes" on public.mistake_records
  for select using (auth.uid() = user_id);

create policy "Users can modify own mistakes" on public.mistake_records
  for all using (auth.uid() = user_id);

-- Vocabulary Progress: Isolated by user_id
create policy "Users can manage own vocabulary progress" on public.vocabulary_progress
  for all using (auth.uid() = user_id);

-- Interview Sessions: Isolated by user_id
create policy "Users can manage own interview sessions" on public.interview_sessions
  for all using (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, proficiency_level, primary_goal)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Learner'),
    coalesce(new.raw_user_meta_data->>'proficiency_level', 'Intermediate'),
    coalesce(new.raw_user_meta_data->>'primary_goal', 'Everyday Fluency & Confidence')
  );

  insert into public.user_preferences (user_id)
  values (new.id);

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to invoke handle_new_user on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
