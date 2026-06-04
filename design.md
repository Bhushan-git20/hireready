# HireReady Technical Design

## Architecture Overview
HireReady is an applied AI engineering system tailored for job intelligence. The application heavily relies on Supabase for backend services (Auth, PostgreSQL Database, and Edge Functions), Vite + React for the frontend, and Google Gemini Flash for the AI capabilities.

## 🔐 Auth Flow (Supabase)
The authentication flow uses Supabase Auth for seamless and secure signups. 
1. The user authenticates on the frontend via standard email/password or OAuth providers.
2. A trigger (`on_auth_user_created`) automatically intercepts the creation of the user in the `auth.users` table and initializes a comprehensive custom profile in the `public.profiles` table.
3. **Row-Level Security (RLS)** is strictly enforced across all tables (`profiles`, `applications`, `analyses`) so that users can only ever access their own data via the `auth.uid() = user_id` policy.

## 💾 Database Schema

### `public.profiles`
Stores the user's career background and context which feeds into the AI analysis.
- `id` (uuid)
- `user_id` (uuid) -> `auth.users(id)`
- `full_name`, `cgpa`, `college`, `graduation_year`
- `skills` (text[])
- `experience_text`, `projects_text`, `resume_text`
- `target_roles` (text[])

### `public.applications`
Tracks job applications and their lifecycle.
- `id` (uuid)
- `user_id` (uuid) -> `auth.users(id)`
- `company`, `role`
- `jd_text`, `fit_grade`, `status` (applied, assessment, interview, offer, rejected, ghosted)
- `applied_date`, `notes`

### `public.analyses`
Stores the outcome of the AI-powered Job Description analysis.
- `id` (uuid)
- `application_id` (uuid) -> `public.applications(id)`
- `fit_score` (integer 0-100)
- `recommendation`, `skill_gaps` (jsonb), `matching_skills` (jsonb), `star_questions` (jsonb)
- `should_apply` (boolean)

## 📈 Scaling Notes & AI Integration
- **Edge Functions**: The AI integration with Google Gemini 2.5 Flash is entirely separated from the client and runs within Supabase Deno Edge Functions (`analyse-jd`, `interview-prep`, `rejection-analyse`). This completely isolates the API keys and allows scaling serverless execution without managing heavy backend infrastructure.
- **Data Privacy**: Storing analysis results in `jsonb` columns allows for highly flexible prompt modifications over time without requiring heavy SQL migrations.
- **Performance**: The combination of edge computing and RLS ensures extremely low latency database interactions.
