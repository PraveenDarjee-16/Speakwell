# SpeakWell 🎙️
> **"Speak Better. Think Clearly. Grow Confidently."**

SpeakWell is a modern, responsive, full-stack, AI-powered English communication learning web application designed for college students, job seekers, professionals, and English learners. Built from scratch with Next.js App Router, React, TypeScript, Tailwind CSS, Lucide React, and Recharts, SpeakWell provides structured spontaneous speaking practice, STAR-method job interview preparation, interactive vocabulary drills, and diagnostic progress tracking.

---

## 🌟 Key Modules & Features

### 1. Extempore Practice Studio (Flagship Feature)
- **100+ Curated Topics** across 15 categories: Technology, Artificial Intelligence, Education, College Life, Society & Culture, Environment, Business & Economy, Entrepreneurship, Leadership, Health & Lifestyle, Social Media, Ethics & Philosophy, Current Affairs, Abstract Metaphors, and Personal Experiences.
- **Animated Topic Roulette**: Dynamic shuffle and topic card reveal with instant skip option and filters by category, difficulty, or previous attempts.
- **Structured Preparation Screen**: Background context, "Why it Matters", 3-5 key talking points, recommended vocabulary, speech openers, and suggested speech architecture.
- **Exam Mode**: One-click toggle to hide all preparation hints for realistic test and placement simulation.
- **Flexible Timers**: Select 1m, 1.5m, 2m, 3m, or custom speaking durations; optional 15s, 30s, 60s, or 120s preparation countdowns.
- **Live Speaking Studio**:
  - Real browser `MediaRecorder` audio capture (microphone permission requested on user action).
  - Real-time frequency waveform audio visualizer using Web Audio API `AnalyserNode`.
  - Live Speech Recognition (Web Speech API) with real-time word counting and filler-word detection (`um`, `uh`, `like`, `basically`, `actually`, `you know`).
  - 3-2-1 countdown, Pause/Resume, Stop & Evaluate, Discard, and manual transcript editor fallback.
- **Diagnostic Evaluation Report**:
  - Overall score out of 100 with grade calibration.
  - 8-Criterion Assessment: Fluency, Grammar, Vocabulary, Pronunciation & Intelligibility, Clarity, Topic Relevance, Organization, Delivery.
  - Side-by-side original vs. corrected sentences with grammatical rule explanations.
  - Better vocabulary alternatives and sentence restructuring suggestions.
  - Audio replay, complete transcript inspection, and JSON/Notebook export.

### 2. AI Mock Interview Studio
- Tailored for HR rounds, Campus Placements, Technical roles, and Behavioral evaluations.
- Select target job title, industry, experience tier, and question count.
- **STAR Method Coaching**: Real-time guidance for Situation, Task, Action, and Result framing.
- Supports microphone audio recording or typed responses.
- Evaluates STAR adherence, provides recruiter feedback, and generates polished model answers.

### 3. Vocabulary Lab
- Daily word of the day with simple definitions, phonetic spellings, parts of speech, and synthetic audio pronunciation.
- Synonyms, antonyms, natural spoken sentences, common mistakes, and delivery tips.
- **Interactive Quiz Game**: Multiple-choice meaning questions with instant explanations.
- **Sentence Builder Drill**: Submit sentences applying new words with active validation.
- Personal Vocabulary Notebook with bookmarks and mastered-words tracking.

### 4. Speaking Lab & Specialized Micro-Drills
- **Daily Conversations**: Interactive roleplay scenarios (networking mixer, project feedback, team negotiation).
- **Group Discussion (Solo Mode)**: Multi-perspective viewpoints (Pro vs. Con vs. Moderator) with structure roadmaps.
- **Pronunciation Lab**: Minimal pairs (`/ɪ/` vs `/iː/`, `/v/` vs `/w/`), dental fricative tongue twisters, and speech shadowing with audio reference.
- **Grammar in Speech**: Common spoken errors (dangling modifiers, prepositions with "discuss", indefinite pronouns) with interactive multiple-choice drills.

### 5. Progress Analytics & Mistake Notebook
- **Recharts Data Visualization**: Overall score progression line charts and competency radar/bar charts.
- **Mistake Notebook**: Categorizes errors (Verb Tense, Subject-Verb Agreement, Prepositions, Articles, Sentence Structure, Fillers) and tracks recurrence improvements.
- **Session History Log**: Replay previous recordings, inspect transcripts, filter by activity/score, or delete individual records.

### 6. Authentication & Instant Demo Mode
- **Dual Engine Architecture**: Full Supabase PostgreSQL & Auth integration ready.
- **Zero-Friction Demo Mode**: When Supabase credentials are not configured, SpeakWell automatically operates in an offline Demo Mode storing all practice sessions, mistakes, streaks, and bookmarks in `localStorage`.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling & Design** | Tailwind CSS v4, Custom Navy/Charcoal Design Tokens, Glassmorphism |
| **Icons & Visuals** | Lucide React |
| **Data Visualization** | Recharts (Responsive Line & Bar Charts) |
| **Audio & Speech** | Browser `MediaRecorder` API, Web Audio API `AudioContext`, Web Speech API |
| **Database & Auth** | Supabase PostgreSQL, Supabase Auth (`@supabase/ssr`, `@supabase/supabase-js`), LocalStorage Demo Store |
| **Backend & APIs** | Next.js Route Handlers (`/api/evaluate`, `/api/transcribe`, `/api/interview`) |
| **Deployment Target** | Vercel Serverless Platform |

---

## 🚀 Running Locally

### 1. Prerequisites
- Node.js `v18.17+` or `v20+` (Tested on Node `v24.21.0`)
- npm `v9+` or `v11+`

### 2. Installation
```bash
# Clone or navigate to the directory
cd speakwell

# Install dependencies (already executed)
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Test Production Build
```bash
npm run build
npm run start
```

---

## 🗄️ Supabase Database Setup

To enable persistent cloud storage and authenticated multi-device sync:

1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase project dashboard.
3. Copy and run the entire SQL migration script located at:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
   This script creates:
   - `profiles` (with automatic signup triggers)
   - `user_preferences`
   - `topics` (with 100+ seed topics)
   - `practice_sessions`
   - `mistake_records`
   - `vocabulary_progress`
   - `interview_sessions`
   - Row Level Security (RLS) policies ensuring users can only read and write their own data.
4. Copy your **Project URL** and **anon public key** from `Settings > API`.
5. Create a `.env.local` file in the project root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   AI_API_KEY=your-openai-or-groq-key-here # Optional: enables external LLM evaluation
   ```

*(Note: If you do not configure Supabase, SpeakWell runs automatically in local Demo Mode!)*

---

## 🌐 Deploying to Vercel

1. Push your repository to GitHub:
   ```bash
   git add .
   git commit -m "feat: complete SpeakWell communication learning platform"
   git branch -M main
   git remote add origin https://github.com/your-username/speakwell.git
   git push -u origin main
   ```
2. Log into [vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your `speakwell` GitHub repository.
4. Add your environment variables in the Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `AI_API_KEY` (Optional)
   - `AI_MODEL` (e.g., `gpt-4o-mini`)
   - `NEXT_PUBLIC_APP_URL` (Your Vercel domain)
5. Click **Deploy**. Vercel will build and launch SpeakWell on a global edge CDN.

---

## ⚖️ Educational Notice & Disclaimers
SpeakWell is an interactive companion designed to guide individual practice, build verbal confidence, and highlight recurring linguistic patterns. SpeakWell does not guarantee employment offers, exam ranks, or instantaneous fluency. True communication mastery is developed through deliberate, consistent practice.
